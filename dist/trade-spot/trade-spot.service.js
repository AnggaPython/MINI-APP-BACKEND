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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeSpotService = exports.SPREAD_PCT = exports.FEE_PCT = exports.DEFAULT_PAIR = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trade_schema_1 = require("./schemas/trade.schema");
const pool_schema_1 = require("./schemas/pool.schema");
const open_order_schema_1 = require("./schemas/open-order.schema");
const user_schema_1 = require("../users/schemas/user.schema");
exports.DEFAULT_PAIR = "ELIXCOIN/ELIXIR";
exports.FEE_PCT = 0.015;
exports.SPREAD_PCT = 0.004;
const round8 = (n) => Math.round(n * 1e8) / 1e8;
const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 1e4) / 1e4;
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
let TradeSpotService = class TradeSpotService {
    tradeModel;
    poolModel;
    orderModel;
    userModel;
    orderTimestamps = new Map();
    cancelTimestamps = new Map();
    tickerCache = new Map();
    bookCache = new Map();
    tradesCache = new Map();
    constructor(tradeModel, poolModel, orderModel, userModel) {
        this.tradeModel = tradeModel;
        this.poolModel = poolModel;
        this.orderModel = orderModel;
        this.userModel = userModel;
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
    async getPool(pair = exports.DEFAULT_PAIR) {
        let pool = await this.poolModel.findOne({ pair }).exec();
        if (!pool) {
            if (pair === exports.DEFAULT_PAIR) {
                pool = await this.poolModel.create({
                    pair,
                    elixcoinReserve: 6_724_000,
                    elixirReserve: 1_000_000,
                    baseReserve: 6_724_000,
                    quoteReserve: 1_000_000,
                    lastMid: 0.14872647389,
                    spreadPct: exports.SPREAD_PCT,
                    feePct: exports.FEE_PCT,
                    midMin: 0.14700000,
                    midMax: 0.14899999,
                });
            }
            else {
                throw new Error(`Pool for ${pair} not found`);
            }
        }
        else if (pool.feePct !== exports.FEE_PCT) {
            pool.feePct = exports.FEE_PCT;
            await this.poolModel.updateOne({ pair }, { $set: { feePct: exports.FEE_PCT } }).exec();
        }
        return pool;
    }
    async getTicker(pair = exports.DEFAULT_PAIR) {
        const now = Date.now();
        const cache = this.tickerCache.get(pair);
        if (cache?.data && now - cache.ts < TICKER_CACHE_MS) {
            return cache.data;
        }
        const pool = await this.getPool(pair);
        const close = pool.lastMid;
        const open = pool.open24h || close;
        const high = pool.high24h || close;
        const low = pool.low24h === Infinity ? close : (pool.low24h || close);
        const volume = pool.volume24h || 0;
        const quoteVolume = pool.quoteVolume24h || 0;
        const changePct = open ? ((close - open) / open) * 100 : 0;
        const [base, quote] = pair.split("/");
        const result = {
            success: true,
            pair,
            base,
            quote,
            last: round8(close),
            changePct: round4(changePct),
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
    async getOrderBook(depth = 10, pair = exports.DEFAULT_PAIR) {
        const now = Date.now();
        const clamped = Math.max(5, Math.min(25, Math.floor(depth || 10)));
        const cache = this.bookCache.get(pair);
        if (cache?.data && now - cache.ts < BOOK_CACHE_MS && cache.depth === clamped) {
            return cache.data;
        }
        const pool = await this.getPool(pair);
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const step = 0.0012;
        const asks = [];
        const bids = [];
        const maxBookDepth = Math.max(10000, (pool.baseReserve || pool.elixcoinReserve) || 0);
        for (let i = 0; i < clamped; i++) {
            const taper = Math.pow(0.85, i);
            const rng = mulberry32(Math.round(mid * 1e6) + i * 7919);
            const askPrice = round8(mid * (1 + half + step * i));
            const askAmount = round8(maxBookDepth * (0.005 + 0.01 * rng()) * taper);
            asks.push({ price: askPrice, amount: Math.max(0.0001, askAmount) });
            const bidPrice = round8(mid * (1 - half - step * i));
            const bidAmount = round8(maxBookDepth * (0.005 + 0.01 * rng()) * taper);
            bids.push({ price: bidPrice, amount: Math.max(0.0001, bidAmount) });
        }
        const openOrders = await this.orderModel.find({ pair, status: "OPEN" }).lean().exec();
        for (const o of openOrders) {
            if (!isFinite(o.price) || o.price <= 0)
                continue;
            const rem = (o.amount || 0) - (o.filledAmount || 0);
            if (rem <= 0)
                continue;
            const targetList = o.side === "SELL" ? asks : bids;
            const match = targetList.find(x => x.price === o.price);
            if (match) {
                match.amount += rem;
            }
            else {
                targetList.push({ price: o.price, amount: rem });
            }
        }
        asks.sort((a, b) => a.price - b.price);
        bids.sort((a, b) => b.price - a.price);
        const finAsks = asks.slice(0, clamped);
        const finBids = bids.slice(0, clamped);
        const totalAsk = finAsks.reduce((acc, l) => acc + l.amount, 0);
        const totalBid = finBids.reduce((acc, l) => acc + l.amount, 0);
        const bidShare = totalAsk + totalBid > 0 ? (totalBid / (totalAsk + totalBid)) * 100 : 50;
        const result = {
            success: true,
            pair,
            mid: round8(mid),
            spread: round8(finAsks[0]?.price - finBids[0]?.price || 0),
            asks: finAsks,
            bids: finBids,
            bidShare: Math.max(0, Math.min(100, round2(bidShare)))
        };
        this.bookCache.set(pair, { data: result, ts: now, depth: clamped });
        return result;
    }
    async getTrades(limit = 30, pair = exports.DEFAULT_PAIR) {
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
    async getStats(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const botTrades = await this.tradeModel.countDocuments({ pair, source: "BOT" }).exec();
        const userTrades = await this.tradeModel.countDocuments({ pair, source: "USER" }).exec();
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
            quoteReserve: round2(pool.quoteReserve || pool.elixirReserve),
            baseReserve: round2(pool.baseReserve || pool.elixcoinReserve),
            lastMid: round8(pool.lastMid),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
    }
    async getInfo(pair = exports.DEFAULT_PAIR) {
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
                    _id: { $dateToString: { format: "%Y-%m-%d %H", date: "$createdAt" } },
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
        const botTrades = await this.tradeModel.countDocuments({ pair, source: "BOT" }).exec();
        const userTrades = await this.tradeModel.countDocuments({ pair, source: "USER" }).exec();
        const [base, quote] = pair.split("/");
        return {
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
                quoteReserve: round2(pool.quoteReserve || pool.elixirReserve),
                baseReserve: round2(pool.baseReserve || pool.elixcoinReserve),
                lastMid: round8(pool.lastMid),
                feePct: pool.feePct,
                spreadPct: pool.spreadPct,
            },
            hourly,
        };
    }
    async getBotStatus(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const stats = await this.getStats(pair);
        const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
        const lastRun = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : null;
        return {
            ...stats,
            enabled: pool.botEnabled !== false,
            intervalMinutes: pool.botIntervalMinutes ?? 15,
            lastBotRunAt: pool.lastBotRunAt ?? null,
            nextBotRunAt: lastRun ? new Date(lastRun + intervalMs) : new Date(),
        };
    }
    async updateBotConfig(body) {
        const pair = body.pair || exports.DEFAULT_PAIR;
        const pool = await this.getPool(pair);
        const set = {};
        if (typeof body.enabled === "boolean")
            set.botEnabled = body.enabled;
        if (body.intervalMinutes !== undefined) {
            const m = Number(body.intervalMinutes);
            if (!isFinite(m) || m < 1 || m > 60) {
                return { success: false, error: "Cooldown must be between 1 and 60 minutes" };
            }
            set.botIntervalMinutes = Math.round(m);
        }
        if (Object.keys(set).length > 0) {
            await this.poolModel.updateOne({ pair }, { $set: set }).exec();
        }
        return this.getBotStatus(pair);
    }
    async getHoldings(telegramId, pair = exports.DEFAULT_PAIR) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        const [base, quote] = pair.split("/");
        const crypto = user?.cryptoBalances;
        return {
            success: true,
            base,
            quote,
            baseBalance: round4(base === "ELIXIR" ? (user?.elixirBalance || 0) : (crypto?.[base] || 0)),
            quoteBalance: round4(quote === "ELIXIR" ? (user?.elixirBalance || 0) : (crypto?.[quote] || 0)),
            elixcoin: round4(crypto?.["ELIXCOIN"] || 0),
            elixir: round4(user?.elixirBalance || 0),
        };
    }
    async placeOrder(telegramId, body) {
        const rateErr = this.checkRateLimit(this.orderTimestamps, telegramId, ORDER_RATE_LIMIT, Date.now());
        if (rateErr)
            return { success: false, error: rateErr };
        const pair = body.pair || exports.DEFAULT_PAIR;
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
            return { success: false, error: `Minimum order is ${MIN_AMOUNT} ${base}` };
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { success: false, error: "Account not found" };
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const ask = mid * (1 + half);
        const bid = mid * (1 - half);
        if (type === "market") {
            const execPrice = side === "BUY" ? ask : bid;
            return this.executeFill(pair, telegramId, side, round2(amount), round8(execPrice), "USER");
        }
        const limit = Number(body.price);
        if (!isFinite(limit) || limit <= 0)
            return { success: false, error: "Invalid limit price" };
        if (side === "BUY" && limit >= ask)
            return this.executeFill(pair, telegramId, "BUY", round2(amount), round8(ask), "USER");
        if (side === "SELL" && limit <= bid)
            return this.executeFill(pair, telegramId, "SELL", round2(amount), round8(bid), "USER");
        const order = await this.orderModel.create({
            pair,
            telegramId,
            side,
            price: round8(limit),
            amount: round2(amount),
            status: "OPEN",
        });
        return {
            success: true,
            resting: true,
            order: {
                id: String(order._id),
                side,
                price: order.price,
                amount: order.amount,
                status: "OPEN",
            },
            message: `Limit order placed — fills when the market crosses ${round8(limit)}`,
        };
    }
    async executeFill(pair, telegramId, side, amount, price, source) {
        if (source === "USER" && !telegramId)
            return { success: false, error: "Missing account" };
        const total = round4(amount * price);
        const pool = await this.getPool(pair);
        const [base, quote] = pair.split("/");
        const baseKey = base === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${base}`;
        const quoteKey = quote === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${quote}`;
        let updated = null;
        let fee = 0;
        let feeCurrency = base;
        if (side === "BUY") {
            fee = round4(amount * exports.FEE_PCT);
            feeCurrency = base;
            const receivedBase = round4(amount - fee);
            updated = await this.userModel
                .findOneAndUpdate({ telegramId, [quoteKey]: { $gte: total } }, { $inc: { [quoteKey]: -total, [baseKey]: receivedBase } }, { returnDocument: "after" }).exec();
            if (!updated)
                return { success: false, error: `Insufficient ${quote} balance` };
            const poolUpd = await this.poolModel
                .findOneAndUpdate({ pair, $or: [{ baseReserve: { $gte: amount } }, { elixcoinReserve: { $gte: amount } }] }, {
                $inc: {
                    baseReserve: -amount,
                    quoteReserve: total,
                    elixcoinReserve: -amount,
                    elixirReserve: total,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: Math.abs(price - pool.lastMid) * amount,
                },
            }).exec();
            if (!poolUpd) {
                await this.userModel.updateOne({ telegramId }, { $inc: { [quoteKey]: total, [baseKey]: -receivedBase } }).exec();
                return { success: false, error: "Insufficient platform liquidity" };
            }
        }
        else {
            fee = round4(total * exports.FEE_PCT);
            feeCurrency = quote;
            const proceeds = round4(total - fee);
            updated = await this.userModel
                .findOneAndUpdate({ telegramId, [baseKey]: { $gte: amount } }, { $inc: { [baseKey]: -amount, [quoteKey]: proceeds } }, { returnDocument: "after" }).exec();
            if (!updated)
                return { success: false, error: `Insufficient ${base} balance` };
            const poolUpd = await this.poolModel
                .findOneAndUpdate({ pair, $or: [{ quoteReserve: { $gte: proceeds } }, { elixirReserve: { $gte: proceeds } }] }, {
                $inc: {
                    baseReserve: amount,
                    quoteReserve: -proceeds,
                    elixcoinReserve: amount,
                    elixirReserve: -proceeds,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: Math.abs(pool.lastMid - price) * amount,
                },
            }).exec();
            if (!poolUpd) {
                await this.userModel.updateOne({ telegramId }, { $inc: { [baseKey]: amount, [quoteKey]: -proceeds } }).exec();
                return { success: false, error: "Insufficient platform liquidity" };
            }
        }
        const trade = await this.tradeModel.create({
            pair,
            side,
            price,
            amount,
            total,
            fee,
            feeCurrency,
            source,
            ...(source === "USER" ? { telegramId } : {}),
        });
        const quoteAmt = round4(amount * price);
        await this.poolModel.updateOne({ pair }, {
            $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: quoteAmt },
            $max: { high24h: price },
            $min: { low24h: price },
        }).exec();
        this.tickerCache.delete(pair);
        this.tradesCache.delete(pair);
        return {
            success: true,
            trade: {
                id: String(trade._id),
                side,
                price,
                amount,
                total,
                fee,
                feeCurrency,
                source,
            },
            balances: {
                baseBalance: round4(base === "ELIXIR" ? (updated?.elixirBalance || 0) : (updated?.cryptoBalances?.[base] || 0)),
                quoteBalance: round4(quote === "ELIXIR" ? (updated?.elixirBalance || 0) : (updated?.cryptoBalances?.[quote] || 0)),
                elixcoin: round4(updated?.cryptoBalances?.["ELIXCOIN"] || 0),
                elixir: round4(updated.elixirBalance),
            },
            message: source === "USER"
                ? `Filled: ${side === "BUY" ? "Bought" : "Sold"} ${round2(amount)} ${base} @ ${round8(price)} ${quote} · fee ${round4(fee)} ${feeCurrency}`
                : undefined,
        };
    }
    async getOpenOrders(telegramId, pair = exports.DEFAULT_PAIR) {
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
            .findOneAndUpdate({ _id: orderId, telegramId, status: "OPEN" }, { $set: { status: "CANCELLED" } }, { returnDocument: "after" }).exec();
        if (!order)
            return { success: false, error: "Order not found or already closed" };
        return { success: true, order };
    }
    async getUserTrades(telegramId, page = 1, limit = 5, pair = exports.DEFAULT_PAIR) {
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
    async matchOpenOrders(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const half = pool.spreadPct / 2;
        const ask = pool.lastMid * (1 + half);
        const bid = pool.lastMid * (1 - half);
        const open = await this.orderModel.find({ status: "OPEN", pair }).lean().exec();
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
                await this.orderModel.updateOne({ _id: o._id }, { $set: { status: "FILLED", filledAmount: o.amount } }).exec();
                fills.push({ orderId: String(o._id), trade: res.trade });
            }
        }
        return fills;
    }
    async driftMid(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const drift = (Math.random() - 0.5) * 0.006;
        const minBound = pool.midMin;
        const maxBound = pool.midMax;
        const next = Math.min(maxBound, Math.max(minBound, pool.lastMid * (1 + drift)));
        await this.poolModel
            .updateOne({ pair }, { $set: { lastMid: round8(next) } })
            .exec();
    }
    async botCycle(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const mid = pool.lastMid;
        const [base, quote] = pair.split("/");
        const sides = [
            ...Array(5).fill("BUY"),
            ...Array(5).fill("SELL"),
        ].sort(() => Math.random() - 0.5);
        const trades = [];
        const baseReserveKey = "baseReserve";
        const quoteReserveKey = "quoteReserve";
        const baseResVal = pool.baseReserve || pool.elixcoinReserve;
        const quoteResVal = pool.quoteReserve || pool.elixirReserve;
        for (const side of sides) {
            const targetQuoteVolume = Math.random() * 0.028 + 0.022;
            let amount = targetQuoteVolume / mid;
            const maxByReserve = side === "BUY"
                ? baseResVal * 0.04
                : (quoteResVal / mid) * 0.04;
            amount = Math.min(amount, maxByReserve);
            amount = round2(amount);
            const price = round8(mid);
            const total = round4(amount * price);
            const fee = round4(total * exports.FEE_PCT);
            if (side === "BUY") {
                const upd = await this.poolModel.findOneAndUpdate({ pair, $or: [{ baseReserve: { $gte: amount } }, { elixcoinReserve: { $gte: amount } }] }, {
                    $inc: {
                        baseReserve: -amount,
                        quoteReserve: total + fee,
                        elixcoinReserve: -amount,
                        elixirReserve: total + fee,
                        platformFeesAccumulated: fee,
                    },
                }, { returnDocument: "after" }).exec();
                if (!upd) {
                    console.warn(`[MM Bot] skipping BUY on ${pair}: Insufficient baseReserve (needs ${amount})`);
                    continue;
                }
            }
            else {
                const proceeds = round4(total - fee);
                const upd = await this.poolModel.findOneAndUpdate({ pair, $or: [{ quoteReserve: { $gte: proceeds } }, { elixirReserve: { $gte: proceeds } }] }, {
                    $inc: {
                        baseReserve: amount,
                        quoteReserve: -proceeds,
                        elixcoinReserve: amount,
                        elixirReserve: -proceeds,
                        platformFeesAccumulated: fee,
                    },
                }, { returnDocument: "after" }).exec();
                if (!upd) {
                    console.warn(`[MM Bot] skipping SELL on ${pair}: Insufficient quoteReserve`);
                    continue;
                }
            }
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
        const shouldResetDay = !pool.dayResetAt || (now - pool.dayResetAt.getTime()) > 24 * 3600_000;
        const cycleVolume = trades.reduce((a, t) => a + t.amount, 0);
        const cycleQuoteVol = trades.reduce((a, t) => a + t.total, 0);
        const updateOps = {
            $inc: {
                lifetimeVolume: cycleVolume,
                botRunCount: 1
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
                dayResetAt: new Date()
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
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.tradesCache.delete(pair);
        return { count: trades.length, trades };
    }
};
exports.TradeSpotService = TradeSpotService;
exports.TradeSpotService = TradeSpotService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(trade_schema_1.Trade.name)),
    __param(1, (0, mongoose_1.InjectModel)(pool_schema_1.LiquidityPool.name)),
    __param(2, (0, mongoose_1.InjectModel)(open_order_schema_1.OpenOrder.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], TradeSpotService);
//# sourceMappingURL=trade-spot.service.js.map