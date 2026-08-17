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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeSpotService = exports.MID_MAX = exports.MID_MIN = exports.QUOTE_BALANCE_KEY = exports.SPREAD_PCT = exports.FEE_PCT = exports.BASE_PRICE = exports.QUOTE = exports.BASE = exports.PAIR = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trade_schema_1 = require("./schemas/trade.schema");
const pool_schema_1 = require("./schemas/pool.schema");
const open_order_schema_1 = require("./schemas/open-order.schema");
const user_schema_1 = require("../users/schemas/user.schema");
exports.PAIR = "ELIXIR/ELIXCOIN";
exports.BASE = "ELIXIR";
exports.QUOTE = "ELIXCOIN";
exports.BASE_PRICE = 10;
exports.FEE_PCT = 0.025;
exports.SPREAD_PCT = 0.004;
exports.QUOTE_BALANCE_KEY = "ELIXCOIN";
exports.MID_MIN = 9.5;
exports.MID_MAX = 10.5;
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
let TradeSpotService = class TradeSpotService {
    tradeModel;
    poolModel;
    orderModel;
    userModel;
    constructor(tradeModel, poolModel, orderModel, userModel) {
        this.tradeModel = tradeModel;
        this.poolModel = poolModel;
        this.orderModel = orderModel;
        this.userModel = userModel;
    }
    async getPool() {
        let pool = await this.poolModel.findOne({ pair: exports.PAIR }).exec();
        if (!pool) {
            pool = await this.poolModel.create({
                pair: exports.PAIR,
                elixirReserve: 1_000_000,
                elixcoinReserve: 10_000_000,
                lastMid: exports.BASE_PRICE,
                spreadPct: exports.SPREAD_PCT,
                feePct: exports.FEE_PCT,
            });
        }
        return pool;
    }
    async getTicker() {
        const pool = await this.getPool();
        const since = new Date(Date.now() - 24 * 3600 * 1000);
        const windowTrades = await this.tradeModel
            .find({ createdAt: { $gte: since } })
            .sort({ createdAt: 1 })
            .select("price amount")
            .lean()
            .exec();
        let open = null;
        let close = pool.lastMid;
        let high = -Infinity;
        let low = Infinity;
        let volume = 0;
        for (const t of windowTrades) {
            if (open === null)
                open = t.price;
            close = t.price;
            high = Math.max(high, t.price);
            low = Math.min(low, t.price);
            volume += t.amount;
        }
        if (open === null) {
            open = pool.lastMid;
            high = low = pool.lastMid;
        }
        const changePct = open ? ((close - open) / open) * 100 : 0;
        return {
            success: true,
            pair: exports.PAIR,
            base: exports.BASE,
            quote: exports.QUOTE,
            last: round8(close),
            changePct: round4(changePct),
            high: round8(high),
            low: round8(low),
            volume: round2(volume),
            quoteVolume: round2(volume * close),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
    }
    async getOrderBook(depth = 10) {
        const pool = await this.getPool();
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const step = 0.0012;
        const clamped = Math.max(5, Math.min(25, Math.floor(depth || 10)));
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
        return {
            success: true,
            pair: exports.PAIR,
            mid: round8(mid),
            spread: round8(asks[0].price - bids[0].price),
            asks,
            bids,
            bidShare: round4(bidShare),
        };
    }
    async getTrades(limit = 30) {
        const n = Math.max(1, Math.min(100, Math.floor(limit || 30)));
        const trades = await this.tradeModel
            .find()
            .sort({ createdAt: -1 })
            .limit(n)
            .lean()
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
                source: t.source,
                time: t.createdAt,
            })),
        };
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
    async getHoldings(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        return {
            success: true,
            base: exports.BASE,
            quote: exports.QUOTE,
            elixir: round4(user?.elixirBalance || 0),
            elixcoin: round4(user?.cryptoBalances?.[exports.QUOTE_BALANCE_KEY] || 0),
        };
    }
    async placeOrder(telegramId, body) {
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
        const fee = round4(total * exports.FEE_PCT);
        const pool = await this.getPool();
        const userKey = `cryptoBalances.${exports.QUOTE_BALANCE_KEY}`;
        let updated = null;
        if (side === "BUY") {
            const cost = round4(total + fee);
            updated = await this.userModel
                .findOneAndUpdate({ telegramId, [userKey]: { $gte: cost } }, { $inc: { [userKey]: -cost, elixirBalance: amount } }, { new: true })
                .exec();
            if (!updated)
                return { success: false, error: `Insufficient ${exports.QUOTE} balance` };
            const poolUpd = await this.poolModel
                .findOneAndUpdate({ pair: exports.PAIR, elixirReserve: { $gte: amount } }, {
                $inc: {
                    elixirReserve: -amount,
                    elixcoinReserve: cost,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: Math.abs(price - pool.lastMid) * amount,
                },
            })
                .exec();
            if (!poolUpd) {
                await this.userModel
                    .updateOne({ telegramId }, { $inc: { [userKey]: cost, elixirBalance: -amount } })
                    .exec();
                return { success: false, error: "Insufficient platform liquidity" };
            }
        }
        else {
            const proceeds = round4(total - fee);
            updated = await this.userModel
                .findOneAndUpdate({ telegramId, elixirBalance: { $gte: amount } }, { $inc: { elixirBalance: -amount, [userKey]: proceeds } }, { new: true })
                .exec();
            if (!updated)
                return { success: false, error: `Insufficient ${exports.BASE} balance` };
            const poolUpd = await this.poolModel
                .findOneAndUpdate({ pair: exports.PAIR, elixcoinReserve: { $gte: proceeds } }, {
                $inc: {
                    elixirReserve: amount,
                    elixcoinReserve: -proceeds,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: Math.abs(pool.lastMid - price) * amount,
                },
            })
                .exec();
            if (!poolUpd) {
                await this.userModel
                    .updateOne({ telegramId }, { $inc: { elixirBalance: amount, [userKey]: -proceeds } })
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
            source,
            ...(source === "USER" ? { telegramId } : {}),
        });
        await this.poolModel
            .updateOne({ pair: exports.PAIR }, { $inc: { lifetimeVolume: amount } })
            .exec();
        return {
            success: true,
            trade: {
                id: String(trade._id),
                side,
                price,
                amount,
                total,
                fee,
                source,
            },
            balances: {
                elixir: round4(updated.elixirBalance),
                elixcoin: round4(updated.cryptoBalances?.[exports.QUOTE_BALANCE_KEY] || 0),
            },
            message: source === "USER"
                ? `Filled: ${side === "BUY" ? "Bought" : "Sold"} ${round2(amount)} ${exports.BASE} @ ${round8(price)} ${exports.QUOTE} (fee ${round4(fee)} ${exports.QUOTE})`
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
        const order = await this.orderModel
            .findOneAndUpdate({ _id: orderId, telegramId, status: "OPEN" }, { $set: { status: "CANCELLED" } }, { new: true })
            .exec();
        if (!order)
            return { success: false, error: "Order not found or already closed" };
        return { success: true, order };
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
                ? pool.elixirReserve * 0.04
                : (pool.elixcoinReserve / mid) * 0.04;
            amount = Math.max(10, Math.min(amount, maxByReserve));
            amount = round2(amount);
            const price = round8(mid);
            const total = round4(amount * price);
            const fee = round4(total * exports.FEE_PCT);
            if (side === "BUY") {
                const upd = await this.poolModel
                    .findOneAndUpdate({ pair: exports.PAIR, elixirReserve: { $gte: amount } }, {
                    $inc: {
                        elixirReserve: -amount,
                        elixcoinReserve: total + fee,
                        platformFeesAccumulated: fee,
                    },
                }, { new: true })
                    .exec();
                if (!upd)
                    continue;
            }
            else {
                const proceeds = round4(total - fee);
                const upd = await this.poolModel
                    .findOneAndUpdate({ pair: exports.PAIR, elixcoinReserve: { $gte: proceeds } }, {
                    $inc: {
                        elixirReserve: amount,
                        elixcoinReserve: -proceeds,
                        platformFeesAccumulated: fee,
                    },
                }, { new: true })
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
                source: "BOT",
            });
            trades.push(trade);
        }
        await this.poolModel
            .updateOne({ pair: exports.PAIR }, {
            $inc: { lifetimeVolume: trades.reduce((a, t) => a + t.amount, 0), botRunCount: 1 },
            $set: { lastBotRunAt: new Date() },
        })
            .exec();
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
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object, typeof (_c = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _c : Object, typeof (_d = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _d : Object])
], TradeSpotService);
//# sourceMappingURL=trade-spot.service.js.map