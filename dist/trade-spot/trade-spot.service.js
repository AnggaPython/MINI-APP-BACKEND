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
exports.TradeSpotService = exports.MID_MAX = exports.MID_MIN = exports.ELIXCOIN_KEY = exports.SPREAD_PCT = exports.FEE_PCT = exports.BASE_PRICE = exports.QUOTE = exports.BASE = exports.PAIR = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trade_schema_1 = require("./schemas/trade.schema");
const pool_schema_1 = require("./schemas/pool.schema");
const open_order_schema_1 = require("./schemas/open-order.schema");
const user_schema_1 = require("../users/schemas/user.schema");
exports.PAIR = "ELIXCOIN/ELIXIR";
exports.BASE = "ELIXCOIN";
exports.QUOTE = "ELIXIR";
exports.BASE_PRICE = 0.14872647389;
exports.FEE_PCT = 0.015;
exports.SPREAD_PCT = 0.004;
exports.ELIXCOIN_KEY = "ELIXCOIN";
exports.MID_MIN = 0.148;
exports.MID_MAX = 0.151;
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
    tickerCache = { data: null, ts: 0 };
    bookCache = { data: null, ts: 0, depth: 0 };
    tradesCache = { data: null, ts: 0, limit: 0 };
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
    async getPool() {
        let pool = await this.poolModel.findOne({ pair: exports.PAIR }).exec();
        if (!pool) {
            pool = await this.poolModel.create({
                pair: exports.PAIR,
                elixcoinReserve: 6_724_000,
                elixirReserve: 1_000_000,
                lastMid: exports.BASE_PRICE,
                spreadPct: exports.SPREAD_PCT,
                feePct: exports.FEE_PCT,
            });
        }
        else if (pool.feePct !== exports.FEE_PCT) {
            pool.feePct = exports.FEE_PCT;
            await this.poolModel
                .updateOne({ pair: exports.PAIR }, { $set: { feePct: exports.FEE_PCT } })
                .exec();
        }
        return pool;
    }
    async getTicker() {
        const now = Date.now();
        if (this.tickerCache.data && now - this.tickerCache.ts < TICKER_CACHE_MS) {
            return this.tickerCache.data;
        }
        const pool = await this.getPool();
        const close = pool.lastMid;
        const open = pool.open24h || close;
        const high = pool.high24h || close;
        const low = pool.low24h === Infinity ? close : (pool.low24h || close);
        const volume = pool.volume24h || 0;
        const quoteVolume = pool.quoteVolume24h || 0;
        const changePct = open ? ((close - open) / open) * 100 : 0;
        const result = {
            success: true,
            pair: exports.PAIR,
            base: exports.BASE,
            quote: exports.QUOTE,
            last: round8(close),
            changePct: round4(changePct),
            high: round8(high),
            low: round8(low),
            volume: round2(volume),
            quoteVolume: round2(quoteVolume),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
        this.tickerCache = { data: result, ts: now };
        return result;
    }
    async getOrderBook(depth = 10) {
        const now = Date.now();
        const clamped = Math.max(5, Math.min(25, Math.floor(depth || 10)));
        if (this.bookCache.data && now - this.bookCache.ts < BOOK_CACHE_MS && this.bookCache.depth === clamped) {
            return this.bookCache.data;
        }
        const pool = await this.getPool();
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const step = 0.0012;
        const asks = [];
        const bids = [];
        for (let i = 0; i < clamped; i++) {
            const taper = Math.pow(0.85, i);
            const rng = mulberry32(Math.round(mid * 1e6) + i * 7919);
            const askPrice = round8(mid * (1 + half + step * i));
            const askAmount = round2(pool.elixirReserve * (0.01 + 0.03 * rng()) * taper);
            asks.push({ price: askPrice, amount: Math.max(0.01, askAmount) });
            const bidPrice = round8(mid * (1 - half - step * i));
            const bidAmount = round2((pool.elixcoinReserve / mid) * (0.01 + 0.03 * rng()) * taper);
            bids.push({ price: bidPrice, amount: Math.max(0.01, bidAmount) });
        }
        const totalAsk = asks.reduce((acc, l) => acc + l.amount, 0);
        const totalBid = bids.reduce((acc, l) => acc + l.amount, 0);
        const bidShare = totalAsk + totalBid > 0 ? (totalBid / (totalAsk + totalBid)) * 100 : 50;
        const result = {
            success: true,
            pair: exports.PAIR,
            mid: round8(mid),
            spread: round8(asks[0].price - bids[0].price),
            asks,
            bids,
            bidShare: round4(bidShare),
        };
        this.bookCache = { data: result, ts: now, depth: clamped };
        return result;
    }
    async getTrades(limit = 30) {
        const now = Date.now();
        const n = Math.max(1, Math.min(100, Math.floor(limit || 30)));
        if (this.tradesCache.data && now - this.tradesCache.ts < TRADES_CACHE_MS && this.tradesCache.limit === n) {
            return this.tradesCache.data;
        }
        const trades = await this.tradeModel
            .find()
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
        this.tradesCache = { data: result, ts: now, limit: n };
        return result;
    }
    async getStats() {
        const pool = await this.getPool();
        const botTrades = await this.tradeModel.countDocuments({ source: "BOT" }).exec();
        const userTrades = await this.tradeModel.countDocuments({ source: "USER" }).exec();
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
            elixirReserve: round2(pool.elixirReserve),
            elixcoinReserve: round2(pool.elixcoinReserve),
            lastMid: round8(pool.lastMid),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
    }
    async getInfo() {
        const pool = await this.getPool();
        const since24 = new Date(Date.now() - 24 * 3600 * 1000);
        const agg24 = await this.tradeModel
            .aggregate([
            { $match: { createdAt: { $gte: since24 } } },
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
            { $match: { createdAt: { $gte: since24 } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d %H",
                            date: "$createdAt",
                        },
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
            .countDocuments({ source: "BOT" })
            .exec();
        const userTrades = await this.tradeModel
            .countDocuments({ source: "USER" })
            .exec();
        return {
            success: true,
            pair: exports.PAIR,
            base: exports.BASE,
            quote: exports.QUOTE,
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
                elixirReserve: round2(pool.elixirReserve),
                elixcoinReserve: round2(pool.elixcoinReserve),
                lastMid: round8(pool.lastMid),
                feePct: pool.feePct,
                spreadPct: pool.spreadPct,
            },
            hourly,
        };
    }
    async getBotStatus() {
        const pool = await this.getPool();
        const stats = await this.getStats();
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
        const pool = await this.getPool();
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
        if (Object.keys(set).length > 0) {
            await this.poolModel
                .updateOne({ pair: exports.PAIR }, { $set: set })
                .exec();
        }
        return this.getBotStatus();
    }
    async getHoldings(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        return {
            success: true,
            base: exports.BASE,
            quote: exports.QUOTE,
            elixcoin: round4(user?.cryptoBalances?.[exports.ELIXCOIN_KEY] || 0),
            elixir: round4(user?.elixirBalance || 0),
        };
    }
    async placeOrder(telegramId, body) {
        const rateErr = this.checkRateLimit(this.orderTimestamps, telegramId, ORDER_RATE_LIMIT, Date.now());
        if (rateErr)
            return { success: false, error: rateErr };
        const pool = await this.getPool();
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
                error: `Minimum order is ${MIN_AMOUNT} ${exports.BASE}`,
            };
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { success: false, error: "Account not found" };
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const ask = mid * (1 + half);
        const bid = mid * (1 - half);
        if (type === "market") {
            const execPrice = side === "BUY" ? ask : bid;
            return this.executeFill(telegramId, side, round2(amount), round8(execPrice), "USER");
        }
        const limit = Number(body.price);
        if (!isFinite(limit) || limit <= 0)
            return { success: false, error: "Invalid limit price" };
        if (side === "BUY" && limit >= ask)
            return this.executeFill(telegramId, "BUY", round2(amount), round8(ask), "USER");
        if (side === "SELL" && limit <= bid)
            return this.executeFill(telegramId, "SELL", round2(amount), round8(bid), "USER");
        const order = await this.orderModel.create({
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
    async executeFill(telegramId, side, amount, price, source) {
        if (source === "USER" && !telegramId)
            return { success: false, error: "Missing account" };
        const total = round4(amount * price);
        const pool = await this.getPool();
        let updated = null;
        let fee = 0;
        let feeCurrency = exports.BASE;
        if (side === "BUY") {
            fee = round4(amount * exports.FEE_PCT);
            feeCurrency = exports.BASE;
            const receivedElixcoin = round4(amount - fee);
            updated = await this.userModel
                .findOneAndUpdate({ telegramId, elixirBalance: { $gte: total } }, { $inc: { elixirBalance: -total, [`cryptoBalances.${exports.ELIXCOIN_KEY}`]: receivedElixcoin } }, { returnDocument: "after" })
                .exec();
            if (!updated)
                return { success: false, error: `Insufficient ${exports.QUOTE} balance` };
            const poolUpd = await this.poolModel
                .findOneAndUpdate({ pair: exports.PAIR, elixcoinReserve: { $gte: amount } }, {
                $inc: {
                    elixcoinReserve: -amount,
                    elixirReserve: total,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: Math.abs(price - pool.lastMid) * amount,
                },
            })
                .exec();
            if (!poolUpd) {
                await this.userModel
                    .updateOne({ telegramId }, { $inc: { elixirBalance: total, [`cryptoBalances.${exports.ELIXCOIN_KEY}`]: -receivedElixcoin } })
                    .exec();
                return { success: false, error: "Insufficient platform liquidity" };
            }
        }
        else {
            fee = round4(total * exports.FEE_PCT);
            feeCurrency = exports.QUOTE;
            const proceeds = round4(total - fee);
            updated = await this.userModel
                .findOneAndUpdate({ telegramId, [`cryptoBalances.${exports.ELIXCOIN_KEY}`]: { $gte: amount } }, { $inc: { [`cryptoBalances.${exports.ELIXCOIN_KEY}`]: -amount, elixirBalance: proceeds } }, { returnDocument: "after" })
                .exec();
            if (!updated)
                return { success: false, error: `Insufficient ${exports.BASE} balance` };
            const poolUpd = await this.poolModel
                .findOneAndUpdate({ pair: exports.PAIR, elixirReserve: { $gte: proceeds } }, {
                $inc: {
                    elixcoinReserve: amount,
                    elixirReserve: -proceeds,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: Math.abs(pool.lastMid - price) * amount,
                },
            })
                .exec();
            if (!poolUpd) {
                await this.userModel
                    .updateOne({ telegramId }, { $inc: { [`cryptoBalances.${exports.ELIXCOIN_KEY}`]: amount, elixirBalance: -proceeds } })
                    .exec();
                return { success: false, error: "Insufficient platform liquidity" };
            }
        }
        const trade = await this.tradeModel.create({
            pair: exports.PAIR,
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
        await this.poolModel
            .updateOne({ pair: exports.PAIR }, {
            $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: quoteAmt },
            $max: { high24h: price },
            $min: { low24h: price },
        })
            .exec();
        this.tickerCache = { data: null, ts: 0 };
        this.tradesCache = { data: null, ts: 0, limit: 0 };
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
                elixcoin: round4(updated.cryptoBalances?.[exports.ELIXCOIN_KEY] || 0),
                elixir: round4(updated.elixirBalance),
            },
            message: source === "USER"
                ? `Filled: ${side === "BUY" ? "Bought" : "Sold"} ${round2(amount)} ${exports.BASE} @ ${round8(price)} ${exports.QUOTE} · fee ${round4(fee)} ${feeCurrency}`
                : undefined,
        };
    }
    async getOpenOrders(telegramId) {
        const orders = await this.orderModel
            .find({ telegramId, status: "OPEN" })
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
    async getUserTrades(telegramId, page = 1, limit = 5) {
        const p = Math.max(1, Math.floor(page || 1));
        const n = Math.max(1, Math.min(50, Math.floor(limit || 5)));
        const skip = (p - 1) * n;
        const trades = await this.tradeModel
            .find({ telegramId, source: "USER" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(n)
            .lean()
            .exec();
        const total = await this.tradeModel
            .countDocuments({ telegramId, source: "USER" })
            .exec();
        return {
            success: true,
            trades: trades.map((t) => ({
                id: String(t._id),
                side: t.side,
                price: t.price,
                amount: t.amount,
                total: t.total,
                fee: t.fee,
                feeCurrency: t.feeCurrency || "ELIXCOIN",
                source: t.source,
                time: t.createdAt,
            })),
            page: p,
            limit: n,
            hasMore: skip + trades.length < total,
            total,
        };
    }
    async matchOpenOrders() {
        const pool = await this.getPool();
        const half = pool.spreadPct / 2;
        const ask = pool.lastMid * (1 + half);
        const bid = pool.lastMid * (1 - half);
        const open = await this.orderModel.find({ status: "OPEN" }).lean().exec();
        const fills = [];
        for (const o of open) {
            let fillPrice = 0;
            if (o.side === "BUY" && o.price >= ask)
                fillPrice = ask;
            if (o.side === "SELL" && o.price <= bid)
                fillPrice = bid;
            if (!fillPrice)
                continue;
            const res = await this.executeFill(o.telegramId, o.side, o.amount, round8(fillPrice), "USER");
            if (res.success) {
                await this.orderModel
                    .updateOne({ _id: o._id }, { $set: { status: "FILLED", filledAmount: o.amount } })
                    .exec();
                fills.push({ orderId: String(o._id), trade: res.trade });
            }
        }
        return fills;
    }
    async driftMid() {
        const pool = await this.getPool();
        const drift = (Math.random() - 0.5) * 0.006;
        const next = Math.min(exports.MID_MAX, Math.max(exports.MID_MIN, pool.lastMid * (1 + drift)));
        await this.poolModel
            .updateOne({ pair: exports.PAIR }, { $set: { lastMid: round8(next) } })
            .exec();
    }
    async botCycle() {
        const pool = await this.getPool();
        const mid = pool.lastMid;
        const sides = [
            ...Array(5).fill("BUY"),
            ...Array(5).fill("SELL"),
        ].sort(() => Math.random() - 0.5);
        const trades = [];
        for (const side of sides) {
            let amount = this.randomAmount();
            const maxByReserve = side === "BUY"
                ? pool.elixcoinReserve * 0.04
                : (pool.elixirReserve / mid) * 0.04;
            amount = Math.max(10, Math.min(amount, maxByReserve));
            amount = round2(amount);
            const price = round8(mid);
            const total = round4(amount * price);
            const fee = round4(total * exports.FEE_PCT);
            if (side === "BUY") {
                const upd = await this.poolModel
                    .findOneAndUpdate({ pair: exports.PAIR, elixcoinReserve: { $gte: amount } }, {
                    $inc: {
                        elixcoinReserve: -amount,
                        elixirReserve: total + fee,
                        platformFeesAccumulated: fee,
                    },
                }, { returnDocument: "after" })
                    .exec();
                if (!upd)
                    continue;
            }
            else {
                const proceeds = round4(total - fee);
                const upd = await this.poolModel
                    .findOneAndUpdate({ pair: exports.PAIR, elixirReserve: { $gte: proceeds } }, {
                    $inc: {
                        elixcoinReserve: amount,
                        elixirReserve: -proceeds,
                        platformFeesAccumulated: fee,
                    },
                }, { returnDocument: "after" })
                    .exec();
                if (!upd)
                    continue;
            }
            const trade = await this.tradeModel.create({
                pair: exports.PAIR,
                side,
                price,
                amount,
                total,
                fee,
                feeCurrency: side === "BUY" ? exports.BASE : exports.QUOTE,
                source: "BOT",
            });
            trades.push(trade);
        }
        const now = Date.now();
        const shouldResetDay = !pool.dayResetAt || (now - pool.dayResetAt.getTime()) > 24 * 3600_000;
        const updateOps = {
            $inc: { lifetimeVolume: trades.reduce((a, t) => a + t.amount, 0), botRunCount: 1 },
            $set: { lastBotRunAt: new Date() },
        };
        if (shouldResetDay && trades.length > 0) {
            const lastPrice = trades[trades.length - 1].price;
            updateOps.$set.high24h = lastPrice;
            updateOps.$set.low24h = lastPrice;
            updateOps.$set.volume24h = 0;
            updateOps.$set.quoteVolume24h = 0;
            updateOps.$set.open24h = lastPrice;
            updateOps.$set.dayResetAt = new Date();
        }
        await this.poolModel
            .updateOne({ pair: exports.PAIR }, updateOps)
            .exec();
        this.tickerCache = { data: null, ts: 0 };
        this.bookCache = { data: null, ts: 0, depth: 0 };
        this.tradesCache = { data: null, ts: 0, limit: 0 };
        return { count: trades.length, trades };
    }
    randomAmount() {
        const min = 50;
        const max = 1200;
        const u = Math.random();
        return Math.exp(Math.log(min) + u * (Math.log(max) - Math.log(min)));
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