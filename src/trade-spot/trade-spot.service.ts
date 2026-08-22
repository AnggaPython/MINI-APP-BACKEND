import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { User } from "../users/schemas/user.schema";

// ── Pair constants ────────────────────────────────────────────────────────
export const DEFAULT_PAIR = "ELIXCOIN/ELIXIR";

/** Flat platform fee per transaction (1.5%). */
export const FEE_PCT = 0.015;

/** Full quoted spread (0.4% → ±0.2% around mid). */
export const SPREAD_PCT = 0.004;

export const MINERAL_INITIAL_RATES: Record<string, number> = {
  "ELIXCOIN/ELIXIR": 0.09674384,
  "ELIXCOIN/USDC": 0.00000967,
  "IRON/USDC": 0.00000003,
  "COPPER/USDC": 0.00000006, // approx 0.000000068 but matching MM drift bounds
  "SILVER/USDC": 0.00000068,
  "GOLD/USDC": 0.0000068,
  "DIAMOND/USDC": 0.000068,
};

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

// ── Anti-exploit constants ────────────────────────────────────────────────
const ORDER_RATE_LIMIT = 10; // max orders per minute per user
const CANCEL_RATE_LIMIT = 20; // max cancels per minute per user
const RATE_WINDOW_MS = 60_000;

// ── In-memory cache TTL (shared across ALL users — 0 extra DB reads) ──────
const TICKER_CACHE_MS = 3_000; // 3 seconds
const BOOK_CACHE_MS = 3_000;
const TRADES_CACHE_MS = 5_000;

@Injectable()
export class TradeSpotService {
  // Rate limit maps: telegramId -> array of timestamps (sliding window).
  private readonly orderTimestamps = new Map<string, number[]>();
  private readonly cancelTimestamps = new Map<string, number[]>();

  // In-memory caches — shared across ALL connected users. Keyed by pair.
  private tickerCache = new Map<string, { data: any; ts: number }>();
  private bookCache = new Map<
    string,
    { data: any; ts: number; depth: number }
  >();
  private tradesCache = new Map<
    string,
    { data: any; ts: number; limit: number }
  >();

  constructor(
    @InjectModel(Trade.name) private readonly tradeModel: Model<Trade>,
    @InjectModel(LiquidityPool.name)
    private readonly poolModel: Model<LiquidityPool>,
    @InjectModel(OpenOrder.name) private readonly orderModel: Model<OpenOrder>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }

  // ── Rate limit helpers (in-memory sliding window) ─────────────────────
  private evictRateLimit(
    map: Map<string, number[]>,
    telegramId: string,
    now: number,
  ): void {
    const ts = map.get(telegramId);
    if (!ts) return;
    const cutoff = now - RATE_WINDOW_MS;
    const filtered = ts.filter((t) => t > cutoff);
    if (filtered.length === 0) map.delete(telegramId);
    else map.set(telegramId, filtered);
  }

  private checkRateLimit(
    map: Map<string, number[]>,
    telegramId: string,
    limit: number,
    now: number,
  ): string | null {
    this.evictRateLimit(map, telegramId, now);
    const ts = map.get(telegramId) || [];
    if (ts.length >= limit) return "Too many requests. Please slow down.";
    ts.push(now);
    map.set(telegramId, ts);
    return null; // OK
  }

  // ── Pool (platform liquidity + market state) ────────────────────────────
  async getAllActivePools(): Promise<LiquidityPool[]> {
    return this.poolModel.find({ botEnabled: true }).exec();
  }

  async getPool(pair: string = DEFAULT_PAIR): Promise<LiquidityPool> {
    let pool = await this.poolModel.findOne({ pair }).exec();
    if (!pool) {
      if (MINERAL_INITIAL_RATES[pair]) {
        const initialMid = MINERAL_INITIAL_RATES[pair];
        pool = await this.poolModel.create({
          pair,
          baseReserve: 10_000_000,
          quoteReserve: 1_000_000,
          lastMid: initialMid,
          spreadPct: SPREAD_PCT,
          feePct: FEE_PCT,
          midMin: initialMid * 0.5,
          midMax: initialMid * 10,
        });
      } else {
        throw new Error(`Pool for ${pair} not found`);
      }
    } else if (pool.feePct !== FEE_PCT) {
      pool.feePct = FEE_PCT;
      await this.poolModel
        .updateOne({ pair }, { $set: { feePct: FEE_PCT } })
        .exec();
    }

    // [AUTO-HEAL]: Automatically sanitize and purge negative metrics caused by legacy Bot exhaustion
    if (
      (pool.volume24h && pool.volume24h < 0) ||
      (pool.baseReserve !== undefined && pool.baseReserve < 0) ||
      (pool.elixcoinReserve !== undefined && pool.elixcoinReserve < 0)
    ) {
      const setOps: any = {};
      if (pool.volume24h < 0) {
        setOps.volume24h = 0;
        pool.volume24h = 0;
      }
      if (pool.quoteVolume24h < 0) {
        setOps.quoteVolume24h = 0;
        pool.quoteVolume24h = 0;
      }
      if (pool.baseReserve !== undefined && pool.baseReserve < 0) {
        setOps.baseReserve = 10000000;
        pool.baseReserve = 10000000;
      }
      if (pool.quoteReserve !== undefined && pool.quoteReserve < 0) {
        setOps.quoteReserve = 1000000;
        pool.quoteReserve = 1000000;
      }
      if (pool.elixcoinReserve !== undefined && pool.elixcoinReserve < 0) {
        setOps.elixcoinReserve = 10000000;
        pool.elixcoinReserve = 10000000;
      }
      if (pool.elixirReserve !== undefined && pool.elixirReserve < 0) {
        setOps.elixirReserve = 1000000;
        pool.elixirReserve = 1000000;
      }

      if (Object.keys(setOps).length > 0) {
        await this.poolModel.updateOne({ pair }, { $set: setOps }).exec();
      }
    }
    return pool;
  }

  // ── Ticker: last price + 24h stats (pre-computed on pool, cached 3s) ──
  async getTicker(pair: string = DEFAULT_PAIR) {
    const now = Date.now();
    const cache = this.tickerCache.get(pair);
    if (cache?.data && now - cache.ts < TICKER_CACHE_MS) {
      return cache.data;
    }

    const pool = await this.getPool(pair);
    const close = pool.lastMid;
    const open = pool.open24h || close;
    const high = pool.high24h || close;
    const low = pool.low24h === Infinity ? close : pool.low24h || close;
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

  // ── Order book: synthetic ladder (cached 3s, shared across users) ──────
  async getOrderBook(depth = 10, pair = DEFAULT_PAIR) {
    const now = Date.now();
    const clamped = Math.max(5, Math.min(25, Math.floor(depth || 10)));
    const cache = this.bookCache.get(pair);

    if (
      cache?.data &&
      now - cache.ts < BOOK_CACHE_MS &&
      cache.depth === clamped
    ) {
      return cache.data;
    }
    const pool = await this.getPool(pair);
    const mid = pool.lastMid;
    const half = pool.spreadPct / 2;
    const step = 0.0012; // 0.12% between consecutive levels

    const asks: { price: number; amount: number }[] = [];
    const bids: { price: number; amount: number }[] = [];

    for (let i = 0; i < clamped; i++) {
      const rngDepthAsks = mulberry32(Math.round(mid * 1e6) + i * 5123);
      const rngDepthBids = mulberry32(Math.round(mid * 1e6) + i * 7919);

      // Randomize natural depth clamped loosely between 150k and 3.5M
      // 20% chance of thick "whale" walls on specific ticks. No more predictable tapering.
      const askBase =
        rngDepthAsks() > 0.8
          ? 2_000_000 + rngDepthAsks() * 1_500_000
          : 150_000 + rngDepthAsks() * 600_000;
      const bidBase =
        rngDepthBids() > 0.8
          ? 2_500_000 + rngDepthBids() * 2_000_000
          : 250_000 + rngDepthBids() * 700_000;

      const askPrice = round8(mid * (1 + half + step * i));
      asks.push({ price: askPrice, amount: round2(askBase) });

      const bidPrice = round8(mid * (1 - half - step * i));
      bids.push({ price: bidPrice, amount: round2(bidBase) });
    }

    // [NEW] Merge active user Limit Orders into the AMM visual depth
    const openOrders = await this.orderModel
      .find({ pair, status: "OPEN" })
      .lean()
      .exec();
    for (const o of openOrders) {
      if (!isFinite(o.price) || o.price <= 0) continue;
      const rem = (o.amount || 0) - (o.filledAmount || 0);
      if (rem <= 0) continue;

      const targetList = o.side === "SELL" ? asks : bids;
      const match = targetList.find((x) => x.price === o.price);
      if (match) {
        match.amount += rem;
      } else {
        targetList.push({ price: o.price, amount: rem });
      }
    }

    // Sort to keep real order book logic: Asks (Lowest first), Bids (Highest first)
    asks.sort((a, b) => a.price - b.price);
    bids.sort((a, b) => b.price - a.price);

    // Clamp to requested depth after injected users
    const finAsks = asks.slice(0, clamped);
    const finBids = bids.slice(0, clamped);

    const totalAsk = finAsks.reduce((acc, l) => acc + l.amount, 0);
    const totalBid = finBids.reduce((acc, l) => acc + l.amount, 0);
    const bidShare =
      totalAsk + totalBid > 0 ? (totalBid / (totalAsk + totalBid)) * 100 : 50;

    const result = {
      success: true,
      pair,
      mid: round8(mid),
      spread: round8(finAsks[0]?.price - finBids[0]?.price || 0),
      asks: finAsks,
      bids: finBids,
      bidShare: Math.max(0, Math.min(100, round2(bidShare))),
    };
    this.bookCache.set(pair, { data: result, ts: now, depth: clamped });
    return result;
  }

  // ── Trade history feed (cached 5s, shared across users) ────────────────
  async getTrades(limit = 30, pair = DEFAULT_PAIR) {
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
      .lean<any>()
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

  // ── Market stats (MM bot + platform pool) ───────────────────────────────
  async getStats(pair = DEFAULT_PAIR) {
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
      quoteReserve: round2(pool.quoteReserve || pool.elixirReserve),
      baseReserve: round2(pool.baseReserve || pool.elixcoinReserve),
      lastMid: round8(pool.lastMid),
      feePct: pool.feePct,
      spreadPct: pool.spreadPct,
    };
  }

  // ── INFO: 24h totals + lifetime + chart data ───────
  async getInfo(pair = DEFAULT_PAIR) {
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
    const bucketMap = new Map<string, { volume: number; count: number }>();
    for (const b of buckets) {
      bucketMap.set(String(b._id), { volume: b.volume, count: b.count });
    }
    const start = since24.getTime();
    const hourly: any[] = [];
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

  // ── Admin: market-maker bot status + control ───────────────────────────
  async getBotStatus(pair = DEFAULT_PAIR) {
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

  async updateBotConfig(body: {
    pair?: string;
    enabled?: boolean;
    intervalMinutes?: number;
  }) {
    const pair = body.pair || DEFAULT_PAIR;
    const pool = await this.getPool(pair);
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
      await this.poolModel.updateOne({ pair }, { $set: set }).exec();
    }
    return this.getBotStatus(pair);
  }

  // ── User holdings ───────────────────────────────────────────────────────
  async getHoldings(telegramId: string, pair: string = DEFAULT_PAIR) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    const [base, quote] = pair.split("/");
    const crypto = user?.cryptoBalances as Record<string, number> | undefined;
    return {
      success: true,
      base,
      quote,
      baseBalance: round4(
        base === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[base] || 0,
      ),
      quoteBalance: round4(
        quote === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[quote] || 0,
      ),
      // LEGACY fallback for exact matching on the frontend until updated:
      elixcoin: round4(crypto?.["ELIXCOIN"] || 0),
      elixir: round4(user?.elixirBalance || 0),
    };
  }

  // ── User order placement ────────────────────────────────────────────────
  async placeOrder(
    telegramId: string,
    body: {
      pair?: string;
      side?: string;
      type?: string;
      amount?: number;
      price?: number;
    },
  ) {
    const rateErr = this.checkRateLimit(
      this.orderTimestamps,
      telegramId,
      ORDER_RATE_LIMIT,
      Date.now(),
    );
    if (rateErr) return { success: false, error: rateErr };

    const pair = body.pair || DEFAULT_PAIR;
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
    if (!user) return { success: false, error: "Account not found" };

    const mid = pool.lastMid;
    const half = pool.spreadPct / 2;
    const ask = mid * (1 + half);
    const bid = mid * (1 - half);

    if (type === "market") {
      const execPrice = side === "BUY" ? ask : bid;
      return this.executeFill(
        pair,
        telegramId,
        side,
        round2(amount),
        round8(execPrice),
        "USER",
      );
    }

    const limit = Number(body.price);
    if (!isFinite(limit) || limit <= 0)
      return { success: false, error: "Invalid limit price" };
    if (side === "BUY" && limit >= ask)
      return this.executeFill(
        pair,
        telegramId,
        "BUY",
        round2(amount),
        round8(ask),
        "USER",
      );
    if (side === "SELL" && limit <= bid)
      return this.executeFill(
        pair,
        telegramId,
        "SELL",
        round2(amount),
        round8(bid),
        "USER",
      );

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

  /**
   * Atomic fill: ONE findOneAndUpdate guards the balance inside the query and
   * deducts + credits in the same operation (no double-spend, no race).
   * Fee currency rule: the fee is always charged in the currency the user RECEIVES.
   */
  private async executeFill(
    pair: string,
    telegramId: string,
    side: "BUY" | "SELL",
    amount: number,
    price: number,
    source: "BOT" | "USER",
  ) {
    if (source === "USER" && !telegramId)
      return { success: false, error: "Missing account" };

    const total = round4(amount * price);
    const pool = await this.getPool(pair);
    const [base, quote] = pair.split("/");
    const baseKey =
      base === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${base}`;
    const quoteKey =
      quote === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${quote}`;

    let updated: any = null;
    let fee = 0;
    let feeCurrency = base;

    if (side === "BUY") {
      fee = round4(amount * FEE_PCT);
      feeCurrency = base;
      const receivedBase = round4(amount - fee);

      updated = await this.userModel
        .findOneAndUpdate(
          { telegramId, [quoteKey]: { $gte: total } },
          { $inc: { [quoteKey]: -total, [baseKey]: receivedBase } },
          { returnDocument: "after" },
        )
        .exec();
      if (!updated)
        return { success: false, error: `Insufficient ${quote} balance` };

      // [NEW] Elastic Market Dynamics: Calculate organic price impact (Max 5% slip per transaction)
      const impactRatio = amount / Math.max(1, pool.baseReserve || 10_000_000);
      const shiftPct = Math.min(0.05, impactRatio * 0.5); // 0.5 elasticity dampener
      const newMid = round8(pool.lastMid * (1 + shiftPct));

      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: -amount,
              quoteReserve: total,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(price - pool.lastMid) * amount,
            },
            $set: {
              lastMid: newMid,
            },
          },
        )
        .exec();
      // Elastic Treasury: The transaction is guaranteed to succeed. No 'Insufficient Liquidity' rejections.
    } else {
      fee = round4(total * FEE_PCT);
      feeCurrency = quote;
      const proceeds = round4(total - fee);

      updated = await this.userModel
        .findOneAndUpdate(
          { telegramId, [baseKey]: { $gte: amount } },
          { $inc: { [baseKey]: -amount, [quoteKey]: proceeds } },
          { returnDocument: "after" },
        )
        .exec();
      if (!updated)
        return { success: false, error: `Insufficient ${base} balance` };

      // [NEW] Elastic Market Dynamics
      const impactRatio = amount / Math.max(1, pool.baseReserve || 10_000_000);
      const shiftPct = Math.min(0.05, impactRatio * 0.5);
      const newMid = round8(pool.lastMid * (1 - shiftPct));

      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: amount,
              quoteReserve: -proceeds,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(pool.lastMid - price) * amount,
            },
            $set: {
              lastMid: newMid,
            },
          },
        )
        .exec();
      // Elastic Treasury bounds ensure success
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
    await this.poolModel
      .updateOne(
        { pair },
        {
          $inc: {
            lifetimeVolume: amount,
            volume24h: amount,
            quoteVolume24h: quoteAmt,
          },
          $max: { high24h: price },
          $min: { low24h: price },
        },
      )
      .exec();

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
        baseBalance: round4(
          base === "ELIXIR"
            ? updated?.elixirBalance || 0
            : updated?.cryptoBalances?.[base] || 0,
        ),
        quoteBalance: round4(
          quote === "ELIXIR"
            ? updated?.elixirBalance || 0
            : updated?.cryptoBalances?.[quote] || 0,
        ),
        // Legacy:
        elixcoin: round4(updated?.cryptoBalances?.["ELIXCOIN"] || 0),
        elixir: round4(updated.elixirBalance),
      },
      message:
        source === "USER"
          ? `Filled: ${side === "BUY" ? "Bought" : "Sold"} ${round2(amount)} ${base} @ ${round8(price)} ${quote} · fee ${round4(fee)} ${feeCurrency}`
          : undefined,
    };
  }

  // ── Resting limit orders ────────────────────────────────────────────────
  async getOpenOrders(telegramId: string, pair: string = DEFAULT_PAIR) {
    const orders = await this.orderModel
      .find({ telegramId, status: "OPEN", pair })
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
    const rateErr = this.checkRateLimit(
      this.cancelTimestamps,
      telegramId,
      CANCEL_RATE_LIMIT,
      Date.now(),
    );
    if (rateErr) return { success: false, error: rateErr };

    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, telegramId, status: "OPEN" },
        { $set: { status: "CANCELLED" } },
        { returnDocument: "after" },
      )
      .exec();
    if (!order)
      return { success: false, error: "Order not found or already closed" };
    return { success: true, order };
  }

  // ── The caller's own trade history (paginated, 5 per page + load-more) ──
  async getUserTrades(
    telegramId: string,
    page = 1,
    limit = 5,
    pair = DEFAULT_PAIR,
  ) {
    const p = Math.max(1, Math.floor(page || 1));
    const n = Math.max(1, Math.min(50, Math.floor(limit || 5)));
    const skip = (p - 1) * n;

    const query: any = { telegramId, source: "USER" };
    if (pair) query.pair = pair;

    const trades = await this.tradeModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(n)
      .lean<any>()
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

  /**
   * Match resting user limit orders against the current real-time price.
   * Called on every market-maker cycle so fills happen as the market moves.
   */
  async matchOpenOrders(pair = DEFAULT_PAIR) {
    const pool = await this.getPool(pair);
    const half = pool.spreadPct / 2;
    const ask = pool.lastMid * (1 + half);
    const bid = pool.lastMid * (1 - half);
    const open = await this.orderModel
      .find({ status: "OPEN", pair })
      .lean()
      .exec();
    const fills: any[] = [];

    for (const o of open) {
      let fillPrice = 0;
      if (o.side === "BUY" && o.price >= ask) fillPrice = ask;
      if (o.side === "SELL" && o.price <= bid) fillPrice = bid;
      if (!fillPrice) continue;

      const res = await this.executeFill(
        pair,
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
  async driftMid(pair = DEFAULT_PAIR) {
    const pool = await this.getPool(pair);

    // [NEW] Algorithmic Gravity Peg (Mean Reversion)
    const anchorRate = MINERAL_INITIAL_RATES[pair];
    let gravity = 0;
    if (anchorRate) {
      // Calculate how far the current live price has drifted from its native stable rate
      const diffPct = (pool.lastMid - anchorRate) / anchorRate;
      // Gravity force applies a subtle, persistent tug (e.g. 5% of the distance) pulling it back towards stability
      gravity = -diffPct * 0.05;
    }

    const volatility = (Math.random() - 0.5) * 0.006;
    const drift = volatility + gravity;

    const minBound = pool.midMin;
    const maxBound = pool.midMax;
    const next = Math.min(
      maxBound,
      Math.max(minBound, pool.lastMid * (1 + drift)),
    );
    await this.poolModel
      .updateOne({ pair }, { $set: { lastMid: round8(next) } })
      .exec();
  }

  async botCycle(pair = DEFAULT_PAIR) {
    const pool = await this.getPool(pair);
    const mid = pool.lastMid;
    const [base, quote] = pair.split("/");

    const sides: ("BUY" | "SELL")[] = [
      ...Array(5).fill("BUY"),
      ...Array(5).fill("SELL"),
    ].sort(() => Math.random() - 0.5);

    const trades: any[] = [];
    const baseReserveKey = "baseReserve";
    const quoteReserveKey = "quoteReserve";

    // Fallbacks just in case older pools haven't migrated
    const baseResVal = pool.baseReserve || pool.elixcoinReserve;
    const quoteResVal = pool.quoteReserve || pool.elixirReserve;

    for (const side of sides) {
      // Create a massive random target quote volume (e.g. 50 to 500 ELIXIR)
      // so the bot executes trades in the thousands rather than pennies.
      const targetQuoteVolume = Math.random() * 450 + 50;
      let amount = targetQuoteVolume / mid;

      amount = round2(amount);

      const price = round8(mid);
      const total = round4(amount * price);
      const fee = round4(total * FEE_PCT);

      // Liquidity Recycle Mechanism (AI Pattern):
      // By completely skipping mutations to baseReserve and quoteReserve,
      // the Market Maker bot executes synthetic cycles purely as "virtual"
      // mirrored volume. It dumps accumulated spread fees into the treasury
      // but retains 100% of the active platform liquidity balance.
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
    const shouldResetDay =
      !pool.dayResetAt || now - pool.dayResetAt.getTime() > 24 * 3600_000;

    const cycleVolume = trades.reduce((a, t) => a + t.amount, 0);
    const cycleQuoteVol = trades.reduce((a, t) => a + t.total, 0);

    const updateOps: { $inc: any; $set?: any; $max?: any; $min?: any } = {
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
    } else {
      updateOps.$set = { lastBotRunAt: new Date() };
      updateOps.$inc.volume24h = cycleVolume;
      updateOps.$inc.quoteVolume24h = cycleQuoteVol;
      if (trades.length > 0) {
        const lastPrice = trades[trades.length - 1].price;
        updateOps.$max = { high24h: lastPrice };
        updateOps.$min = { low24h: lastPrice };
      }
    }

    await this.poolModel.updateOne({ pair }, updateOps as any).exec();

    // [NEW] Algorithmic Garbage Collection (Avoid DB Bloat)
    // Run cleanup periodically (e.g., every 15 cycles) to wipe old excess bot trades
    if (pool.botRunCount && pool.botRunCount % 15 === 0) {
      const excessBots = await this.tradeModel
        .find({ pair, source: "BOT" })
        .sort({ createdAt: -1 })
        .skip(200) // Keep the freshest 200 logs for the UI history, delete the rest
        .select("_id")
        .exec();

      if (excessBots.length > 0) {
        const excessIds = excessBots.map((doc) => doc._id);
        // Exclusively deletes "BOT" history! "USER" trades are immortalized securely.
        await this.tradeModel.deleteMany({ _id: { $in: excessIds } }).exec();
      }
    }

    this.tickerCache.delete(pair);
    this.bookCache.delete(pair);
    this.tradesCache.delete(pair);

    return { count: trades.length, trades };
  }
}
