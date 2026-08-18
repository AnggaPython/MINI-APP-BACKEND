import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { User } from "../users/schemas/user.schema";

// ── Pair constants ────────────────────────────────────────────────────────
export const PAIR = "ELIXIR/ELIXCOIN";
export const BASE = "ELIXIR";
export const QUOTE = "ELIXCOIN";

/** Reference price: 1.00000000 ELIXIR = 10.00000000 ELIXCOIN. */
export const BASE_PRICE = 10;

/** Flat platform fee per transaction (1.5%). */
export const FEE_PCT = 0.015;

/** Full quoted spread (0.4% → ±0.2% around mid). */
export const SPREAD_PCT = 0.004;

/** Where the user's ELIXCOIN quote balance lives. */
export const QUOTE_BALANCE_KEY = "ELIXCOIN";

/**
 * Random-walk bounds so the market breathes but never drifts away.
 * MID_MIN is floored at 10 — the real-money redemption peg of ELIXIR
 * (10,000 ELIXIR = $1 = 100,000 ELIXCOIN ⇒ 1 ELIXIR = 10 ELIXCOIN). If the
 * mid ever fell below 10, users could buy ELIXIR cheap and redeem it for its
 * full dollar value — an instant arbitrage that drains the redemption pool.
 * The 1.5% fee adds a natural extra guard on top of this floor.
 */
export const MID_MIN = 10;
export const MID_MAX = 10.5;

const round8 = (n: number) => Math.round(n * 1e8) / 1e8;
const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Deterministic PRNG — stable order-book ladder between price ticks. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

@Injectable()
export class TradeSpotService {
  constructor(
    @InjectModel(Trade.name) private readonly tradeModel: Model<Trade>,
    @InjectModel(LiquidityPool.name)
    private readonly poolModel: Model<LiquidityPool>,
    @InjectModel(OpenOrder.name)
    private readonly orderModel: Model<OpenOrder>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }

  // ── Pool (platform liquidity + market state) ────────────────────────────
  async getPool(): Promise<LiquidityPool> {
    let pool = await this.poolModel.findOne({ pair: PAIR }).exec();
    if (!pool) {
      // Admin pre-installs liquidity: 1M ELIXIR against 10M ELIXCOIN at mid 10.
      pool = await this.poolModel.create({
        pair: PAIR,
        elixirReserve: 1_000_000,
        elixcoinReserve: 10_000_000,
        lastMid: BASE_PRICE,
        spreadPct: SPREAD_PCT,
        feePct: FEE_PCT,
      });
    } else if (pool.feePct !== FEE_PCT) {
      // Keep legacy pools in sync with the current 1.5% fee.
      pool.feePct = FEE_PCT;
      await this.poolModel
        .updateOne({ pair: PAIR }, { $set: { feePct: FEE_PCT } })
        .exec();
    }
    return pool;
  }

  // ── Ticker: last price + 24h stats ──────────────────────────────────────
  async getTicker() {
    const pool = await this.getPool();
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const windowTrades = await this.tradeModel
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: 1 })
      .select("price amount")
      .lean()
      .exec();

    let open: number | null = null;
    let close: number = pool.lastMid;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;
    for (const t of windowTrades) {
      if (open === null) open = t.price;
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
      pair: PAIR,
      base: BASE,
      quote: QUOTE,
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

  // ── Order book: synthetic ladder around the real-time mid ───────────────
  async getOrderBook(depth = 10) {
    const pool = await this.getPool();
    const mid = pool.lastMid;
    const half = pool.spreadPct / 2;
    const step = 0.0012; // 0.12% between consecutive levels
    const clamped = Math.max(5, Math.min(25, Math.floor(depth || 10)));

    const asks: { price: number; amount: number }[] = [];
    const bids: { price: number; amount: number }[] = [];

    for (let i = 0; i < clamped; i++) {
      const taper = Math.pow(0.85, i); // deeper levels are thinner
      const rng = mulberry32(Math.round(mid * 1e6) + i * 7919);

      const askPrice = round8(mid * (1 + half + step * i));
      const askAmount = round2(pool.elixirReserve * (0.01 + 0.03 * rng()) * taper);
      asks.push({ price: askPrice, amount: Math.max(0.01, askAmount) });

      const bidPrice = round8(mid * (1 - half - step * i));
      const bidAmount = round2(
        (pool.elixcoinReserve / mid) * (0.01 + 0.03 * rng()) * taper,
      );
      bids.push({ price: bidPrice, amount: Math.max(0.01, bidAmount) });
    }

    const totalAsk = asks.reduce((acc, l) => acc + l.amount, 0);
    const totalBid = bids.reduce((acc, l) => acc + l.amount, 0);
    const bidShare = totalAsk + totalBid > 0 ? (totalBid / (totalAsk + totalBid)) * 100 : 50;

    return {
      success: true,
      pair: PAIR,
      mid: round8(mid),
      spread: round8(asks[0].price - bids[0].price),
      asks,
      bids,
      bidShare: round4(bidShare),
    };
  }

  // ── Trade history feed ──────────────────────────────────────────────────
  async getTrades(limit = 30) {
    const n = Math.max(1, Math.min(100, Math.floor(limit || 30)));
    const trades = await this.tradeModel
      .find()
      .sort({ createdAt: -1 })
      .limit(n)
      .lean<any>()
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

  // ── Market stats (MM bot + platform pool) ───────────────────────────────
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

  // ── INFO: 24h totals + lifetime + chart data (ELIXIR & ELIXCOIN) ───────
  /**
   * Everything the frontend INFO panel needs in one call:
   *   24h trade totals, lifetime totals, platform/pool state, and the raw
   *   numbers for the donut + hourly bar charts. All figures are server-side
   *   aggregates over the trade ledger — nothing client-supplied.
   */
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

    // 24 hourly buckets aligned to the start of the 24h window (UTC hours).
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
    const bucketMap = new Map<string, { volume: number; count: number }>();
    for (const b of buckets) {
      bucketMap.set(String(b._id), { volume: b.volume, count: b.count });
    }
    const start = since24.getTime();
    const hourly: {
      hour: number;
      label: string;
      volume: number;
      count: number;
    }[] = [];
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
      pair: PAIR,
      base: BASE,
      quote: QUOTE,
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

  // ── Admin: market-maker bot status + control ───────────────────────────
  async getBotStatus() {
    const pool = await this.getPool();
    const stats = await this.getStats();
    const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
    const lastRun = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : null;
    return {
      // Spread the full stats payload first so `success` / `lastBotRunAt` come
      // from getStats, then override with the live control fields below.
      ...stats,
      enabled: pool.botEnabled !== false,
      intervalMinutes: pool.botIntervalMinutes ?? 15,
      lastBotRunAt: pool.lastBotRunAt ?? null,
      nextBotRunAt: lastRun ? new Date(lastRun + intervalMs) : new Date(),
    };
  }

  /** Admin-tunable bot config — validated server-side, persisted on the pool. */
  async updateBotConfig(body: { enabled?: boolean; intervalMinutes?: number }) {
    const pool = await this.getPool();
    const set: Record<string, unknown> = {};
    if (typeof body.enabled === "boolean") set.botEnabled = body.enabled;
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
        .updateOne({ pair: PAIR }, { $set: set })
        .exec();
    }
    return this.getBotStatus();
  }

  // ── User holdings ───────────────────────────────────────────────────────
  async getHoldings(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    return {
      success: true,
      base: BASE,
      quote: QUOTE,
      elixir: round4(user?.elixirBalance || 0),
      elixcoin: round4((user?.cryptoBalances as Record<string, number> | undefined)?.[QUOTE_BALANCE_KEY] || 0),
    };
  }

  // ── User order placement ────────────────────────────────────────────────
  async placeOrder(
    telegramId: string,
    body: { side?: string; type?: string; amount?: number; price?: number },
  ) {
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
        error: `Minimum order is ${MIN_AMOUNT} ${BASE}`,
      };

    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) return { success: false, error: "Account not found" };

    const mid = pool.lastMid;
    const half = pool.spreadPct / 2;
    const ask = mid * (1 + half);
    const bid = mid * (1 - half);

    // Market → fill instantly at the aggressive side of the spread.
    if (type === "market") {
      const execPrice = side === "BUY" ? ask : bid;
      return this.executeFill(telegramId, side, round2(amount), round8(execPrice), "USER");
    }

    // Limit → fill now if it crosses, otherwise rest on the book.
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

  /**
   * Atomic fill: ONE findOneAndUpdate guards the balance inside the query and
   * deducts + credits in the same operation (no double-spend, no race).
   * The platform pool is the counterparty — its reserves are guarded the same
   * way, and it keeps the 1.5% fee plus the spread slip.
   *
   * Fee currency rule (so users are never confused about which coin the tax
   * is paid in): the fee is always charged in the currency the user RECEIVES.
   *   • BUY  (spend ELIXCOIN → receive ELIXIR)  → fee is ELIXIR
   *   • SELL (spend ELIXIR → receive ELIXCOIN)  → fee is ELIXCOIN
   */
  private async executeFill(
    telegramId: string,
    side: "BUY" | "SELL",
    amount: number,
    price: number,
    source: "BOT" | "USER",
  ) {
    if (source === "USER" && !telegramId)
      return { success: false, error: "Missing account" };

    const total = round4(amount * price); // quote (ELIXCOIN) value of the trade
    const pool = await this.getPool();
    const userKey = `cryptoBalances.${QUOTE_BALANCE_KEY}`;
    let updated: any = null;
    let fee = 0;
    let feeCurrency: "ELIXIR" | "ELIXCOIN" = QUOTE_BALANCE_KEY;

    if (side === "BUY") {
      // User spends ELIXCOIN (total), receives ELIXIR minus the 1.5% fee
      // charged in ELIXIR — the currency they receive.
      fee = round4(amount * FEE_PCT); // ELIXIR
      feeCurrency = BASE;
      const receivedElixir = round4(amount - fee);
      updated = await this.userModel
        .findOneAndUpdate(
          { telegramId, [userKey]: { $gte: total } },
          { $inc: { [userKey]: -total, elixirBalance: receivedElixir } },
          { new: true },
        )
        .exec();
      if (!updated)
        return { success: false, error: `Insufficient ${QUOTE} balance` };

      // Pool sells ELIXIR — guarded so reserves can never go negative.
      const poolUpd = await this.poolModel
        .findOneAndUpdate(
          { pair: PAIR, elixirReserve: { $gte: amount } },
          {
            $inc: {
              elixirReserve: -amount,
              elixcoinReserve: total,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(price - pool.lastMid) * amount,
            },
          },
        )
        .exec();
      if (!poolUpd) {
        // Roll back the user charge to keep the books exact.
        await this.userModel
          .updateOne(
            { telegramId },
            { $inc: { [userKey]: total, elixirBalance: -receivedElixir } },
          )
          .exec();
        return { success: false, error: "Insufficient platform liquidity" };
      }
    } else {
      // User spends ELIXIR (amount), receives ELIXCOIN minus the 1.5% fee
      // charged in ELIXCOIN — the currency they receive.
      fee = round4(total * FEE_PCT); // ELIXCOIN
      feeCurrency = QUOTE_BALANCE_KEY;
      const proceeds = round4(total - fee);
      updated = await this.userModel
        .findOneAndUpdate(
          { telegramId, elixirBalance: { $gte: amount } },
          { $inc: { elixirBalance: -amount, [userKey]: proceeds } },
          { new: true },
        )
        .exec();
      if (!updated)
        return { success: false, error: `Insufficient ${BASE} balance` };

      const poolUpd = await this.poolModel
        .findOneAndUpdate(
          { pair: PAIR, elixcoinReserve: { $gte: proceeds } },
          {
            $inc: {
              elixirReserve: amount,
              elixcoinReserve: -proceeds,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(pool.lastMid - price) * amount,
            },
          },
        )
        .exec();
      if (!poolUpd) {
        await this.userModel
          .updateOne(
            { telegramId },
            { $inc: { elixirBalance: amount, [userKey]: -proceeds } },
          )
          .exec();
        return { success: false, error: "Insufficient platform liquidity" };
      }
    }

    const trade = await this.tradeModel.create({
      pair: PAIR,
      side,
      price,
      amount,
      total,
      fee,
      feeCurrency,
      source,
      ...(source === "USER" ? { telegramId } : {}),
    });
    await this.poolModel
      .updateOne({ pair: PAIR }, { $inc: { lifetimeVolume: amount } })
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
        feeCurrency,
        source,
      },
      balances: {
        elixir: round4(updated.elixirBalance),
        elixcoin: round4(updated.cryptoBalances?.[QUOTE_BALANCE_KEY] || 0),
      },
      message:
        source === "USER"
          ? `Filled: ${side === "BUY" ? "Bought" : "Sold"} ${round2(amount)} ${BASE} @ ${round8(price)} ${QUOTE} · fee ${round4(fee)} ${feeCurrency}`
          : undefined,
    };
  }

  // ── Resting limit orders ────────────────────────────────────────────────
  async getOpenOrders(telegramId: string) {
    const orders = await this.orderModel
      .find({ telegramId, status: "OPEN" })
      .sort({ createdAt: -1 })
      .lean<any>()
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

  async cancelOrder(telegramId: string, orderId: string) {
    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, telegramId, status: "OPEN" },
        { $set: { status: "CANCELLED" } },
        { new: true },
      )
      .exec();
    if (!order) return { success: false, error: "Order not found or already closed" };
    return { success: true, order };
  }

  // ── The caller's own trade history (paginated, 5 per page + load-more) ──
  async getUserTrades(telegramId: string, page = 1, limit = 5) {
    const p = Math.max(1, Math.floor(page || 1));
    const n = Math.max(1, Math.min(50, Math.floor(limit || 5)));
    const skip = (p - 1) * n;
    const trades = await this.tradeModel
      .find({ telegramId, source: "USER" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(n)
      .lean<any>()
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

  /**
   * Match resting user limit orders against the current real-time price.
   * Called on every market-maker cycle so fills happen as the market moves.
   */
  async matchOpenOrders() {
    const pool = await this.getPool();
    const half = pool.spreadPct / 2;
    const ask = pool.lastMid * (1 + half);
    const bid = pool.lastMid * (1 - half);
    const open = await this.orderModel.find({ status: "OPEN" }).lean().exec();
    const fills: any[] = [];

    for (const o of open) {
      let fillPrice = 0;
      if (o.side === "BUY" && o.price >= ask) fillPrice = ask;
      if (o.side === "SELL" && o.price <= bid) fillPrice = bid;
      if (!fillPrice) continue;

      const res = await this.executeFill(
        o.telegramId,
        o.side,
        o.amount,
        round8(fillPrice),
        "USER",
      );
      if (res.success) {
        await this.orderModel
          .updateOne(
            { _id: o._id },
            { $set: { status: "FILLED", filledAmount: o.amount } },
          )
          .exec();
        fills.push({ orderId: String(o._id), trade: res.trade });
      }
    }
    return fills;
  }

  // ── Market-maker internals (driven by MarketMakerService) ───────────────
  /** Bounded random walk of the mid — the bot follows, never pushes, the market. */
  async driftMid() {
    const pool = await this.getPool();
    const drift = (Math.random() - 0.5) * 0.006; // ±0.3% per cycle
    const next = Math.min(MID_MAX, Math.max(MID_MIN, pool.lastMid * (1 + drift)));
    await this.poolModel
      .updateOne({ pair: PAIR }, { $set: { lastMid: round8(next) } })
      .exec();
  }

  /** One bot cycle: 5 buys + 5 sells, all at the real-time mid price. */
  async botCycle() {
    const pool = await this.getPool();
    const mid = pool.lastMid;

    const sides: ("BUY" | "SELL")[] = [
      ...Array(5).fill("BUY"),
      ...Array(5).fill("SELL"),
    ].sort(() => Math.random() - 0.5);

    const trades: any[] = [];
    for (const side of sides) {
      // Log-uniform random amount (50–1,200 ELIXIR): small trades frequent,
      // occasionally a bigger one — always bounded by pool liquidity so the
      // platform reserves can never be drained by the bot itself.
      let amount = this.randomAmount();
      const maxByReserve =
        side === "BUY"
          ? pool.elixirReserve * 0.04
          : (pool.elixcoinReserve / mid) * 0.04;
      amount = Math.max(10, Math.min(amount, maxByReserve));
      amount = round2(amount);

      const price = round8(mid); // exactly at the middle of the spread
      const total = round4(amount * price);
      const fee = round4(total * FEE_PCT);

      // Bot fills never touch a user account — only pool + trade history.
      if (side === "BUY") {
        const upd = await this.poolModel
          .findOneAndUpdate(
            { pair: PAIR, elixirReserve: { $gte: amount } },
            {
              $inc: {
                elixirReserve: -amount,
                elixcoinReserve: total + fee,
                platformFeesAccumulated: fee,
              },
            },
            { new: true },
          )
          .exec();
        if (!upd) continue;
      } else {
        const proceeds = round4(total - fee);
        const upd = await this.poolModel
          .findOneAndUpdate(
            { pair: PAIR, elixcoinReserve: { $gte: proceeds } },
            {
              $inc: {
                elixirReserve: amount,
                elixcoinReserve: -proceeds,
                platformFeesAccumulated: fee,
              },
            },
            { new: true },
          )
          .exec();
        if (!upd) continue;
      }

      const trade = await this.tradeModel.create({
        pair: PAIR,
        side,
        price,
        amount,
        total,
        fee,
        feeCurrency: "ELIXCOIN",
        source: "BOT",
      });
      trades.push(trade);
    }

    await this.poolModel
      .updateOne(
        { pair: PAIR },
        {
          $inc: { lifetimeVolume: trades.reduce((a, t) => a + t.amount, 0), botRunCount: 1 },
          $set: { lastBotRunAt: new Date() },
        },
      )
      .exec();

    return { count: trades.length, trades };
  }

  private randomAmount(): number {
    const min = 50;
    const max = 1200;
    const u = Math.random();
    return Math.exp(Math.log(min) + u * (Math.log(max) - Math.log(min)));
  }
}
