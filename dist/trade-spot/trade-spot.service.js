"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TradeSpotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeSpotService = exports.MINERAL_INITIAL_RATES = exports.CORE_BOT_PAIRS = exports.SPREAD_PCT = exports.FEE_PCT = exports.DEFAULT_PAIR = exports.isItemBase = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trade_schema_1 = require("./schemas/trade.schema");
const pool_schema_1 = require("./schemas/pool.schema");
const open_order_schema_1 = require("./schemas/open-order.schema");
const pending_tp_sl_schema_1 = require("./schemas/pending-tp-sl.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const asset_registry_service_1 = require("./asset-registry.service");
const buff_item_collections_service_1 = require("../buff-item-collections/buff-item-collections.service");
const sse_service_1 = require("./sse.service");
const item_sync_1 = require("./item-sync");
const item_trade_service_1 = require("./item-trade.service");
const trade_pairs_1 = require("./trade-pairs");
var item_sync_2 = require("./item-sync");
Object.defineProperty(exports, "isItemBase", { enumerable: true, get: function () { return item_sync_2.isItemBase; } });
var trade_pairs_2 = require("./trade-pairs");
Object.defineProperty(exports, "DEFAULT_PAIR", { enumerable: true, get: function () { return trade_pairs_2.DEFAULT_PAIR; } });
Object.defineProperty(exports, "FEE_PCT", { enumerable: true, get: function () { return trade_pairs_2.FEE_PCT; } });
Object.defineProperty(exports, "SPREAD_PCT", { enumerable: true, get: function () { return trade_pairs_2.SPREAD_PCT; } });
Object.defineProperty(exports, "CORE_BOT_PAIRS", { enumerable: true, get: function () { return trade_pairs_2.CORE_BOT_PAIRS; } });
Object.defineProperty(exports, "MINERAL_INITIAL_RATES", { enumerable: true, get: function () { return trade_pairs_2.MINERAL_INITIAL_RATES; } });
const round8 = (n) => Math.round(n * 1e8) / 1e8;
const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 1e4) / 1e4;
const MIN_TOLERANCE = 0.98;
const INT_BASES = ["ELIXCOIN", "COPPER", "IRON", "SILVER", "GOLD"];
function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const ORDER_RATE_LIMIT = 10;
const CANCEL_RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const TICKER_CACHE_MS = 3_000;
const BOOK_CACHE_MS = 3_000;
const TRADES_CACHE_MS = 5_000;
let TradeSpotService = TradeSpotService_1 = class TradeSpotService {
    tradeModel;
    poolModel;
    orderModel;
    userModel;
    assetRegistry;
    buffCollectionsService;
    sseService;
    itemTradeService;
    pendingTpSlModel;
    orderTimestamps = new Map();
    cancelTimestamps = new Map();
    tickerCache = new Map();
    bookCache = new Map();
    tradesCache = new Map();
    infoCache = new Map();
    INFO_CACHE_MS = 60_000;
    lastUserTradeImpact = new Map();
    previousMid = new Map();
    logger = new common_1.Logger(TradeSpotService_1.name);
    constructor(tradeModel, poolModel, orderModel, userModel, assetRegistry, buffCollectionsService, sseService, itemTradeService, pendingTpSlModel) {
        this.tradeModel = tradeModel;
        this.poolModel = poolModel;
        this.orderModel = orderModel;
        this.userModel = userModel;
        this.assetRegistry = assetRegistry;
        this.buffCollectionsService = buffCollectionsService;
        this.sseService = sseService;
        this.itemTradeService = itemTradeService;
        this.pendingTpSlModel = pendingTpSlModel;
        setInterval(() => this.sweepMemory(), 10 * 60 * 1000).unref();
    }
    sweepMemory() {
        const now = Date.now();
        for (const [k, arr] of this.orderTimestamps) {
            const filtered = arr.filter((t) => now - t < RATE_WINDOW_MS);
            if (filtered.length === 0)
                this.orderTimestamps.delete(k);
            else
                this.orderTimestamps.set(k, filtered);
        }
        for (const [k, arr] of this.cancelTimestamps) {
            const filtered = arr.filter((t) => now - t < RATE_WINDOW_MS);
            if (filtered.length === 0)
                this.cancelTimestamps.delete(k);
            else
                this.cancelTimestamps.set(k, filtered);
        }
        for (const [k, v] of this.lastUserTradeImpact) {
            if (now - v.time > 60_000)
                this.lastUserTradeImpact.delete(k);
        }
        for (const [k, v] of this.previousMid) {
            const impact = this.lastUserTradeImpact.get(k);
            if (!impact)
                this.previousMid.delete(k);
        }
        if (this.tickerCache.size > 500)
            this.tickerCache.clear();
        if (this.bookCache.size > 500)
            this.bookCache.clear();
        if (this.tradesCache.size > 500)
            this.tradesCache.clear();
        if (this.infoCache.size > 200)
            this.infoCache.clear();
        for (const [k, v] of this.infoCache) {
            if (now - v.ts > this.INFO_CACHE_MS)
                this.infoCache.delete(k);
        }
        if (this.tickerCache.size > 0 || this.bookCache.size > 0) {
            this.logger.debug(`[Sweep] Maps: order:${this.orderTimestamps.size} book:${this.bookCache.size} impact:${this.lastUserTradeImpact.size}`);
        }
    }
    evictRateLimit(map, telegramId, now) {
        const ts = map.get(telegramId);
        if (!ts)
            return;
        const cutoff = now - RATE_WINDOW_MS;
        const filtered = ts.filter((t) => t > cutoff);
        if (filtered.length === 0)
            map.delete(telegramId);
        else
            map.set(telegramId, filtered);
    }
    checkRateLimit(map, telegramId, limit, now) {
        this.evictRateLimit(map, telegramId, now);
        const ts = map.get(telegramId) || [];
        if (ts.length >= limit)
            return "Too many requests. Please slow down.";
        ts.push(now);
        map.set(telegramId, ts);
        return null;
    }
    async getAllActivePools() {
        return this.poolModel.find({ botEnabled: true }).exec();
    }
    async getAllPools() {
        return this.poolModel.find({}).lean().exec();
    }
    async setAdminPriceControl(pair, bidFloor, askCeiling) {
        const pool = await this.getPool(pair);
        const mid = round8((bidFloor + askCeiling) / 2);
        await this.poolModel
            .updateOne({ pair }, {
            $set: {
                adminBidFloor: bidFloor,
                adminAskCeiling: askCeiling,
                lastMid: mid,
            },
        })
            .exec();
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.logger.log(`[Admin] Price control set for ${pair}: BUY ≥ ${bidFloor} | SELL ≤ ${askCeiling} | mid = ${mid}`);
        return {
            success: true,
            pair,
            bidFloor,
            askCeiling,
            mid,
            message: `Price control active: bot trades between ${bidFloor} and ${askCeiling}`,
        };
    }
    async clearAdminPriceControl(pair) {
        await this.poolModel
            .updateOne({ pair }, { $set: { adminBidFloor: 0, adminAskCeiling: 0 } })
            .exec();
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.logger.log(`[Admin] Price control cleared for ${pair}`);
        return {
            success: true,
            pair,
            message: `Price control removed for ${pair}. Bot resumes normal drift.`,
        };
    }
    async setAdminWalls(pair, sellWalls, buyWalls) {
        const set = {};
        if (sellWalls !== undefined)
            set.adminSellWalls = sellWalls;
        if (buyWalls !== undefined)
            set.adminBuyWalls = buyWalls;
        if (Object.keys(set).length === 0) {
            return { success: false, error: "No walls provided" };
        }
        await this.poolModel.updateOne({ pair }, { $set: set }).exec();
        this.bookCache.delete(pair);
        const sellCount = sellWalls?.length ?? 0;
        const buyCount = buyWalls?.length ?? 0;
        this.logger.log(`[Admin] Walls set for ${pair}: ${sellCount} SELL + ${buyCount} BUY`);
        return {
            success: true,
            pair,
            sellWalls: sellWalls ?? [],
            buyWalls: buyWalls ?? [],
            message: `${sellCount} SELL walls + ${buyCount} BUY walls deployed for ${pair}`,
        };
    }
    async clearAdminWalls(pair) {
        await this.poolModel
            .updateOne({ pair }, { $set: { adminSellWalls: [], adminBuyWalls: [] } })
            .exec();
        this.bookCache.delete(pair);
        this.logger.log(`[Admin] Walls cleared for ${pair}`);
        return {
            success: true,
            pair,
            message: `All walls removed for ${pair}`,
        };
    }
    async getPool(pair = trade_pairs_1.DEFAULT_PAIR) {
        let pool = await this.poolModel.findOne({ pair }).exec();
        if (!pool) {
            if (trade_pairs_1.ALL_INITIAL_RATES[pair]) {
                const initialMid = trade_pairs_1.ALL_INITIAL_RATES[pair];
                const isBotEnabled = trade_pairs_1.CORE_BOT_PAIRS.has(pair);
                try {
                    pool = await this.poolModel.create({
                        pair,
                        baseReserve: 10_000_000,
                        quoteReserve: 1_000_000,
                        lastMid: initialMid,
                        spreadPct: trade_pairs_1.SPREAD_PCT,
                        feePct: trade_pairs_1.FEE_PCT,
                        midMin: initialMid * 0.5,
                        midMax: initialMid * 10,
                        botEnabled: isBotEnabled,
                    });
                }
                catch (err) {
                    if (err?.code === 11000) {
                        pool = await this.poolModel.findOne({ pair }).exec();
                    }
                    else {
                        throw err;
                    }
                }
                if (!pool) {
                    throw new Error(`Pool for ${pair} could not be created or found`);
                }
            }
            else {
                throw new Error(`Pool for ${pair} not found`);
            }
        }
        else if (pool.feePct !== trade_pairs_1.FEE_PCT) {
            pool.feePct = trade_pairs_1.FEE_PCT;
            await this.poolModel
                .updateOne({ pair }, { $set: { feePct: trade_pairs_1.FEE_PCT } })
                .exec();
        }
        const BASE_INIT = 10_000_000;
        const QUOTE_INIT = 1_000_000;
        const CRITICAL_PCT = 0.002;
        const baseLow = pool.baseReserve != null && pool.baseReserve <= BASE_INIT * CRITICAL_PCT;
        const quoteLow = pool.quoteReserve != null && pool.quoteReserve <= QUOTE_INIT * CRITICAL_PCT;
        const volNeg = (pool.volume24h && pool.volume24h < 0) || (pool.quoteVolume24h && pool.quoteVolume24h < 0);
        if (baseLow || quoteLow || volNeg) {
            const setOps = {};
            if (pool.volume24h && pool.volume24h < 0) {
                setOps.volume24h = 0;
                pool.volume24h = 0;
            }
            if (pool.quoteVolume24h && pool.quoteVolume24h < 0) {
                setOps.quoteVolume24h = 0;
                pool.quoteVolume24h = 0;
            }
            if (baseLow) {
                setOps.baseReserve = BASE_INIT;
                pool.baseReserve = BASE_INIT;
            }
            if (quoteLow) {
                setOps.quoteReserve = QUOTE_INIT;
                pool.quoteReserve = QUOTE_INIT;
            }
            if (Object.keys(setOps).length > 0) {
                await this.poolModel.updateOne({ pair }, { $set: setOps }).exec();
            }
        }
        const [poolBase, poolQuote] = pair.split("/");
        const elixcoinInvolved = poolBase === "ELIXCOIN" || poolQuote === "ELIXCOIN";
        if (elixcoinInvolved && trade_pairs_1.STABLE_ASSETS.has("ELIXCOIN")) {
            const globalMid = await this.assetRegistry.getMidFromGlobalReserves(pair);
            if (globalMid > 0 && Math.abs(globalMid - pool.lastMid) > 1e-12) {
                pool.lastMid = globalMid;
                await this.poolModel
                    .updateOne({ pair }, { $set: { lastMid: globalMid } })
                    .exec();
            }
        }
        else if (pool.adminBidFloor > 0 && pool.adminAskCeiling > 0) {
            const adminMid = round8((pool.adminBidFloor + pool.adminAskCeiling) / 2);
            pool.lastMid = adminMid;
            await this.poolModel
                .updateOne({ pair }, { $set: { lastMid: adminMid } })
                .exec();
        }
        else {
            const globalMid = await this.assetRegistry.getMidFromGlobalReserves(pair);
            if (globalMid > 0) {
                pool.lastMid = globalMid;
                await this.poolModel
                    .updateOne({ pair }, { $set: { lastMid: globalMid } })
                    .exec();
            }
        }
        const now24h = Date.now();
        if (!pool.dayResetAt ||
            now24h - pool.dayResetAt.getTime() > 24 * 3600_000) {
            const resetOps = {
                dayResetAt: new Date(),
                open24h: pool.lastMid,
                high24h: pool.lastMid,
                low24h: pool.lastMid,
                volume24h: 0,
                quoteVolume24h: 0,
                cosmeticChangePct: -1.56 + Math.random() * (2.27 - (-1.56)),
                cosmeticPctUpdatedAt: new Date(),
            };
            await this.poolModel
                .updateOne({ pair }, { $set: resetOps })
                .exec();
            pool.dayResetAt = resetOps.dayResetAt;
            pool.open24h = resetOps.open24h;
            pool.high24h = resetOps.high24h;
            pool.low24h = resetOps.low24h;
            pool.volume24h = 0;
            pool.quoteVolume24h = 0;
        }
        return pool;
    }
    async getTicker(pair = trade_pairs_1.DEFAULT_PAIR) {
        const now = Date.now();
        const cache = this.tickerCache.get(pair);
        if (cache?.data && now - cache.ts < TICKER_CACHE_MS) {
            return cache.data;
        }
        const pool = await this.getPool(pair);
        const anchorMid = pool.lastMid;
        const open = pool.open24h || anchorMid;
        const high = pool.high24h || anchorMid;
        const low = pool.low24h === Infinity ? anchorMid : pool.low24h || anchorMid;
        const volume = pool.volume24h || 0;
        const quoteVolume = pool.quoteVolume24h || 0;
        const [base, quote] = pair.split("/");
        const lastTrade = await this.tradeModel
            .findOne({ pair }, { price: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .lean();
        const close = lastTrade?.price || anchorMid;
        const changePct = open > 0 ? round4(((close - open) / open) * 100) : 0;
        const result = {
            success: true,
            pair,
            base,
            quote,
            last: round8(close),
            changePct,
            high: round8(high),
            low: round8(low),
            volume: round2(volume),
            quoteVolume: round2(quoteVolume),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
        this.tickerCache.set(pair, { data: result, ts: now });
        return result;
    }
    async getTickers(pairs) {
        return Promise.all(pairs.map((p) => this.getTicker(p)));
    }
    async getOrderBook(depth = 10, pair = trade_pairs_1.DEFAULT_PAIR, telegramId) {
        const now = Date.now();
        const clamped = Math.max(5, Math.min(25, Math.floor(depth || 10)));
        const cache = this.bookCache.get(pair);
        if (cache?.data &&
            now - cache.ts < BOOK_CACHE_MS &&
            cache.depth === clamped) {
            return cache.data;
        }
        const pool = await this.getPool(pair);
        const lastTrade = await this.tradeModel
            .findOne({ pair }, { price: 1 })
            .sort({ createdAt: -1 })
            .lean();
        const mid = lastTrade?.price || pool.lastMid;
        const half = pool.spreadPct / 2;
        const step = 0.0012;
        const asks = [];
        const bids = [];
        const magnitude = Math.pow(10, Math.floor(Math.log10(mid)) - 7);
        const minVisibleTick = Math.max(magnitude, 0.00000001);
        const pctStep = mid * step;
        const levelStep = pctStep > minVisibleTick ? pctStep : minVisibleTick;
        const halfSpreadRaw = Math.max(mid * half, minVisibleTick);
        const maxSafeDepth = Math.max(1, Math.floor((mid - halfSpreadRaw) / levelStep));
        const safeDepth = Math.min(clamped, maxSafeDepth);
        const dayNum = Math.floor(now / 86400000);
        const pairSeed = hashStr(pair);
        const poolAskEdge = round8(pool.lastMid * (1 + pool.spreadPct / 2));
        const poolBidEdge = round8(pool.lastMid * (1 - pool.spreadPct / 2));
        const impact = this.lastUserTradeImpact.get(pair);
        const savedMid = this.previousMid.get(pair) ?? mid;
        let askLagMid = mid;
        let bidLagMid = mid;
        if (impact) {
            const elapsed = Date.now() - impact.time;
            const DECAY_MS = 60_000;
            if (elapsed < DECAY_MS) {
                const decay = 1 - elapsed / DECAY_MS;
                const intensity = Math.min(1, impact.impact / 0.015);
                const lag = decay * intensity;
                if (impact.side === "BUY") {
                    bidLagMid = mid - (mid - savedMid) * lag;
                }
                else {
                    askLagMid = mid + (savedMid - mid) * lag;
                }
            }
            else {
                this.lastUserTradeImpact.delete(pair);
                this.previousMid.delete(pair);
            }
        }
        const baseAskPrice = Math.max(poolAskEdge, round8(askLagMid + halfSpreadRaw));
        const baseBidPrice = Math.min(poolBidEdge, round8(bidLagMid - halfSpreadRaw));
        for (let i = 0; i < safeDepth; i++) {
            const rngDepthAsks = mulberry32((pairSeed + dayNum * 1000003 + i * 5123) >>> 0);
            const rngDepthBids = mulberry32((pairSeed + dayNum * 1000033 + i * 7919) >>> 0);
            const askBase = rngDepthAsks() > 0.8
                ? 2_000_000 + rngDepthAsks() * 1_500_000
                : 150_000 + rngDepthAsks() * 600_000;
            const bidBase = rngDepthBids() > 0.8
                ? 2_000_000 + rngDepthBids() * 1_500_000
                : 150_000 + rngDepthBids() * 600_000;
            const askPrice = round8(baseAskPrice + levelStep * i);
            asks.push({ price: askPrice, amount: round2(askBase) });
            const bidPrice = round8(baseBidPrice - levelStep * i);
            if (bidPrice > 0) {
                bids.push({ price: bidPrice, amount: round2(bidBase) });
            }
        }
        const openOrders = await this.orderModel
            .find({ pair, status: "OPEN" })
            .limit(200)
            .lean()
            .exec();
        const [baseAsset] = pair.split("/");
        const minOrderLimit = trade_pairs_1.TRADE_LIMITS[baseAsset]?.min ?? 1;
        for (const o of openOrders) {
            if (!isFinite(o.price) || o.price <= 0)
                continue;
            const remaining = (o.amount || 0) - (o.filledAmount || 0);
            if (remaining < minOrderLimit * 0.9) {
                this.orderModel
                    .updateOne({ _id: o._id, status: "OPEN" }, { $set: { status: "FILLED" } })
                    .exec()
                    .catch(() => { });
                continue;
            }
            const isMine = !!telegramId && o.telegramId === telegramId;
            const targetList = o.side === "SELL" ? asks : bids;
            const match = targetList.find((x) => x.price === o.price);
            if (match) {
                match.amount += remaining;
                if (isMine)
                    match.isMine = true;
            }
            else {
                targetList.push({ price: o.price, amount: remaining, ...(isMine && { isMine: true }) });
            }
        }
        if (pool.adminSellWalls?.length) {
            for (const w of pool.adminSellWalls) {
                if (!w.price || !w.amount || w.amount <= 0)
                    continue;
                const wp = round8(Math.max(w.price, poolAskEdge));
                const match = asks.find((x) => x.price === wp);
                if (match) {
                    match.amount += w.amount;
                }
                else {
                    asks.push({ price: wp, amount: w.amount });
                }
            }
        }
        if (pool.adminBuyWalls?.length) {
            for (const w of pool.adminBuyWalls) {
                if (!w.price || !w.amount || w.amount <= 0)
                    continue;
                const wp = round8(Math.min(w.price, poolBidEdge));
                const match = bids.find((x) => x.price === wp);
                if (match) {
                    match.amount += w.amount;
                }
                else {
                    bids.push({ price: wp, amount: w.amount });
                }
            }
        }
        asks.sort((a, b) => a.price - b.price);
        bids.sort((a, b) => b.price - a.price);
        const consolidate = (levels) => {
            const map = new Map();
            for (const l of levels) {
                if (!isFinite(l.amount) || l.amount <= 0.000001)
                    continue;
                const hit = map.get(l.price);
                if (hit) {
                    hit.amount = hit.amount + l.amount;
                    if (l.isMine)
                        hit.isMine = true;
                }
                else {
                    map.set(l.price, { price: l.price, amount: l.amount, ...(l.isMine ? { isMine: true } : {}) });
                }
            }
            return [...map.values()]
                .map((x) => ({ ...x, amount: round2(x.amount) }))
                .filter((x) => x.amount > 0.000001);
        };
        const finAsks = consolidate(asks).slice(0, clamped);
        const finBids = consolidate(bids).slice(0, clamped);
        const totalAsk = finAsks.reduce((acc, l) => acc + l.amount, 0);
        const totalBid = finBids.reduce((acc, l) => acc + l.amount, 0);
        const bidShare = totalAsk + totalBid > 0 ? (totalBid / (totalAsk + totalBid)) * 100 : 50;
        const prevTrade = lastTrade
            ? await this.tradeModel
                .findOne({ pair, _id: { $ne: lastTrade._id } }, { price: 1 })
                .sort({ createdAt: -1 })
                .lean()
            : null;
        const result = {
            success: true,
            pair,
            mid: round8(mid),
            prevMid: round8(prevTrade?.price || mid),
            spread: round8(finAsks[0]?.price - finBids[0]?.price || 0),
            asks: finAsks,
            bids: finBids,
            bidShare: Math.max(0, Math.min(100, round2(bidShare))),
        };
        this.bookCache.set(pair, { data: result, ts: now, depth: clamped });
        return result;
    }
    async getCandles(pair = trade_pairs_1.DEFAULT_PAIR, interval = "15m", limit = 120) {
        const INTERVALS = {
            "1m": { unit: "minute", binSize: 1, seconds: 60 },
            "5m": { unit: "minute", binSize: 5, seconds: 300 },
            "15m": { unit: "minute", binSize: 15, seconds: 900 },
            "1H": { unit: "hour", binSize: 1, seconds: 3600 },
            "4H": { unit: "hour", binSize: 4, seconds: 14400 },
            "1D": { unit: "day", binSize: 1, seconds: 86400 },
        };
        const cfg = INTERVALS[interval] || INTERVALS["15m"];
        const resolvedInterval = INTERVALS[interval] ? interval : "15m";
        const n = Math.max(5, Math.min(500, Math.floor(limit || 120)));
        const since = new Date(Date.now() - cfg.seconds * n * 1000);
        const rows = await this.tradeModel
            .aggregate([
            { $match: { pair, createdAt: { $gte: since } } },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: { $dateTrunc: { date: "$createdAt", unit: cfg.unit, binSize: cfg.binSize } },
                    open: { $first: "$price" },
                    high: { $max: "$price" },
                    low: { $min: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$amount" },
                    trades: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $limit: n },
        ])
            .exec();
        return {
            success: true,
            pair,
            interval: resolvedInterval,
            candles: rows.map((r) => ({
                time: Math.floor(new Date(r._id).getTime() / 1000),
                open: round8(r.open),
                high: round8(r.high),
                low: round8(r.low),
                close: round8(r.close),
                volume: round2(r.volume || 0),
                trades: r.trades || 0,
            })),
        };
    }
    async getTrades(limit = 30, pair = trade_pairs_1.DEFAULT_PAIR) {
        const now = Date.now();
        const n = Math.max(1, Math.min(100, Math.floor(limit || 30)));
        const cache = this.tradesCache.get(pair);
        if (cache?.data && now - cache.ts < TRADES_CACHE_MS && cache.limit === n) {
            return cache.data;
        }
        const trades = await this.tradeModel
            .find({ pair })
            .sort({ createdAt: -1 })
            .limit(n)
            .lean()
            .exec();
        const result = {
            success: true,
            trades: trades.map((t) => ({
                id: String(t._id),
                side: t.side,
                price: t.price,
                amount: t.amount,
                total: t.total,
                fee: t.fee,
                source: t.source,
                time: t.createdAt,
            })),
        };
        this.tradesCache.set(pair, { data: result, ts: now, limit: n });
        return result;
    }
    async getStats(pair = trade_pairs_1.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const botTrades = await this.tradeModel
            .countDocuments({ pair, source: "BOT" })
            .exec();
        const userTrades = await this.tradeModel
            .countDocuments({ pair, source: "USER" })
            .exec();
        return {
            success: true,
            lastBotRunAt: pool.lastBotRunAt,
            botRunCount: pool.botRunCount,
            botTrades,
            userTrades,
            totalTrades: botTrades + userTrades,
            lifetimeVolume: round2(pool.lifetimeVolume),
            platformFeesAccumulated: round4(pool.platformFeesAccumulated),
            spreadProfitAccumulated: round4(pool.spreadProfitAccumulated),
            quoteReserve: round2(pool.quoteReserve ?? pool.elixirReserve ?? 0),
            baseReserve: round2(pool.baseReserve ?? pool.elixcoinReserve ?? 0),
            lastMid: round8(pool.lastMid),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
    }
    async getInfo(pair = trade_pairs_1.DEFAULT_PAIR) {
        const cached = this.infoCache.get(pair);
        if (cached && Date.now() - cached.ts < this.INFO_CACHE_MS)
            return cached.data;
        const pool = await this.getPool(pair);
        const since24 = new Date(Date.now() - 24 * 3600 * 1000);
        const agg24 = await this.tradeModel
            .aggregate([
            { $match: { pair, createdAt: { $gte: since24 } } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    volume: { $sum: "$amount" },
                    fees: { $sum: "$fee" },
                    buyVolume: {
                        $sum: { $cond: [{ $eq: ["$side", "BUY"] }, "$amount", 0] },
                    },
                    sellVolume: {
                        $sum: { $cond: [{ $eq: ["$side", "SELL"] }, "$amount", 0] },
                    },
                    botVolume: {
                        $sum: { $cond: [{ $eq: ["$source", "BOT"] }, "$amount", 0] },
                    },
                    userVolume: {
                        $sum: { $cond: [{ $eq: ["$source", "USER"] }, "$amount", 0] },
                    },
                },
            },
        ])
            .exec();
        const a = agg24[0] || {};
        const buckets = await this.tradeModel
            .aggregate([
            { $match: { pair, createdAt: { $gte: since24 } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d %H", date: "$createdAt" },
                    },
                    volume: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ])
            .exec();
        const bucketMap = new Map();
        for (const b of buckets) {
            bucketMap.set(String(b._id), { volume: b.volume, count: b.count });
        }
        const start = since24.getTime();
        const hourly = [];
        for (let i = 0; i < 24; i++) {
            const t = new Date(start + i * 3600_000);
            const key = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")} ${String(t.getUTCHours()).padStart(2, "0")}`;
            const b = bucketMap.get(key);
            hourly.push({
                hour: t.getUTCHours(),
                label: `${String(t.getUTCHours()).padStart(2, "0")}:00`,
                volume: round2(b?.volume || 0),
                count: b?.count || 0,
            });
        }
        const botTrades = await this.tradeModel
            .countDocuments({ pair, source: "BOT" })
            .exec();
        const userTrades = await this.tradeModel
            .countDocuments({ pair, source: "USER" })
            .exec();
        const [base, quote] = pair.split("/");
        const result = {
            success: true,
            pair,
            base,
            quote,
            last: round8(pool.lastMid),
            day: {
                trades: a.count || 0,
                volume: round2(a.volume || 0),
                quoteVolume: round2((a.volume || 0) * pool.lastMid),
                fees: round2(a.fees || 0),
                buyVolume: round2(a.buyVolume || 0),
                sellVolume: round2(a.sellVolume || 0),
                botVolume: round2(a.botVolume || 0),
                userVolume: round2(a.userVolume || 0),
            },
            lifetime: {
                trades: botTrades + userTrades,
                botTrades,
                userTrades,
                volume: round2(pool.lifetimeVolume),
                fees: round4(pool.platformFeesAccumulated),
                spreadProfit: round4(pool.spreadProfitAccumulated),
            },
            pool: {
                quoteReserve: round2(pool.quoteReserve ?? pool.elixirReserve ?? 0),
                baseReserve: round2(pool.baseReserve ?? pool.elixcoinReserve ?? 0),
                lastMid: round8(pool.lastMid),
                feePct: pool.feePct,
                spreadPct: pool.spreadPct,
            },
            hourly,
        };
        this.infoCache.set(pair, { data: result, ts: Date.now() });
        return result;
    }
    async getBotStatus(pair = trade_pairs_1.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const stats = await this.getStats(pair);
        const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
        const lastRun = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : null;
        return {
            ...stats,
            pair,
            enabled: pool.botEnabled !== false,
            intervalMinutes: pool.botIntervalMinutes ?? 15,
            tradesPerCycle: pool.botTradesPerCycle ?? 10,
            lastBotRunAt: pool.lastBotRunAt ?? null,
            nextBotRunAt: lastRun ? new Date(lastRun + intervalMs) : new Date(),
        };
    }
    async updateBotConfig(body) {
        const pair = body.pair || trade_pairs_1.DEFAULT_PAIR;
        const pool = await this.getPool(pair);
        const set = {};
        if (typeof body.enabled === "boolean")
            set.botEnabled = body.enabled;
        if (body.intervalMinutes !== undefined) {
            const m = Number(body.intervalMinutes);
            if (!isFinite(m) || m < 1 || m > 60) {
                return {
                    success: false,
                    error: "Cooldown must be between 1 and 60 minutes",
                };
            }
            set.botIntervalMinutes = Math.round(m);
        }
        if (body.tradesPerCycle !== undefined) {
            const t = Number(body.tradesPerCycle);
            if (!isFinite(t) || t < 2 || t > 100) {
                return {
                    success: false,
                    error: "Trades per cycle must be between 2 and 100",
                };
            }
            set.botTradesPerCycle = Math.round(t);
        }
        if (Object.keys(set).length > 0) {
            await this.poolModel.updateOne({ pair }, { $set: set }).exec();
        }
        const status = await this.getBotStatus(pair);
        return { ...status, success: true };
    }
    async getHoldings(telegramId, pair = trade_pairs_1.DEFAULT_PAIR) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        const [base, quote] = pair.split("/");
        const crypto = user?.cryptoBalances;
        let baseBalance = 0;
        if (this.itemTradeService.isItem(base)) {
            baseBalance = await this.itemTradeService.getItemBalance(telegramId, base);
        }
        else {
            baseBalance = base === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[base] || 0;
        }
        return {
            success: true,
            base,
            quote,
            baseBalance: round4(baseBalance),
            quoteBalance: round4(quote === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[quote] || 0),
            elixcoin: round4(crypto?.["ELIXCOIN"] || 0),
            elixir: round4(user?.elixirBalance || 0),
        };
    }
    async getMaxTradeable(telegramId, pair = trade_pairs_1.DEFAULT_PAIR, side = "BUY") {
        const pool = await this.getPool(pair);
        const [base, quote] = pair.split("/");
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return { success: false, error: "Account not found" };
        const crypto = user.cryptoBalances;
        const materials = user?.materials;
        const quoteBalance = quote === "ELIXIR" ? user.elixirBalance || 0 : crypto?.[quote] || 0;
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const ask = mid * (1 + half);
        const bid = mid * (1 - half);
        if (side.toUpperCase() === "SELL") {
            let baseBalance = 0;
            if ((0, item_sync_1.isMaterialBase)(base)) {
                const displayName = (0, item_sync_1.slugToMaterialName)(base);
                baseBalance = materials?.[displayName] ?? 0;
            }
            else if (!item_sync_1.COIN_BASES.has(base.toUpperCase())) {
                baseBalance = await this.buffCollectionsService.countBuffInstances(telegramId, base.toLowerCase());
            }
            else {
                baseBalance = base === "ELIXIR" ? user.elixirBalance || 0 : crypto?.[base] || 0;
            }
            const isMineral = ["ELIXCOIN", "COPPER", "IRON", "SILVER", "GOLD"].includes(base);
            const safeMaxBase = (base === "ELIXCOIN" || isMineral || (0, item_sync_1.isItemBase)(base))
                ? Math.floor(baseBalance)
                : baseBalance;
            return {
                success: true,
                maxBase: safeMaxBase,
                maxQuote: round4(safeMaxBase * bid),
                price: round8(bid),
                base,
                quote,
            };
        }
        const maxBase = quoteBalance / ask;
        const maxQuote = Math.floor(quoteBalance * 10000) / 10000;
        return {
            success: true,
            maxBase: (0, item_sync_1.isItemBase)(base) ? Math.floor(maxBase) : maxBase,
            maxQuote,
            price: round8(ask),
            base,
            quote,
        };
    }
    async placeOrder(telegramId, body) {
        const rateErr = this.checkRateLimit(this.orderTimestamps, telegramId, ORDER_RATE_LIMIT, Date.now());
        if (rateErr)
            return { success: false, error: rateErr };
        const pair = body.pair || trade_pairs_1.DEFAULT_PAIR;
        const [base, quote] = pair.split("/");
        const pool = await this.getPool(pair);
        const side = String(body.side || "").toUpperCase();
        if (side !== "BUY" && side !== "SELL")
            return { success: false, error: "Invalid side" };
        const type = String(body.type || "market").toLowerCase();
        if (type !== "market" && type !== "limit")
            return { success: false, error: "Invalid order type" };
        const amount = Number(body.amount);
        if (!isFinite(amount) || amount <= 0)
            return { success: false, error: "Invalid amount" };
        const MIN_AMOUNT = 1;
        if (amount < MIN_AMOUNT)
            return {
                success: false,
                error: `Minimum order is ${MIN_AMOUNT} ${base}`,
            };
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { success: false, error: "Account not found" };
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const ask = mid * (1 + half);
        const bid = mid * (1 - half);
        const finishUserFills = async (poolTrade, crossFills, crossBase) => {
            const taker = await this.userModel.findOne({ telegramId }).exec();
            const crypto = taker?.cryptoBalances;
            const allTrades = poolTrade ? [...(crossFills || []), poolTrade] : (crossFills || []);
            const filledBase = poolTrade
                ? round2((crossBase || 0) + (poolTrade.amount || 0))
                : (crossBase || 0);
            return {
                success: true,
                resting: false,
                trade: allTrades[0],
                trades: allTrades,
                userFilledBase: filledBase,
                balances: {
                    quoteBalance: round4(crypto?.[pair.split("/")[1]] ?? taker?.elixirBalance ?? 0),
                    elixir: round4(taker?.elixirBalance ?? 0),
                    elixcoin: round4(crypto?.["ELIXCOIN"] ?? 0),
                },
                message: `Filled ${filledBase} ${pair.split("/")[0]} via orderbook.`,
            };
        };
        if (type === "market") {
            const execPrice = side === "BUY" ? ask : bid;
            const cross = await this.matchCounterpartyOrders({
                pair, takerId: telegramId, takerSide: side,
                limit: round8(execPrice), amount: round2(amount), market: true,
            });
            if (cross.error)
                return { success: false, error: cross.error };
            const remaining = round2(round2(amount) - cross.filledBase);
            if (remaining <= 0)
                return finishUserFills(undefined, cross.fills, cross.filledBase);
            const result = await this.executeFill(pair, telegramId, side, round2(remaining), round8(execPrice), "USER");
            if (result.success && ((body.tpPrice ?? 0) > 0 || (body.slPrice ?? 0) > 0)) {
                await this.createTpSlOrder(telegramId, pair, side, round2(remaining), body.tpPrice ?? 0, body.slPrice ?? 0);
            }
            if (!result.success) {
                if (cross.filledBase > 0) {
                    return { success: false, error: result.error, userFilledBase: cross.filledBase, trades: cross.fills };
                }
                return result;
            }
            if (cross.filledBase > 0)
                return finishUserFills(result.trade, cross.fills, cross.filledBase);
            return result;
        }
        const limit = Number(body.price);
        if (!isFinite(limit) || limit <= 0)
            return { success: false, error: "Invalid limit price" };
        const useIceberg = body.iceberg === true && body.icebergChunkSize > 0;
        let crossFilled = 0;
        let crossTrades = [];
        if (!useIceberg) {
            const cross = await this.matchCounterpartyOrders({
                pair, takerId: telegramId, takerSide: side,
                limit: round8(limit), amount: round2(amount),
            });
            if (cross.error)
                return { success: false, error: cross.error };
            crossFilled = cross.filledBase;
            crossTrades = cross.fills;
        }
        const remaining = round2(round2(amount) - crossFilled);
        if (remaining <= 0)
            return finishUserFills(undefined, crossTrades, crossFilled);
        if (side === "BUY" && limit >= ask) {
            const poolRes = await this.executeFill(pair, telegramId, "BUY", round2(remaining), round8(ask), "USER");
            if (!poolRes.success)
                return poolRes;
            return finishUserFills(poolRes.trade, crossTrades, crossFilled);
        }
        if (side === "SELL" && limit <= bid) {
            const poolRes = await this.executeFill(pair, telegramId, "SELL", round2(remaining), round8(bid), "USER");
            if (!poolRes.success)
                return poolRes;
            return finishUserFills(poolRes.trade, crossTrades, crossFilled);
        }
        const chunkSize = useIceberg ? Math.min(round2(body.icebergChunkSize), round2(remaining)) : round2(remaining);
        const totalChunks = useIceberg ? Math.ceil(remaining / chunkSize) : 1;
        const order = await this.orderModel.create({
            pair,
            telegramId,
            side,
            price: round8(limit),
            amount: round2(chunkSize),
            status: "OPEN",
            iceberg: useIceberg,
            icebergTotal: round2(remaining),
            icebergChunkSize: round2(chunkSize),
            icebergChunksFilled: 0,
        });
        const restedMsg = crossFilled > 0
            ? `Partially filled ${round2(crossFilled)} via orderbook — remainder resting @ ${round8(limit)}`
            : useIceberg
                ? `Iceberg order placed — ${totalChunks} chunks of ${round2(chunkSize)} @ ${round8(limit)}`
                : `Limit order placed — fills when the market crosses ${round8(limit)}`;
        return {
            success: true,
            resting: true,
            trades: crossTrades.length > 0 ? crossTrades : undefined,
            userFilledBase: crossFilled > 0 ? crossFilled : undefined,
            order: {
                id: String(order._id),
                side,
                price: order.price,
                amount: order.amount,
                status: "OPEN",
                iceberg: useIceberg,
                icebergTotal: useIceberg ? round2(remaining) : undefined,
                icebergChunkSize: useIceberg ? round2(chunkSize) : undefined,
            },
            message: restedMsg,
        };
    }
    async createTpSlOrder(telegramId, pair, originalSide, amount, tpPrice, slPrice) {
        if (!tpPrice && !slPrice)
            return;
        try {
            const PendingTpSl = this.pendingTpSlModel;
            if (!PendingTpSl)
                return;
            await PendingTpSl.create({
                telegramId,
                pair,
                originalSide,
                amount,
                tpPrice: tpPrice || 0,
                slPrice: slPrice || 0,
            });
        }
        catch {
        }
    }
    async checkTpSlOrders(pair, currentPrice) {
        try {
            const PendingTpSl = this.pendingTpSlModel;
            if (!PendingTpSl)
                return;
            const pending = await PendingTpSl.find({
                pair,
                triggered: false,
                cancelled: false,
            })
                .limit(100)
                .exec();
            for (const order of pending) {
                const shouldTrigger = (order.tpPrice > 0 && currentPrice >= order.tpPrice) ||
                    (order.slPrice > 0 && currentPrice <= order.slPrice);
                if (!shouldTrigger)
                    continue;
                const sellSide = order.originalSide === "BUY" ? "SELL" : "BUY";
                const result = await this.executeFill(pair, order.telegramId, sellSide, order.amount, round8(currentPrice), "USER");
                await PendingTpSl.updateOne({ _id: order._id }, { $set: { triggered: true, triggeredAt: new Date() } }).exec();
                if (result.success) {
                    this.logger.log(`[TP/SL] Triggered ${order.tpPrice ? 'TP' : 'SL'} for ${order.telegramId} on ${pair} @ ${currentPrice}`);
                }
            }
        }
        catch {
        }
    }
    checkMinMax(pair, side, amount, price) {
        const [baseAsset] = pair.split("/");
        const limitsKey = side === "BUY" ? pair.split("/")[1] : baseAsset;
        const limits = trade_pairs_1.TRADE_LIMITS[limitsKey];
        if (!limits)
            return null;
        if (side === "BUY") {
            const spendQuote = round4(amount * price);
            if (spendQuote < limits.min * MIN_TOLERANCE)
                return `Minimum trade is ${limits.min} ${limitsKey}`;
            if (spendQuote > limits.max)
                return `Maximum trade is ${limits.max} ${limitsKey}`;
        }
        else {
            if (amount < limits.min * MIN_TOLERANCE)
                return `Minimum trade is ${limits.min} ${limitsKey}`;
            if (amount > limits.max)
                return `Maximum trade is ${limits.max} ${limitsKey}`;
        }
        return null;
    }
    async fillUserVsUser(opts) {
        const { pair, buyerId, sellerId, takerId, takerSide } = opts;
        const [base, quote] = pair.split("/");
        const baseKey = base === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${base}`;
        const quoteKey = quote === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${quote}`;
        const itemBase = (0, item_sync_1.isItemBase)(base);
        const intBase = INT_BASES.includes(base) || itemBase;
        const qty = intBase ? Math.floor(opts.baseQty) : round8(opts.baseQty);
        if (!(qty > 0))
            return { success: false, error: "dust" };
        const price = round8(opts.price);
        const grossQuote = round4(qty * price);
        if (!(grossQuote > 0))
            return { success: false, error: "dust" };
        let takerFee = 0;
        let takerFeeCurrency = quote;
        if (takerSide === "BUY") {
            if (itemBase) {
                takerFee = round4(grossQuote * trade_pairs_1.FEE_PCT);
                takerFeeCurrency = quote;
            }
            else {
                takerFee = round4(qty * trade_pairs_1.FEE_PCT);
                takerFeeCurrency = base;
            }
        }
        else {
            takerFee = round4(grossQuote * trade_pairs_1.FEE_PCT);
            takerFeeCurrency = quote;
        }
        const buyerPaysQuote = itemBase && takerSide === "BUY" ? round4(grossQuote + takerFee) : grossQuote;
        let buyerGetsBase = qty;
        if (takerSide === "BUY" && !itemBase) {
            buyerGetsBase = round4(qty - takerFee);
            if (["COPPER", "IRON", "SILVER", "GOLD"].includes(base))
                buyerGetsBase = Math.floor(buyerGetsBase);
        }
        if (itemBase)
            buyerGetsBase = Math.floor(qty);
        const sellerProceeds = takerSide === "SELL" ? round4(grossQuote - takerFee) : grossQuote;
        if (takerSide === "BUY") {
            const ok = await this.userModel
                .findOneAndUpdate({ telegramId: takerId, [quoteKey]: { $gte: Math.max(0, buyerPaysQuote - 0.0001) } }, { $inc: { [quoteKey]: -buyerPaysQuote } }, { returnDocument: "after" })
                .exec();
            if (!ok)
                return { success: false, takerShort: true, error: `Insufficient ${quote} balance` };
        }
        else if (itemBase) {
            const have = await this.itemTradeService.getItemBalance(takerId, base);
            if (have < Math.floor(qty))
                return { success: false, takerShort: true, error: `Insufficient ${base} balance` };
            const taken = await this.itemTradeService.deductItem(takerId, base, Math.floor(qty));
            if (!taken)
                return { success: false, takerShort: true, error: `Insufficient ${base} balance` };
        }
        else {
            const ok = await this.userModel
                .findOneAndUpdate({ telegramId: takerId, [baseKey]: { $gte: Math.max(0, qty - 0.0001) } }, { $inc: { [baseKey]: -qty } }, { returnDocument: "after" })
                .exec();
            if (!ok)
                return { success: false, takerShort: true, error: `Insufficient ${base} balance` };
        }
        const refundTaker = async () => {
            try {
                if (takerSide === "BUY") {
                    await this.userModel.updateOne({ telegramId: takerId }, { $inc: { [quoteKey]: buyerPaysQuote } }).exec();
                }
                else if (itemBase) {
                    await this.itemTradeService.grantItem(takerId, base, Math.floor(qty));
                }
                else {
                    await this.userModel.updateOne({ telegramId: takerId }, { $inc: { [baseKey]: qty } }).exec();
                }
            }
            catch (e) {
                this.logger.error(`[UserMatch] taker refund failed ${takerId} ${pair}: ${e?.message}`);
            }
        };
        const makerId = takerSide === "BUY" ? sellerId : buyerId;
        if (takerSide === "BUY") {
            if (itemBase) {
                const have = await this.itemTradeService.getItemBalance(makerId, base);
                if (have < Math.floor(qty)) {
                    await refundTaker();
                    return { success: false, error: "maker-stale" };
                }
                const taken = await this.itemTradeService.deductItem(makerId, base, Math.floor(qty));
                if (!taken) {
                    await refundTaker();
                    return { success: false, error: "maker-stale" };
                }
            }
            else {
                const ok = await this.userModel
                    .findOneAndUpdate({ telegramId: makerId, [baseKey]: { $gte: Math.max(0, qty - 0.0001) } }, { $inc: { [baseKey]: -qty } }, { returnDocument: "after" })
                    .exec();
                if (!ok) {
                    await refundTaker();
                    return { success: false, error: "maker-stale" };
                }
            }
        }
        else {
            const ok = await this.userModel
                .findOneAndUpdate({ telegramId: makerId, [quoteKey]: { $gte: Math.max(0, grossQuote - 0.0001) } }, { $inc: { [quoteKey]: -grossQuote } }, { returnDocument: "after" })
                .exec();
            if (!ok) {
                await refundTaker();
                return { success: false, error: "maker-stale" };
            }
        }
        if (takerSide === "BUY") {
            if (itemBase) {
                if (buyerGetsBase > 0)
                    await this.itemTradeService.grantItem(buyerId, base, Math.floor(buyerGetsBase));
                await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: grossQuote } }).exec();
            }
            else {
                await this.userModel.updateOne({ telegramId: buyerId }, { $inc: { [baseKey]: buyerGetsBase } }).exec();
                await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: grossQuote } }).exec();
            }
        }
        else {
            if (itemBase) {
                if (Math.floor(qty) > 0)
                    await this.itemTradeService.grantItem(buyerId, base, Math.floor(qty));
                await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: sellerProceeds } }).exec();
            }
            else {
                await this.userModel.updateOne({ telegramId: buyerId }, { $inc: { [baseKey]: qty } }).exec();
                await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: sellerProceeds } }).exec();
            }
        }
        await this.poolModel
            .updateOne({ pair }, {
            $inc: { platformFeesAccumulated: takerFee, lifetimeVolume: qty, volume24h: qty, quoteVolume24h: grossQuote },
            $max: { high24h: price },
            $min: { low24h: price },
        })
            .exec();
        const takerTrade = await this.tradeModel.create({
            pair, side: takerSide, price, amount: qty, total: grossQuote,
            fee: takerFee, feeCurrency: takerFeeCurrency, source: "USER", telegramId: takerId,
        });
        const makerSide = takerSide === "BUY" ? "SELL" : "BUY";
        const makerTrade = await this.tradeModel.create({
            pair, side: makerSide, price, amount: qty, total: grossQuote,
            fee: 0, feeCurrency: quote, source: "USER", telegramId: makerId,
        });
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.tradesCache.delete(pair);
        this.sseService.broadcast(pair, "trade", {
            side: takerSide, price, amount: qty, total: grossQuote,
            fee: takerFee, feeCurrency: takerFeeCurrency, source: "USER", pair,
            time: Date.now(),
        });
        this.sseService.broadcast(pair, "ticker", await this.getTicker(pair));
        this.checkTpSlOrders(pair, price).catch(() => { });
        return {
            success: true, filledBase: qty, grossQuote, takerFee,
            takerTradeId: String(takerTrade._id), makerTradeId: String(makerTrade._id),
        };
    }
    async matchCounterpartyOrders(opts) {
        const { pair, takerId, takerSide, limit, market } = opts;
        const oppSide = takerSide === "BUY" ? "SELL" : "BUY";
        const gateError = this.checkMinMax(pair, takerSide, round2(opts.amount), round8(limit));
        if (gateError)
            return { filledBase: 0, fills: [], error: gateError };
        const priceCond = market
            ? {}
            : takerSide === "BUY" ? { price: { $lte: round8(limit) } } : { price: { $gte: round8(limit) } };
        const sortSpec = takerSide === "BUY" ? { price: 1, createdAt: 1 } : { price: -1, createdAt: 1 };
        const makers = await this.orderModel
            .find({ pair, status: "OPEN", side: oppSide, iceberg: { $ne: true }, telegramId: { $ne: takerId }, ...priceCond })
            .sort(sortSpec)
            .limit(50)
            .lean()
            .exec();
        let remaining = round2(opts.amount);
        const fills = [];
        const levelsUsed = new Set();
        for (const m of makers) {
            if (!(remaining > 0))
                break;
            const makerRemaining = round2((m.amount || 0) - (m.filledAmount || 0));
            if (!(makerRemaining > 0))
                continue;
            if (!levelsUsed.has(m.price) && levelsUsed.size >= 3)
                break;
            const fillQty = Math.min(remaining, makerRemaining);
            const res = await this.fillUserVsUser({
                pair,
                buyerId: takerSide === "BUY" ? takerId : String(m.telegramId),
                sellerId: takerSide === "BUY" ? String(m.telegramId) : takerId,
                baseQty: fillQty,
                price: m.price,
                takerId,
                takerSide,
            });
            if (!res.success) {
                if (res.takerShort)
                    break;
                continue;
            }
            const newFilled = round2((m.filledAmount || 0) + (res.filledBase || 0));
            const [baseAsset] = pair.split("/");
            const minOrderLimit = trade_pairs_1.TRADE_LIMITS[baseAsset]?.min ?? 1;
            const done = (m.amount || 0) - newFilled < minOrderLimit * 0.9;
            await this.orderModel
                .updateOne({ _id: m._id, status: "OPEN" }, { $set: { filledAmount: newFilled, status: done ? "FILLED" : "OPEN" } })
                .exec();
            remaining = round2(remaining - (res.filledBase || 0));
            if ((res.filledBase || 0) > 0)
                levelsUsed.add(m.price);
            fills.push({ tradeId: res.takerTradeId, makerTradeId: res.makerTradeId, price: m.price, qty: res.filledBase });
            if (!(remaining > 0))
                break;
        }
        return { filledBase: round2(opts.amount - remaining), fills };
    }
    async executeFill(pair, telegramId, side, amount, basePrice, source) {
        if (source === "USER" && !telegramId)
            return { success: false, error: "Missing account" };
        if (source === "USER") {
            const limitError = this.checkMinMax(pair, side, amount, basePrice);
            if (limitError)
                return { success: false, error: limitError };
        }
        const pool = await this.getPool(pair);
        let price = basePrice;
        let shiftPct = 0;
        if (source === "USER") {
            const impactRatio = amount / Math.max(1, pool.baseReserve ?? 10_000_000);
            shiftPct = Math.min(0.015, impactRatio * 0.5);
            price = side === "BUY"
                ? round8(basePrice * (1 + shiftPct))
                : round8(basePrice * (1 - shiftPct));
        }
        const [base, quote] = pair.split("/");
        const baseKey = base === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${base}`;
        const quoteKey = quote === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${quote}`;
        let updated = null;
        let fee = 0;
        let feeCurrency = base;
        let receivedBase = 0;
        if (side === "BUY") {
            const spendQuote = round4(amount * price);
            const itemBase = (0, item_sync_1.isItemBase)(base);
            let actualSpend = 0;
            if (itemBase) {
                fee = round4(spendQuote * trade_pairs_1.FEE_PCT);
                actualSpend = round4(spendQuote + fee);
                receivedBase = amount;
                feeCurrency = quote;
                updated = await this.userModel
                    .findOneAndUpdate({ telegramId, [quoteKey]: { $gte: actualSpend } }, { $inc: { [quoteKey]: -actualSpend } }, { returnDocument: "after" })
                    .exec();
                if (!updated)
                    return { success: false, error: `Insufficient ${quote} balance` };
                const qty = Math.floor(receivedBase);
                if (source === "USER" && qty > 0) {
                    await this.itemTradeService.grantItem(telegramId, base, qty);
                }
            }
            else {
                fee = round4(amount * trade_pairs_1.FEE_PCT);
                receivedBase = round4(amount - fee);
                if (["COPPER", "IRON", "SILVER", "GOLD"].includes(base)) {
                    receivedBase = Math.floor(receivedBase);
                }
                actualSpend = spendQuote;
                feeCurrency = base;
                const gteCheck = Math.max(0, spendQuote - 0.0001);
                updated = await this.userModel
                    .findOneAndUpdate({ telegramId, [quoteKey]: { $gte: gteCheck } }, { $inc: { [quoteKey]: -spendQuote, [baseKey]: receivedBase } }, { returnDocument: "after" })
                    .exec();
                if (!updated)
                    return { success: false, error: `Insufficient ${quote} balance` };
            }
            if (source === "USER") {
                this.previousMid.set(pair, pool.lastMid);
            }
            const whaleThreshold = side === "BUY" ? (pool.quoteReserve || 0) * 0.03 : (pool.baseReserve || 0) * 0.03;
            const whaleSize = side === "BUY" ? round4(amount * basePrice) : amount;
            const isWhale = source === "USER" && whaleThreshold > 0 && whaleSize > whaleThreshold;
            if (isWhale) {
                this.logger.warn(`[WHALE-GUARD] ${side} ${amount} ${pair.split("/")[0]} by ${telegramId} ` +
                    `(size ${whaleSize} > 3% reserve ${round4(whaleThreshold)}) — instant fill, impact suppressed.`);
            }
            const midNudge = source === "USER" && !isWhale ? shiftPct * 0.5 : 0;
            const newMid = round8(pool.lastMid * (1 + midNudge));
            if (source === "USER" && !isWhale) {
                this.lastUserTradeImpact.set(pair, {
                    side: "BUY",
                    time: Date.now(),
                    impact: shiftPct,
                });
            }
            await this.poolModel
                .updateOne({ pair }, {
                $inc: {
                    baseReserve: -amount,
                    quoteReserve: actualSpend,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: round4(Math.abs(price - pool.lastMid) * amount),
                },
                $set: { lastMid: newMid },
            })
                .exec();
            await this.assetRegistry.updateReservesAfterFill(base, quote, -receivedBase, actualSpend);
            const updatedPairs = await this.assetRegistry.propagateToAffectedPools(base, quote);
            if (updatedPairs.length > 0) {
                this.logger.log(`[CrossPair] BUY ${pair}: propagated to ${updatedPairs.join(', ')}`);
            }
            const total = actualSpend;
            const trade = await this.tradeModel.create({
                pair, side, price, amount, total, fee, feeCurrency, source,
                ...(source === "USER" ? { telegramId } : {}),
            });
            await this.poolModel
                .updateOne({ pair }, {
                $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: actualSpend },
                $max: { high24h: price },
                $min: { low24h: price },
            })
                .exec();
            this.tickerCache.delete(pair);
            this.bookCache.delete(pair);
            this.tradesCache.delete(pair);
            this.sseService.broadcast(pair, "trade", {
                side, price, amount, total, fee, feeCurrency, source, pair,
                time: Date.now(),
            });
            this.sseService.broadcast(pair, "ticker", await this.getTicker(pair));
            this.checkTpSlOrders(pair, price).catch(() => { });
            const crypto = updated?.cryptoBalances;
            return {
                success: true,
                resting: false,
                trade: { id: String(trade._id), side, price, amount, total, fee, feeCurrency, source },
                balances: {
                    quoteBalance: round4(crypto?.[quote] ?? updated?.elixirBalance ?? 0),
                    elixir: round4(updated?.elixirBalance ?? 0),
                    elixcoin: round4(crypto?.["ELIXCOIN"] ?? 0),
                },
                message: itemBase
                    ? `Bought ${amount} ${base} @ ${price} ${quote}. Fee: ${fee} ${quote}.`
                    : `Bought ${receivedBase} ${base} @ ${price} ${quote}. Fee: ${fee} ${base}.`,
            };
        }
        else {
            const grossQuote = round4(amount * price);
            fee = round4(grossQuote * trade_pairs_1.FEE_PCT);
            let proceeds = round4(grossQuote - fee);
            feeCurrency = quote;
            if (this.itemTradeService.isItem(base) && source === "USER") {
                const qty = Math.floor(amount);
                const actualBalance = await this.itemTradeService.getItemBalance(telegramId, base);
                if (actualBalance < qty)
                    return { success: false, error: `Insufficient ${base} balance` };
                updated = await this.userModel
                    .findOneAndUpdate({ telegramId }, { $inc: { [quoteKey]: proceeds } }, { returnDocument: "after" })
                    .exec();
                if (!updated)
                    return { success: false, error: "Account not found" };
                await this.itemTradeService.deductItem(telegramId, base, qty);
            }
            else {
                if (["ELIXCOIN", "COPPER", "IRON", "SILVER", "GOLD"].includes(base)) {
                    amount = Math.floor(amount);
                    const grossQuoteInt = round4(amount * price);
                    fee = round4(grossQuoteInt * trade_pairs_1.FEE_PCT);
                    proceeds = round4(grossQuoteInt - fee);
                }
                const gteCheckSell = Math.max(0, amount - 0.0001);
                updated = await this.userModel
                    .findOneAndUpdate({ telegramId, [baseKey]: { $gte: gteCheckSell } }, { $inc: { [baseKey]: -amount, [quoteKey]: proceeds } }, { returnDocument: "after" })
                    .exec();
                if (!updated)
                    return { success: false, error: `Insufficient ${base} balance` };
            }
            if (source === "USER") {
                this.previousMid.set(pair, pool.lastMid);
            }
            const sellWhaleThreshold = (pool.baseReserve || 0) * 0.03;
            const isSellWhale = source === "USER" && sellWhaleThreshold > 0 && amount > sellWhaleThreshold;
            if (isSellWhale) {
                this.logger.warn(`[WHALE-GUARD] SELL ${amount} ${pair.split("/")[0]} by ${telegramId} ` +
                    `(> 3% reserve ${round4(sellWhaleThreshold)}) — instant fill, impact suppressed.`);
            }
            const midNudge = source === "USER" && !isSellWhale ? shiftPct * 0.5 : 0;
            const newMid = round8(pool.lastMid * (1 - midNudge));
            if (source === "USER" && !isSellWhale) {
                this.lastUserTradeImpact.set(pair, {
                    side: "SELL",
                    time: Date.now(),
                    impact: shiftPct,
                });
            }
            await this.poolModel
                .updateOne({ pair }, {
                $inc: {
                    baseReserve: amount,
                    quoteReserve: -proceeds,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: round4(Math.abs(pool.lastMid - price) * amount),
                },
                $set: { lastMid: newMid },
            })
                .exec();
            await this.assetRegistry.updateReservesAfterFill(base, quote, amount, -proceeds);
            const updatedPairs2 = await this.assetRegistry.propagateToAffectedPools(base, quote);
            if (updatedPairs2.length > 0) {
                this.logger.log(`[CrossPair] SELL ${pair}: propagated to ${updatedPairs2.join(', ')}`);
            }
            const total = grossQuote;
            const trade = await this.tradeModel.create({
                pair, side, price, amount, total, fee, feeCurrency, source,
                ...(source === "USER" ? { telegramId } : {}),
            });
            await this.poolModel
                .updateOne({ pair }, {
                $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: grossQuote },
                $max: { high24h: price },
                $min: { low24h: price },
            })
                .exec();
            this.tickerCache.delete(pair);
            this.bookCache.delete(pair);
            this.tradesCache.delete(pair);
            this.sseService.broadcast(pair, "trade", {
                side, price, amount, total, fee, feeCurrency, source, pair,
                time: Date.now(),
            });
            this.sseService.broadcast(pair, "ticker", await this.getTicker(pair));
            this.checkTpSlOrders(pair, price).catch(() => { });
            const crypto2 = updated?.cryptoBalances;
            return {
                success: true,
                resting: false,
                trade: { id: String(trade._id), side, price, amount, total, fee, feeCurrency, source },
                balances: {
                    quoteBalance: round4(crypto2?.[quote] ?? updated?.elixirBalance ?? 0),
                    elixir: round4(updated?.elixirBalance ?? 0),
                    elixcoin: round4(crypto2?.["ELIXCOIN"] ?? 0),
                },
                message: `Sold ${amount} ${base} @ ${price} ${quote}. Proceeds: ${proceeds} ${quote}. Fee: ${fee} ${quote}.`,
            };
        }
    }
    async getOpenOrders(telegramId, pair = trade_pairs_1.DEFAULT_PAIR) {
        const orders = await this.orderModel
            .find({ telegramId, status: "OPEN", pair })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return {
            success: true,
            orders: orders.map((o) => ({
                id: String(o._id),
                side: o.side,
                price: o.price,
                amount: o.amount,
                status: o.status,
                createdAt: o.createdAt,
            })),
        };
    }
    async cancelOrder(telegramId, orderId) {
        const rateErr = this.checkRateLimit(this.cancelTimestamps, telegramId, CANCEL_RATE_LIMIT, Date.now());
        if (rateErr)
            return { success: false, error: rateErr };
        const order = await this.orderModel
            .findOneAndUpdate({ _id: orderId, telegramId, status: "OPEN" }, { $set: { status: "CANCELLED" } }, { returnDocument: "after" })
            .exec();
        if (!order)
            return { success: false, error: "Order not found or already closed" };
        return { success: true, order };
    }
    async getUserTrades(telegramId, page = 1, limit = 5, pair = trade_pairs_1.DEFAULT_PAIR) {
        const p = Math.max(1, Math.floor(page || 1));
        const n = Math.max(1, Math.min(50, Math.floor(limit || 5)));
        const skip = (p - 1) * n;
        const query = { telegramId, source: "USER" };
        if (pair)
            query.pair = pair;
        const trades = await this.tradeModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(n)
            .lean()
            .exec();
        const total = await this.tradeModel.countDocuments(query).exec();
        return {
            success: true,
            trades: trades.map((t) => ({
                id: String(t._id),
                side: t.side,
                price: t.price,
                amount: t.amount,
                total: t.total,
                fee: t.fee,
                feeCurrency: t.feeCurrency,
                source: t.source,
                time: t.createdAt,
            })),
            page: p,
            limit: n,
            hasMore: skip + trades.length < total,
            total,
        };
    }
    async matchOpenOrders(pair = trade_pairs_1.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const half = pool.spreadPct / 2;
        const ask = pool.lastMid * (1 + half);
        const bid = pool.lastMid * (1 - half);
        const open = await this.orderModel
            .find({ status: "OPEN", pair })
            .lean()
            .exec();
        const fills = [];
        for (const o of open) {
            let fillPrice = 0;
            if (o.side === "BUY" && o.price >= ask)
                fillPrice = ask;
            if (o.side === "SELL" && o.price <= bid)
                fillPrice = bid;
            if (!fillPrice)
                continue;
            const res = await this.executeFill(pair, o.telegramId, o.side, o.amount, round8(fillPrice), "USER");
            if (res.success) {
                if (o.iceberg && o.icebergChunkSize > 0) {
                    const chunksFilled = (o.icebergChunksFilled || 0) + 1;
                    const totalChunks = Math.ceil((o.icebergTotal || o.amount) / o.icebergChunkSize);
                    const remainingTotal = (o.icebergTotal || o.amount) - chunksFilled * o.icebergChunkSize;
                    if (remainingTotal > o.icebergChunkSize) {
                        await this.orderModel
                            .updateOne({ _id: o._id }, { $set: { status: "FILLED", filledAmount: o.amount } })
                            .exec();
                        await this.orderModel.create({
                            pair,
                            telegramId: o.telegramId,
                            side: o.side,
                            price: o.price,
                            amount: round2(o.icebergChunkSize),
                            status: "OPEN",
                            iceberg: true,
                            icebergTotal: o.icebergTotal,
                            icebergChunkSize: o.icebergChunkSize,
                            icebergChunksFilled: chunksFilled,
                        });
                    }
                    else if (remainingTotal > 0 && remainingTotal <= o.icebergChunkSize) {
                        await this.orderModel
                            .updateOne({ _id: o._id }, { $set: { status: "FILLED", filledAmount: o.amount } })
                            .exec();
                        await this.orderModel.create({
                            pair,
                            telegramId: o.telegramId,
                            side: o.side,
                            price: o.price,
                            amount: round2(remainingTotal),
                            status: "OPEN",
                            iceberg: true,
                            icebergTotal: o.icebergTotal,
                            icebergChunkSize: o.icebergChunkSize,
                            icebergChunksFilled: chunksFilled,
                        });
                    }
                    else {
                        await this.orderModel
                            .updateOne({ _id: o._id }, { $set: { status: "FILLED", filledAmount: o.amount } })
                            .exec();
                    }
                }
                else {
                    await this.orderModel
                        .updateOne({ _id: o._id }, { $set: { status: "FILLED", filledAmount: o.amount } })
                        .exec();
                }
                fills.push({ orderId: String(o._id), trade: res.trade });
            }
        }
        return fills;
    }
    driftedThisCycle = new Set();
    async driftMid(pair = trade_pairs_1.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const [base, quote] = pair.split("/");
        if (trade_pairs_1.STABLE_ASSETS.has(base)) {
            return;
        }
        if (pool.adminBidFloor > 0 && pool.adminAskCeiling > 0) {
            const floor = pool.adminBidFloor;
            const ceiling = pool.adminAskCeiling;
            const adminMid = (floor + ceiling) / 2;
            const volatility = (Math.random() - 0.5) * 0.002;
            let next = adminMid * (1 + volatility);
            next = Math.max(floor, Math.min(ceiling, next));
            const newMid = round8(next);
            pool.lastMid = newMid;
            await this.poolModel
                .updateOne({ pair }, { $set: { lastMid: newMid } })
                .exec();
            return;
        }
        const baseAsset = await this.assetRegistry.getAsset(base);
        if (!this.driftedThisCycle.has(base)) {
            const baseVolatility = (Math.random() - 0.5) * 0.002;
            let baseGravity = 0;
            if (baseAsset.anchorUsdPrice > 0) {
                const baseDiffPct = (baseAsset.usdPrice - baseAsset.anchorUsdPrice) / baseAsset.anchorUsdPrice;
                baseGravity = -baseDiffPct * 0.05;
            }
            const baseDrift = baseVolatility + baseGravity;
            const newBasePrice = Math.max(baseAsset.priceMin, Math.min(baseAsset.priceMax, baseAsset.usdPrice * (1 + baseDrift)));
            await this.assetRegistry.setUsdPrice(base, newBasePrice);
            this.driftedThisCycle.add(base);
        }
        await this.assetRegistry.propagateToAffectedPools(base, quote);
    }
    clearDriftCycle() {
        this.driftedThisCycle.clear();
    }
    async botCycle(pair = trade_pairs_1.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        void pool;
        const mid = pool.lastMid;
        const [base, quote] = pair.split("/");
        const sides = [Math.random() < 0.5 ? "BUY" : "SELL"];
        const trades = [];
        const hasAdminRange = pool.adminBidFloor > 0 && pool.adminAskCeiling > 0;
        const adminFloor = pool.adminBidFloor;
        const adminCeiling = pool.adminAskCeiling;
        for (const side of sides) {
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 6000) + 2000));
            const isItem = (0, item_sync_1.isItemBase)(base);
            let amount;
            if (isItem) {
                amount = Math.floor(Math.random() * 10) + 1;
            }
            else {
                amount = Math.floor(Math.random() * 6900) + 100;
            }
            const priceRound = isItem ? round2 : round8;
            let price;
            if (hasAdminRange) {
                if (side === "BUY") {
                    price = priceRound(mid + Math.random() * (adminCeiling - mid));
                }
                else {
                    price = priceRound(adminFloor + Math.random() * (mid - adminFloor));
                }
            }
            else {
                const half = (pool.spreadPct || 0.004) / 2;
                if (side === "BUY") {
                    price = priceRound(mid * (1 + half));
                }
                else {
                    price = priceRound(mid * (1 - half));
                }
            }
            const total = round4(amount * price);
            const fee = round4(total * trade_pairs_1.FEE_PCT);
            await this.poolModel
                .updateOne({ pair }, { $inc: { platformFeesAccumulated: fee } })
                .exec();
            const trade = await this.tradeModel.create({
                pair,
                side,
                price,
                amount,
                total,
                fee,
                feeCurrency: side === "BUY" ? base : quote,
                source: "BOT",
            });
            trades.push(trade);
        }
        const now = Date.now();
        const shouldResetDay = !pool.dayResetAt || now - pool.dayResetAt.getTime() > 24 * 3600_000;
        const cycleVolume = trades.reduce((a, t) => a + t.amount, 0);
        const cycleQuoteVol = trades.reduce((a, t) => a + t.total, 0);
        const updateOps = {
            $inc: {
                lifetimeVolume: cycleVolume,
                botRunCount: 1,
            },
        };
        if (shouldResetDay && trades.length > 0) {
            const lastPrice = trades[trades.length - 1].price;
            updateOps.$set = {
                lastBotRunAt: new Date(),
                high24h: lastPrice,
                low24h: lastPrice,
                volume24h: cycleVolume,
                quoteVolume24h: cycleQuoteVol,
                open24h: lastPrice,
                dayResetAt: new Date(),
            };
        }
        else {
            updateOps.$set = { lastBotRunAt: new Date() };
            updateOps.$inc.volume24h = cycleVolume;
            updateOps.$inc.quoteVolume24h = cycleQuoteVol;
            if (trades.length > 0) {
                const lastPrice = trades[trades.length - 1].price;
                updateOps.$max = { high24h: lastPrice };
                updateOps.$min = { low24h: lastPrice };
            }
        }
        await this.poolModel.updateOne({ pair }, updateOps).exec();
        if (pool.botRunCount && pool.botRunCount % 15 === 0) {
            const excessBots = await this.tradeModel
                .find({ pair, source: "BOT" })
                .sort({ createdAt: -1 })
                .skip(200)
                .select("_id")
                .exec();
            if (excessBots.length > 0) {
                const excessIds = excessBots.map((doc) => doc._id);
                await this.tradeModel.deleteMany({ _id: { $in: excessIds } }).exec();
            }
        }
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.tradesCache.delete(pair);
        if (trades.length > 0) {
            this.sseService.broadcast(pair, "ticker", await this.getTicker(pair));
            const lastTrade = trades[trades.length - 1];
            this.sseService.broadcast(pair, "trade", {
                side: lastTrade.side, price: lastTrade.price, amount: lastTrade.amount,
                total: lastTrade.total, source: "BOT", pair,
                time: Date.now(),
            });
        }
        return { count: trades.length, trades };
    }
};
exports.TradeSpotService = TradeSpotService;
exports.TradeSpotService = TradeSpotService = TradeSpotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(trade_schema_1.Trade.name)),
    __param(1, (0, mongoose_1.InjectModel)(pool_schema_1.LiquidityPool.name)),
    __param(2, (0, mongoose_1.InjectModel)(open_order_schema_1.OpenOrder.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(8, (0, mongoose_1.InjectModel)(pending_tp_sl_schema_1.PendingTpSl.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        asset_registry_service_1.AssetRegistryService,
        buff_item_collections_service_1.BuffItemCollectionsService,
        sse_service_1.SseService,
        item_trade_service_1.ItemTradeService,
        mongoose_2.Model])
], TradeSpotService);
//# sourceMappingURL=trade-spot.service.js.map