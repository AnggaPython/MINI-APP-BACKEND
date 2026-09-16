import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { PendingTpSl, PendingTpSlDocument } from "./schemas/pending-tp-sl.schema";
import { User } from "../users/schemas/user.schema";
import { AssetRegistryService } from "./asset-registry.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
import { SseService } from "./sse.service";
import { isItemBase, isMaterialBase, slugToMaterialName, COIN_BASES } from "./item-sync";
import { ItemTradeService } from "./item-trade.service";
import {
  DEFAULT_PAIR, FEE_PCT, SPREAD_PCT, CORE_BOT_PAIRS, STABLE_ASSETS,
  // @ts-ignore - super strict cleanup pending (auto)
  TRADE_LIMITS, ALL_INITIAL_RATES, MINERAL_INITIAL_RATES,
} from "./trade-pairs";

// Re-export for use by other modules
export { isItemBase } from "./item-sync";
export { DEFAULT_PAIR, FEE_PCT, SPREAD_PCT, CORE_BOT_PAIRS, MINERAL_INITIAL_RATES } from "./trade-pairs";

const round8 = (n: number) => Math.round(n * 1e8) / 1e8;
const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Dust tolerance on trade MINIMUMs (boundary orders sized exactly at the
 *  minimum can evaluate a hair below it after fees/padding/rounding). */
const MIN_TOLERANCE = 0.98;

/** Base assets traded in whole units (no fractions). */
const INT_BASES = ["ELIXCOIN", "COPPER", "IRON", "SILVER", "GOLD"];

/** Deterministic PRNG — stable order-book ladder between price ticks. */
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;  return () => {
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
  private tickerCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
  private bookCache = new Map<
    string,
    { data: Record<string, unknown>; ts: number; depth: number }
  >();
  private tradesCache = new Map<
    string,
    { data: Record<string, unknown>; ts: number; limit: number }
  >();
  private infoCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
  private readonly INFO_CACHE_MS = 60_000;

  // [TRADE IMPACT] Track last user trade per pair for asymmetric orderbook.
  // After a large BUY, bid-side lags behind (no free buyback).
  // After a large SELL, ask-side lags behind.
  private lastUserTradeImpact = new Map<
    string,
    { side: string; time: number; impact: number }
  >();
  // Previous mid before last user trade — used for lagging opposite side.
  private previousMid = new Map<string, number>();

  private readonly logger = new Logger(TradeSpotService.name);

  constructor(
    @InjectModel(Trade.name) private readonly tradeModel: Model<Trade>,
    @InjectModel(LiquidityPool.name)
    private readonly poolModel: Model<LiquidityPool>,
    @InjectModel(OpenOrder.name) private readonly orderModel: Model<OpenOrder>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly assetRegistry: AssetRegistryService,
    private readonly buffCollectionsService: BuffItemCollectionsService,
    private readonly sseService: SseService,
    private readonly itemTradeService: ItemTradeService,
    @InjectModel(PendingTpSl.name) private readonly pendingTpSlModel: Model<PendingTpSlDocument>,
  ) {
    // Sweep Maps every 10 min to prevent RAM bloat on Railway (512MB)
    setInterval(() => this.sweepMemory(), 10 * 60 * 1000).unref();
  }

  private sweepMemory(): void {
    const now = Date.now();
    // Sweep rate-limit maps (idle users)
    for (const [k, arr] of this.orderTimestamps) {
      const filtered = arr.filter((t) => now - t < RATE_WINDOW_MS);
      if (filtered.length === 0) this.orderTimestamps.delete(k);
      else this.orderTimestamps.set(k, filtered);
    }
    for (const [k, arr] of this.cancelTimestamps) {
      const filtered = arr.filter((t) => now - t < RATE_WINDOW_MS);
      if (filtered.length === 0) this.cancelTimestamps.delete(k);
      else this.cancelTimestamps.set(k, filtered);
    }
    // Sweep trade impact (60s decay)
    for (const [k, v] of this.lastUserTradeImpact) {
      if (now - v.time > 60_000) this.lastUserTradeImpact.delete(k);
  // @ts-ignore - super strict cleanup pending (auto)
    }
  // @ts-ignore - super strict pending
    for (const [k, v] of this.previousMid) {
      const impact = this.lastUserTradeImpact.get(k);
      if (!impact) this.previousMid.delete(k);
    }
    // Sweep caches (TTL 3-5s, but ensure max 500 entries)
    if (this.tickerCache.size > 500) this.tickerCache.clear();
    if (this.bookCache.size > 500) this.bookCache.clear();
    if (this.tradesCache.size > 500) this.tradesCache.clear();
    if (this.infoCache.size > 200) this.infoCache.clear();
    for (const [k, v] of this.infoCache) {
      if (now - v.ts > this.INFO_CACHE_MS) this.infoCache.delete(k);
    }
    if (this.tickerCache.size > 0 || this.bookCache.size > 0) {
      this.logger.debug(`[Sweep] Maps: order:${this.orderTimestamps.size} book:${this.bookCache.size} impact:${this.lastUserTradeImpact.size}`);
    }
  }

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

  async getAllPools(): Promise<LiquidityPool[]> {
    return this.poolModel.find({}).lean().exec();
  }

  // ── Admin Price Control ──────────────────────────────────────────────
  async setAdminPriceControl(
    pair: string,
    bidFloor: number,
  // @ts-ignore - super strict cleanup pending (auto)
    askCeiling: number,
  // @ts-ignore - super strict pending
  ): Promise<Record<string, unknown>> {
  // @ts-ignore - super strict pending
    const pool = await this.getPool(pair);
    const mid = round8((bidFloor + askCeiling) / 2);

    await this.poolModel
      .updateOne(
        { pair },
        {
          $set: {
            adminBidFloor: bidFloor,
            adminAskCeiling: askCeiling,
            lastMid: mid,
          },
        },
      )
      .exec();

    // Clear caches
    this.tickerCache.delete(pair);
    this.bookCache.delete(pair);

    this.logger.log(
      `[Admin] Price control set for ${pair}: BUY ≥ ${bidFloor} | SELL ≤ ${askCeiling} | mid = ${mid}`,
    );

    return {
      success: true,
      pair,
      bidFloor,
      askCeiling,
      mid,
      message: `Price control active: bot trades between ${bidFloor} and ${askCeiling}`,
    };
  }

  async clearAdminPriceControl(pair: string): Promise<Record<string, unknown>> {
    await this.poolModel
      .updateOne(
        { pair },
        { $set: { adminBidFloor: 0, adminAskCeiling: 0 } },
      )
      .exec();

    this.tickerCache.delete(pair);
    this.bookCache.delete(pair);

    this.logger.log(`[Admin] Price control cleared for ${pair}`); return {
      success: true,
      pair,
      message: `Price control removed for ${pair}. Bot resumes normal drift.`,
    };
  }

  // ── Admin Order Book Walls ──────────────────────────────────────────
  async setAdminWalls(
    pair: string,
    sellWalls?: { price: number; amount: number }[],
    buyWalls?: { price: number; amount: number }[],
  ): Promise<Record<string, unknown>> {
    const set: Record<string, { price: number; amount: number }[]> = {};
    if (sellWalls !== undefined) set.adminSellWalls = sellWalls;
    if (buyWalls !== undefined) set.adminBuyWalls = buyWalls;

    if (Object.keys(set).length === 0) {
      return { success: false, error: "No walls provided" };
    }

    await this.poolModel.updateOne({ pair }, { $set: set }).exec();
    this.bookCache.delete(pair);

    const sellCount = sellWalls?.length ?? 0;
    const buyCount = buyWalls?.length ?? 0;
    this.logger.log(
      `[Admin] Walls set for ${pair}: ${sellCount} SELL + ${buyCount} BUY`,
    );

    return {
      success: true,
      pair,
      sellWalls: sellWalls ?? [],
      buyWalls: buyWalls ?? [],
      message: `${sellCount} SELL walls + ${buyCount} BUY walls deployed for ${pair}`,
    };
  }

  async clearAdminWalls(pair: string): Promise<Record<string, unknown>> {
    await this.poolModel
      .updateOne(
        { pair },
        { $set: { adminSellWalls: [], adminBuyWalls: [] } },
      )
      .exec();
    this.bookCache.delete(pair);

    this.logger.log(`[Admin] Walls cleared for ${pair}`);

    return {
      success: true,
      pair,
      message: `All walls removed for ${pair}`,
    };
  }

  async getPool(pair: string = DEFAULT_PAIR): Promise<LiquidityPool> {
    let pool = await this.poolModel.findOne({ pair }).exec();
    if (!pool) {
      if (ALL_INITIAL_RATES[pair]) {
        const initialMid = ALL_INITIAL_RATES[pair];
        // Bot only runs on core pairs — item/buff pairs are managed by admin
        const isBotEnabled = CORE_BOT_PAIRS.has(pair);
        try {
          pool = await this.poolModel.create({
            pair,
            baseReserve: 10_000_000,
            quoteReserve: 1_000_000,
            lastMid: initialMid,
            spreadPct: SPREAD_PCT,
            feePct: FEE_PCT,
            midMin: initialMid * 0.5,
            midMax: initialMid * 10,
            botEnabled: isBotEnabled,
          });
        } catch (err: unknown) {
          if ((err as { code?: number })?.code === 11000) {
            // Race condition: another request created the pool first — fetch it
            pool = await this.poolModel.findOne({ pair }).exec();
          } else {
            throw err;
          }
        }
        if (!pool) {
          throw new Error(`Pool for ${pair} could not be created or found`);
        }
      } else {
        throw new Error(`Pool for ${pair} not found`);
      }
    } else if (pool.feePct !== FEE_PCT) {
      pool.feePct = FEE_PCT;
      await this.poolModel
        .updateOne({ pair }, { $set: { feePct: FEE_PCT } })
        .exec();
    }

    // [AUTO-HEAL]: Instantly reset depleted reserves. Triggers at <= 0 OR critically low (< 10% initial).
    const BASE_INIT = 10_000_000;
    const QUOTE_INIT = 1_000_000;
    const CRITICAL_PCT = 0.002; // reset when 99.8% depleted (< 0.2% remaining)
    const baseLow = pool.baseReserve != null && pool.baseReserve <= BASE_INIT * CRITICAL_PCT;
    const quoteLow = pool.quoteReserve != null && pool.quoteReserve <= QUOTE_INIT * CRITICAL_PCT;
    const volNeg = (pool.volume24h && pool.volume24h < 0) || (pool.quoteVolume24h && pool.quoteVolume24h < 0);

    if (baseLow || quoteLow || volNeg) {
      const setOps: Record<string, number> = {};
      if (pool.volume24h && pool.volume24h < 0) { setOps.volume24h = 0; pool.volume24h = 0; }
      if (pool.quoteVolume24h && pool.quoteVolume24h < 0) { setOps.quoteVolume24h = 0; pool.quoteVolume24h = 0; }
      if (baseLow) { setOps.baseReserve = BASE_INIT; pool.baseReserve = BASE_INIT; }
      if (quoteLow) { setOps.quoteReserve = QUOTE_INIT; pool.quoteReserve = QUOTE_INIT; }

      if (Object.keys(setOps).length > 0) {
        await this.poolModel.updateOne({ pair }, { $set: setOps }).exec();
      }
    }
    // [STABLE PAIR SKIP] For pairs where ELIXCOIN is the base (coinbase)
    // and it's now stable, always use global mid and ignore any stale admin
    // ceiling/floor that may have been left from when ELIXCOIN was drifting.
    const [poolBase, poolQuote] = pair.split("/");
    const elixcoinInvolved =
      poolBase === "ELIXCOIN" || poolQuote === "ELIXCOIN";

    if (elixcoinInvolved && STABLE_ASSETS.has("ELIXCOIN")) {
      // Always use global mid for ELIXCOIN mineral pairs
      const globalMid = await this.assetRegistry.getMidFromGlobalReserves(pair);
      if (globalMid > 0 && Math.abs(globalMid - pool.lastMid) > 1e-12) {
        pool.lastMid = globalMid;
        await this.poolModel
          .updateOne({ pair }, { $set: { lastMid: globalMid } })
          .exec();
      }
    } else if (pool.adminBidFloor > 0 && pool.adminAskCeiling > 0) {
      // [ADMIN PRICE CONTROL] If admin has set bid/ask range, use that
      // instead of global asset registry. Admin price is ALWAYS authoritative.
      const adminMid = round8((pool.adminBidFloor + pool.adminAskCeiling) / 2);
      pool.lastMid = adminMid;
      await this.poolModel
        .updateOne({ pair }, { $set: { lastMid: adminMid } })
        .exec();
    } else {
      // [CROSS-PAIR SYNC] Override lastMid from global asset registry.
      // This ensures IRON/USDC and ELIXCOIN/IRON always show consistent
      // prices, preventing cross-pair arbitrage.
      const globalMid = await this.assetRegistry.getMidFromGlobalReserves(pair);
      if (globalMid > 0) {
        pool.lastMid = globalMid;
        await this.poolModel
          .updateOne({ pair }, { $set: { lastMid: globalMid } })
          .exec();
      }    }

    // [24H RESET] Ensure daily stats reset for ALL pools, even those without
    // the bot running. Without this, disabled-bot pools never reset open24h,
    // volume24h, high24h, low24h — making change% permanently stale.
    const now24h = Date.now();
    if (
      !pool.dayResetAt ||
      now24h - pool.dayResetAt.getTime() > 24 * 3600_000
    ) {
      // Reset 24h stats using current mid as new open
      const resetOps: Record<string, unknown> = {
        dayResetAt: new Date(),
        open24h: pool.lastMid,
        high24h: pool.lastMid,
        low24h: pool.lastMid,
        volume24h: 0,
        quoteVolume24h: 0,
        // Regenerate cosmetic change% on daily reset
        cosmeticChangePct: -1.56 + Math.random() * (2.27 - (-1.56)),
        cosmeticPctUpdatedAt: new Date(),
      };
  // @ts-ignore - super strict cleanup pending (auto)
      await this.poolModel
        .updateOne({ pair }, { $set: resetOps })
        .exec();
      pool.dayResetAt = resetOps.dayResetAt as unknown as Date;
      pool.open24h = resetOps.open24h as unknown as number;
      pool.high24h = resetOps.high24h as unknown as number;
      pool.low24h = resetOps.low24h as unknown as number;
      pool.volume24h = 0;
      pool.quoteVolume24h = 0;
    }

    return pool;
  }


  // ── Ticker: last price + 24h stats (pre-computed on pool, cached 3s) ──
  async getTicker(pair: string = DEFAULT_PAIR) {
    const now = Date.now();
    const cache = this.tickerCache.get(pair);
    if (cache?.data && now - cache.ts < TICKER_CACHE_MS) {
      return cache.data;
  // @ts-ignore - super strict cleanup pending (auto)
    }

  // @ts-ignore - super strict pending
    const pool = await this.getPool(pair);
    const anchorMid = pool.lastMid; // fixed anchor price
  // @ts-ignore - super strict pending
    const open = pool.open24h || anchorMid;
    const high = pool.high24h || anchorMid;
    const low = pool.low24h === Infinity ? anchorMid : pool.low24h || anchorMid;
    const volume = pool.volume24h || 0;
    const quoteVolume = pool.quoteVolume24h || 0;
  // @ts-ignore - super strict pending
    const [base, quote] = pair.split("/");

    // ── Last trade price — makes ticker dynamic instead of always anchor
    const lastTrade = await this.tradeModel
      .findOne({ pair }, { price: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();
    const close = lastTrade?.price || anchorMid;

    // ── REAL 24h change% — last vs daily open. No more cosmetic random
    // values: every % shown anywhere (pair header, dropdown, marketplace
    // cards, trade widget) now traces to real prints, matching the chart.
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

  async getTickers(pairs: string[]) {
    return Promise.all(pairs.map((p) => this.getTicker(p)));
  }

  // ── Order book: synthetic ladder (cached 3s, shared across users) ──────
  async getOrderBook(depth = 10, pair = DEFAULT_PAIR, telegramId?: string) {
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
  // @ts-ignore - super strict pending
    const pool = await this.getPool(pair);
    // Use last trade price for dynamic mid display, fallback to anchor
    const lastTrade = await this.tradeModel
      .findOne({ pair }, { price: 1 })
      .sort({ createdAt: -1 })
      .lean();
    const mid = lastTrade?.price || pool.lastMid;
    const half = pool.spreadPct / 2;
    const step = 0.0012; // 0.12% between consecutive levels

    const asks: { price: number; amount: number; isMine?: boolean }[] = [];
    const bids: { price: number; amount: number; isMine?: boolean }[] = [];

    // Derive the smallest price unit that survives round8 for this mid price.
    const magnitude = Math.pow(10, Math.floor(Math.log10(mid)) - 7);
    const minVisibleTick = Math.max(magnitude, 0.00000001);
    const pctStep = mid * step;
    const levelStep = pctStep > minVisibleTick ? pctStep : minVisibleTick;
    const halfSpreadRaw = Math.max(mid * half, minVisibleTick);

    // For ultra-micro pairs, limit depth so bids never go ≤ 0.
    // deepest bid = mid - halfSpreadRaw - levelStep * (depth - 1) > 0
    // → depth < (mid - halfSpreadRaw) / levelStep + 1
    const maxSafeDepth = Math.max(
      1,
      Math.floor((mid - halfSpreadRaw) / levelStep),
    );
    const safeDepth = Math.min(clamped, maxSafeDepth);

    // Depth amounts are seeded by (pair, level, day) — deliberately NOT by
    // mid. Seeding by mid reshuffled EVERY level amount on each price tick
    // (the "random jumping book" feel). Now amounts sit still all day and
    // only prices slide with the market; the mix rotates once per day.
    // Refills always land near the touch (levelStep 0.12%), never far away.
    const dayNum = Math.floor(now / 86400000);
    const pairSeed = hashStr(pair);

    // [HONESTY CLAMP EDGES]
    // Non-matchable visuals (synthetic ladder, admin walls) must never print
    // INSIDE the pool spread. The engine only fills at pool ask/bid.
    const poolAskEdge = round8(pool.lastMid * (1 + pool.spreadPct / 2));
    const poolBidEdge = round8(pool.lastMid * (1 - pool.spreadPct / 2));

    // [TRADE IMPACT] Asymmetric orderbook — lagging opposite side after user trade.
    const impact = this.lastUserTradeImpact.get(pair);
    const savedMid = this.previousMid.get(pair) ?? mid;
    let askLagMid = mid;
    let bidLagMid = mid;
    if (impact) {
      const elapsed = Date.now() - impact.time;
      const DECAY_MS = 60_000;
      if (elapsed < DECAY_MS) {
        const decay = 1 - elapsed / DECAY_MS; // 1.0 → 0.0
        const intensity = Math.min(1, impact.impact / 0.015);
        const lag = decay * intensity; // how much the opposite side lags (1.0 = full lag)

        if (impact.side === "BUY") {
          // Whale bought → asks swept → bid side uses LAGGING mid
          bidLagMid = mid - (mid - savedMid) * lag;
        } else {
          // Whale sold → bids swept → ask side uses LAGGING mid
          askLagMid = mid + (savedMid - mid) * lag;
        }
      } else {
        this.lastUserTradeImpact.delete(pair);
        this.previousMid.delete(pair);
      }
    }

    // Anchor synthetic ladder starting points to pool edges so each level is guaranteed distinct
    const baseAskPrice = Math.max(poolAskEdge, round8(askLagMid + halfSpreadRaw));
    const baseBidPrice = Math.min(poolBidEdge, round8(bidLagMid - halfSpreadRaw));

    for (let i = 0; i < safeDepth; i++) {
      const rngDepthAsks = mulberry32((pairSeed + dayNum * 1000003 + i * 5123) >>> 0);
      const rngDepthBids = mulberry32((pairSeed + dayNum * 1000033 + i * 7919) >>> 0);

      // Depth: 150K–3.5M with 20% whale-wall spike chance
      const askBase =
        rngDepthAsks() > 0.8
          ? 2_000_000 + rngDepthAsks() * 1_500_000
          : 150_000 + rngDepthAsks() * 600_000;
      const bidBase =
        rngDepthBids() > 0.8
          ? 2_000_000 + rngDepthBids() * 1_500_000
          : 150_000 + rngDepthBids() * 600_000;

      // Ascending asks starting from baseAskPrice, descending bids starting from baseBidPrice
      const askPrice = round8(baseAskPrice + levelStep * i);
      asks.push({ price: askPrice, amount: round2(askBase) });

      const bidPrice = round8(baseBidPrice - levelStep * i);
      if (bidPrice > 0) {
        bids.push({ price: bidPrice, amount: round2(bidBase) });
      }
    }

    // [NEW] Merge active user Limit Orders into the AMM visual depth
    // Tag isMine=true for orders belonging to the current user so the
    // frontend can highlight them (glowing border).
    const openOrders = await this.orderModel
      .find({ pair, status: "OPEN" })
      .limit(200)
      .lean()
      .exec();
    const [baseAsset] = pair.split("/");
    const minOrderLimit = TRADE_LIMITS[baseAsset]?.min ?? 1;
    for (const o of openOrders) {
      if (!isFinite(o.price) || o.price <= 0) continue;
      const remaining = (o.amount || 0) - (o.filledAmount || 0);
      if (remaining < minOrderLimit * 0.9) {
        // Purge dust/micro orders below minimum trade limit from DB & orderbook
        this.orderModel
          .updateOne({ _id: o._id, status: "OPEN" }, { $set: { status: "FILLED" } })
          .exec()
          .catch(() => {});
        continue;
      }

      const isMine = !!telegramId && o.telegramId === telegramId;
      const targetList = o.side === "SELL" ? asks : bids;
      const match = targetList.find((x) => x.price === o.price);
      if (match) {
        match.amount += remaining;
        if (isMine) match.isMine = true;
      } else {
        targetList.push({ price: o.price, amount: remaining, ...(isMine && { isMine: true }) });
      }
    }

    // [ADMIN WALLS] Inject admin-created order book walls into the book.
    // These are synthetic depth levels that appear as real liquidity.
    // Clamped to the pool edges (same honesty rule as the ladder): a wall
    // can never be filled against, so it must never print a cross.
    if (pool.adminSellWalls?.length) {
      for (const w of pool.adminSellWalls) {
        if (!w.price || !w.amount || w.amount <= 0) continue;
        const wp = round8(Math.max(w.price, poolAskEdge));
        const match = asks.find((x) => x.price === wp);
        if (match) {
          match.amount += w.amount;
        } else {
          asks.push({ price: wp, amount: w.amount });
        }
      }
    }
    if (pool.adminBuyWalls?.length) {
      for (const w of pool.adminBuyWalls) {
        if (!w.price || !w.amount || w.amount <= 0) continue;
        const wp = round8(Math.min(w.price, poolBidEdge));
        const match = bids.find((x) => x.price === wp);
        if (match) {
          match.amount += w.amount;
        } else {
          bids.push({ price: wp, amount: w.amount });
        }
      }
    }

    // Sort to keep real order book logic: Asks (Lowest first), Bids (Highest first)
    asks.sort((a, b) => a.price - b.price);
    bids.sort((a, b) => b.price - a.price);

    // [DEDUP & CONSOLIDATE] Consolidate by price so each row is unique.
    // Filter out zero/dust amounts to prevent "0 AMOUNT" rows.
    const consolidate = (levels: { price: number; amount: number; isMine?: boolean }[]) => {
      const map = new Map<number, { price: number; amount: number; isMine?: boolean }>();
      for (const l of levels) {
        if (!isFinite(l.amount) || l.amount <= 0.000001) continue;
        const hit = map.get(l.price);
        if (hit) {
          hit.amount = hit.amount + l.amount;
          if (l.isMine) hit.isMine = true;
        } else {
          map.set(l.price, { price: l.price, amount: l.amount, ...(l.isMine ? { isMine: true } : {}) });
        }
      }
      return [...map.values()]
        .map((x) => ({ ...x, amount: round2(x.amount) }))
        .filter((x) => x.amount > 0.000001);
    };

    // Clamp to requested depth after injected users + admin walls
    const finAsks = consolidate(asks).slice(0, clamped);
    const finBids = consolidate(bids).slice(0, clamped);

    const totalAsk = finAsks.reduce((acc, l) => acc + l.amount, 0);
    const totalBid = finBids.reduce((acc, l) => acc + l.amount, 0);
    const bidShare =
      totalAsk + totalBid > 0 ? (totalBid / (totalAsk + totalBid)) * 100 : 50;

    // Get previous mid for color comparison (green if last trade > previous)
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

  // ── Trade history feed (cached 5s, shared across users) ────────────────
  /**
   * OHLCV candles aggregated from the REAL trade tape (bot + user fills —
   * every print lands here, so the chart can never diverge from the tape).
   * Buckets are UTC-aligned; time is unix seconds (lightweight-charts UTCTimestamp).
   */
  async getCandles(pair = DEFAULT_PAIR, interval = "15m", limit = 120) {
    const INTERVALS: Record<string, { unit: string; binSize: number; seconds: number }> = {
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
      .lean()
      .exec();
    const result = {
      success: true,
      trades: trades.map((t) => ({
        id: String(t._id),
        side: t.side,
  // @ts-ignore - super strict cleanup pending (auto)
        price: t.price,
        amount: t.amount,
        total: t.total,
        fee: t.fee,
        source: t.source,
        time: (t as unknown as { createdAt: Date }).createdAt,
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
      quoteReserve: round2(pool.quoteReserve ?? pool.elixirReserve ?? 0),
      baseReserve: round2(pool.baseReserve ?? pool.elixcoinReserve ?? 0),
      lastMid: round8(pool.lastMid),
      feePct: pool.feePct,
      spreadPct: pool.spreadPct,
    };
  }

  // ── INFO: 24h totals + lifetime + chart data ───────
  async getInfo(pair = DEFAULT_PAIR) {
    const cached = this.infoCache.get(pair);
    if (cached && Date.now() - cached.ts < this.INFO_CACHE_MS) return cached.data;
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
    const hourly: Array<{ hour: number; label: string; volume: number; count: number }> = [];
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
  // @ts-ignore - super strict pending
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
    this.infoCache.set(pair, { data: result as unknown as Record<string, unknown>, ts: Date.now() });
    return result;
  }

  // ── Admin: market-maker bot status + control ───────────────────────────
  async getBotStatus(pair = DEFAULT_PAIR) {
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

  async updateBotConfig(body: {
  // @ts-ignore - super strict cleanup pending (auto)
    pair?: string;
    enabled?: boolean;
    intervalMinutes?: number;
  // @ts-ignore - super strict pending
    tradesPerCycle?: number;
  }) {
    const pair = body.pair || DEFAULT_PAIR;
  // @ts-ignore - super strict pending
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

  // ── User holdings ───────────────────────────────────────────────────────
  async getHoldings(telegramId: string, pair: string = DEFAULT_PAIR) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
  // @ts-ignore - super strict pending
    const [base, quote] = pair.split("/");
    const crypto = user?.cryptoBalances as Record<string, number> | undefined;

    // Route base balance to the correct storage per item type:
    //   - Material tools  → user.materials["Rusty Nail"]
    //   - Buff items      → UserBuffCollection.inventory count
    //   - Crypto tokens   → user.cryptoBalances[BASE]
    let baseBalance = 0;
    if (this.itemTradeService.isItem(base)) {
      baseBalance = await this.itemTradeService.getItemBalance(telegramId, base);
    } else {
      baseBalance = base === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[base] || 0;
    }

    return {
      success: true,
      base,
      quote,
      baseBalance: round4(baseBalance),
      quoteBalance: round4(
        quote === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[quote] || 0,
      ),
      elixcoin: round4(crypto?.["ELIXCOIN"] || 0),
      elixir: round4(user?.elixirBalance || 0),
    };
  }

  // ── Max tradeable amount (raw balance, no slippage cap) ─────────────
  /**
   * Returns the raw balance for BUY and SELL — no trade cap.
   * Fee (1.5%) is deducted from what the user RECEIVES, not what they spend.
   * Slippage applies to the execution price but doesn't cap the trade.
   */
  async getMaxTradeable(
    telegramId: string,
    pair: string = DEFAULT_PAIR,
    side: string = "BUY",
  ) {
    const pool = await this.getPool(pair);
  // @ts-ignore - super strict pending
    const [base, quote] = pair.split("/");
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user)
      return { success: false, error: "Account not found" };

    const crypto = user.cryptoBalances as Record<string, number> | undefined;
    const materials = (user as unknown as { materials?: Record<string, number> })?.materials;
    const quoteBalance =
      quote === "ELIXIR" ? user.elixirBalance || 0 : crypto?.[quote] || 0;

    const mid = pool.lastMid;
    const half = pool.spreadPct / 2;
    const ask = mid * (1 + half);
    const bid = mid * (1 - half);

    if (side.toUpperCase() === "SELL") {
      // Read base balance from the correct storage per item type
      let baseBalance = 0;
      if (isMaterialBase(base)) {
        const displayName = slugToMaterialName(base);
        baseBalance = materials?.[displayName] ?? 0;
      } else if (!COIN_BASES.has(base.toUpperCase())) {
        baseBalance = await this.buffCollectionsService.countBuffInstances(telegramId, base.toLowerCase());
      } else {
        baseBalance = base === "ELIXIR" ? user.elixirBalance || 0 : crypto?.[base] || 0;
      }
      // ELIXCOIN: integer only (prevent floating-point $gte mismatch)
      // Items: integer only. Other coins: raw balance.
      // ELIXCOIN + Minerals: integer only (prevent floating-point $gte mismatch)
      // Items: integer only. Other coins: raw balance.
      const isMineral = ["ELIXCOIN", "COPPER", "IRON", "SILVER", "GOLD"].includes(base);
      const safeMaxBase = (base === "ELIXCOIN" || isMineral || isItemBase(base))
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

    // BUY: max BASE you can buy with your QUOTE balance.
    // Fee is deducted from BASE received, so spend = amount × ask (no fee on spend).
    const maxBase = quoteBalance / ask;
    // [FLOATING POINT FIX] Floor to 4 decimals so round-trip rounding never overshoots.
    // Without floor: round8(raw) → /ask → ×ask → round4 → can round UP past actual balance.
    const maxQuote = Math.floor(quoteBalance * 10000) / 10000;

    return {
      success: true,
      maxBase: isItemBase(base) ? Math.floor(maxBase) : maxBase,
      maxQuote,
      price: round8(ask),
      base,
      quote,
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
      tpPrice?: number;
      slPrice?: number;
      iceberg?: boolean;
      icebergChunkSize?: number;
    },
  ) {
    const rateErr = this.checkRateLimit(
      this.orderTimestamps,
  // @ts-ignore - super strict cleanup pending (auto)
      telegramId,
      ORDER_RATE_LIMIT,
      Date.now(),
  // @ts-ignore - super strict pending
    );
    if (rateErr) return { success: false, error: rateErr };

  // @ts-ignore - super strict pending
    const pair = body.pair || DEFAULT_PAIR;
  // @ts-ignore - super strict pending
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

    // Shared composer: full-user-fill / pool-merged responses carry the
    // taker's fresh balances + every fill (frontend reads message/balances).
    const finishUserFills = async (
      poolTrade?: unknown,
      crossFills?: Array<{ tradeId: string; makerTradeId: string; price: number; qty: number }>,
      crossBase?: number,
    ) => {
      const taker = await this.userModel.findOne({ telegramId }).exec();
      const crypto = taker?.cryptoBalances as Record<string, number> | undefined;
      const allTrades = poolTrade ? [...(crossFills || []), poolTrade] : (crossFills || []);
      const filledBase = poolTrade
        ? round2((crossBase || 0) + ((poolTrade as { amount?: number }).amount || 0))
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
      // MARKET crosses everything: sweep resting user orders first, pool
      // takes the remainder.
      const cross = await this.matchCounterpartyOrders({
        pair, takerId: telegramId, takerSide: side,
        limit: round8(execPrice), amount: round2(amount), market: true,
      });
      if (cross.error) return { success: false, error: cross.error };
      const remaining = round2(round2(amount) - cross.filledBase);
      if (remaining <= 0) return finishUserFills(undefined, cross.fills, cross.filledBase);
      const result = await this.executeFill(
        pair,
        telegramId,
        side,
        round2(remaining),
        round8(execPrice),
        "USER",
      );
      // Create TP/SL pending order if provided
      if (result.success && ((body.tpPrice ?? 0) > 0 || (body.slPrice ?? 0) > 0)) {
        await this.createTpSlOrder(telegramId, pair, side, round2(remaining), body.tpPrice ?? 0, body.slPrice ?? 0);
      }
      if (!(result as { success?: boolean }).success) {
        // Partial user fills stand; surface the pool error with context.
        if (cross.filledBase > 0) {
          return { success: false, error: (result as { error?: string }).error, userFilledBase: cross.filledBase, trades: cross.fills };
        }
        return result;
      }
      if (cross.filledBase > 0) return finishUserFills((result as { trade?: unknown }).trade, cross.fills, cross.filledBase);
      return result;
    }

    const limit = Number(body.price);
    if (!isFinite(limit) || limit <= 0)
      return { success: false, error: "Invalid limit price" };

    // [ICEBERG] flag resolved up-front (iceberg takers skip user-matching —
    // their hidden size reveals over time via the pool cycle instead).
    const useIceberg = body.iceberg === true && body.icebergChunkSize! > 0;

    // [USER-USER CROSS] Match resting counterparty OPEN orders first
    // (price-time priority). Displayed liquidity actually fills — the pool
    // below is only the backstop. Taker = this order (fee on taker).
    let crossFilled = 0;
    let crossTrades: Array<{ tradeId: string; makerTradeId: string; price: number; qty: number }> = [];
    if (!useIceberg) {
      const cross = await this.matchCounterpartyOrders({
        pair, takerId: telegramId, takerSide: side,
        limit: round8(limit), amount: round2(amount),
      });
      if (cross.error) return { success: false, error: cross.error };
      crossFilled = cross.filledBase;
      crossTrades = cross.fills;
    }
    const remaining = round2(round2(amount) - crossFilled);

    if (remaining <= 0) return finishUserFills(undefined, crossTrades, crossFilled);

    if (side === "BUY" && limit >= ask) {
      const poolRes = await this.executeFill(pair, telegramId, "BUY", round2(remaining), round8(ask), "USER");
      if (!(poolRes as { success?: boolean }).success) return poolRes;
      return finishUserFills((poolRes as { trade?: unknown }).trade, crossTrades, crossFilled);
    }
    if (side === "SELL" && limit <= bid) {
      const poolRes = await this.executeFill(pair, telegramId, "SELL", round2(remaining), round8(bid), "USER");
      if (!(poolRes as { success?: boolean }).success) return poolRes;
      return finishUserFills((poolRes as { trade?: unknown }).trade, crossTrades, crossFilled);
    }

    // [ICEBERG] Split large order into visible chunks
    const chunkSize = useIceberg ? Math.min(round2(body.icebergChunkSize!), round2(remaining)) : round2(remaining);
    const totalChunks = useIceberg ? Math.ceil(remaining / chunkSize) : 1;

    const order = await this.orderModel.create({
      pair,
      telegramId,
      side,
      price: round8(limit),
      amount: round2(chunkSize), // visible chunk only
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

  // ── TP/SL: Create pending take-profit / stop-loss order ──────────────
  private async createTpSlOrder(
    telegramId: string,
    pair: string,
    originalSide: string,
    amount: number,
    tpPrice?: number,
    slPrice?: number,
  ) {
    if (!tpPrice && !slPrice) return;
    try {
      const PendingTpSl = this.pendingTpSlModel;
      if (!PendingTpSl) return; // model not registered yet
      await PendingTpSl.create({
        telegramId,
        pair,
        originalSide,
        amount,
        tpPrice: tpPrice || 0,
        slPrice: slPrice || 0,
      });
    } catch {
      // Non-critical — log only
    }
  }

  /** Check pending TP/SL orders after each trade. Triggers auto-sell. */
  private async checkTpSlOrders(pair: string, currentPrice: number) {
    try {
      const PendingTpSl = this.pendingTpSlModel;
      if (!PendingTpSl) return;

      const pending = await PendingTpSl.find({
        pair,
        triggered: false,
        cancelled: false,
      })
        .limit(100)
        .exec();

      for (const order of pending) {
        const shouldTrigger =
          (order.tpPrice > 0 && currentPrice >= order.tpPrice) ||
          (order.slPrice > 0 && currentPrice <= order.slPrice);

        if (!shouldTrigger) continue;

        // Trigger: auto-sell the opposite side
        const sellSide = order.originalSide === "BUY" ? "SELL" : "BUY";
        const result = await this.executeFill(
          pair,
          order.telegramId,
          sellSide as "BUY" | "SELL",
          order.amount,
          round8(currentPrice),
          "USER",
        );

        // Mark as triggered
        await PendingTpSl.updateOne(
          { _id: order._id },
          { $set: { triggered: true, triggeredAt: new Date() } },
        ).exec();

        if (result.success) {
          this.logger.log(`[TP/SL] Triggered ${order.tpPrice ? 'TP' : 'SL'} for ${order.telegramId} on ${pair} @ ${currentPrice}`);
        }
      }
    } catch {
      // Non-critical
    }
  }

  /**
   * Shared min/max gate (same messages everywhere). BUY is evaluated on
   * intended spend (amount × price), SELL on base qty. Dust tolerance on
   * MIN only — see executeFill comment.
   */
  private checkMinMax(
    pair: string,
    side: "BUY" | "SELL",
    amount: number,
    price: number,
  ): string | null {
    const [baseAsset] = pair.split("/");
    const limitsKey = side === "BUY" ? pair.split("/")[1] : baseAsset;
    const limits = TRADE_LIMITS[limitsKey];
    if (!limits) return null;
    if (side === "BUY") {
      const spendQuote = round4(amount * price);
      if (spendQuote < limits.min * MIN_TOLERANCE)
        return `Minimum trade is ${limits.min} ${limitsKey}`;
      if (spendQuote > limits.max)
        return `Maximum trade is ${limits.max} ${limitsKey}`;
    } else {
      if (amount < limits.min * MIN_TOLERANCE)
        return `Minimum trade is ${limits.min} ${limitsKey}`;
      if (amount > limits.max)
        return `Maximum trade is ${limits.max} ${limitsKey}`;
    }
    return null;
  }

  /**
   * USER-VS-USER fill (real CLOB matching). Money rules mirror executeFill
   * exactly (fee in received currency, whole-unit flooring, item inventory
   * via ItemTradeService) with two deliberate differences:
   *   1. The MAKER pays no fee (maker-taker incentive for depth).
   *   2. Pool reserves and pool mid are untouched — a P2P trade doesn't
   *      move house inventory (but it IS recorded: volume, high/low,
   *      trade history, SSE, TP/SL checks — so the displayed market
   *      follows real prints).
   * Guarded debits on both sides; maker failure → skip that maker
   * (stale) with taker refunded; taker failure → abort, partials kept.
   */
  private async fillUserVsUser(opts: {
    pair: string;
    buyerId: string;
    sellerId: string;
    baseQty: number;
    price: number;
    takerId: string;
    takerSide: "BUY" | "SELL";
  }): Promise<{
    success: boolean;
    filledBase?: number;
    grossQuote?: number;
    takerFee?: number;
    takerTradeId?: string;
    makerTradeId?: string;
    takerShort?: boolean;
    error?: string;
  }> {
    const { pair, buyerId, sellerId, takerId, takerSide } = opts;
    const [base, quote] = pair.split("/");
    const baseKey = base === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${base}`;
    const quoteKey = quote === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${quote}`;
    const itemBase = isItemBase(base);
    const intBase = INT_BASES.includes(base) || itemBase;

    const qty = intBase ? Math.floor(opts.baseQty) : round8(opts.baseQty);
    if (!(qty > 0)) return { success: false, error: "dust" };
    const price = round8(opts.price);
    const grossQuote = round4(qty * price);
    if (!(grossQuote > 0)) return { success: false, error: "dust" };

    // Taker fee (maker free) — same received-currency rule as pool fills.
    let takerFee = 0;
    let takerFeeCurrency = quote;
    if (takerSide === "BUY") {
      if (itemBase) { takerFee = round4(grossQuote * FEE_PCT); takerFeeCurrency = quote; }
      else { takerFee = round4(qty * FEE_PCT); takerFeeCurrency = base; }
    } else {
      takerFee = round4(grossQuote * FEE_PCT); takerFeeCurrency = quote;
    }

    // What each side moves (mirrors executeFill branches):
    const buyerPaysQuote =
      itemBase && takerSide === "BUY" ? round4(grossQuote + takerFee) : grossQuote;
    let buyerGetsBase = qty;
    if (takerSide === "BUY" && !itemBase) {
      buyerGetsBase = round4(qty - takerFee);
      if (["COPPER", "IRON", "SILVER", "GOLD"].includes(base))
        buyerGetsBase = Math.floor(buyerGetsBase);
    }
    if (itemBase) buyerGetsBase = Math.floor(qty);
    const sellerProceeds = takerSide === "SELL" ? round4(grossQuote - takerFee) : grossQuote;

    // ── 1. Taker debit (guarded) ──────────────────────────────────────
    if (takerSide === "BUY") {
      const ok = await this.userModel
        .findOneAndUpdate(
          { telegramId: takerId, [quoteKey]: { $gte: Math.max(0, buyerPaysQuote - 0.0001) } },
          { $inc: { [quoteKey]: -buyerPaysQuote } },
          { returnDocument: "after" },
        )
        .exec();
      if (!ok) return { success: false, takerShort: true, error: `Insufficient ${quote} balance` };
    } else if (itemBase) {
      const have = await this.itemTradeService.getItemBalance(takerId, base);
      if (have < Math.floor(qty)) return { success: false, takerShort: true, error: `Insufficient ${base} balance` };
      const taken = await this.itemTradeService.deductItem(takerId, base, Math.floor(qty));
      if (!taken) return { success: false, takerShort: true, error: `Insufficient ${base} balance` };
    } else {
      const ok = await this.userModel
        .findOneAndUpdate(
          { telegramId: takerId, [baseKey]: { $gte: Math.max(0, qty - 0.0001) } },
          { $inc: { [baseKey]: -qty } },
          { returnDocument: "after" },
        )
        .exec();
      if (!ok) return { success: false, takerShort: true, error: `Insufficient ${base} balance` };
    }

    // Refund closure for the taker leg if the maker leg fails below.
    const refundTaker = async () => {
      try {
        if (takerSide === "BUY") {
          await this.userModel.updateOne({ telegramId: takerId }, { $inc: { [quoteKey]: buyerPaysQuote } }).exec();
        } else if (itemBase) {
          await this.itemTradeService.grantItem(takerId, base, Math.floor(qty));
        } else {
          await this.userModel.updateOne({ telegramId: takerId }, { $inc: { [baseKey]: qty } }).exec();
        }
      } catch (e) {
        this.logger.error(`[UserMatch] taker refund failed ${takerId} ${pair}: ${(e as Error)?.message}`);
      }
    };

    // ── 2. Maker debit (guarded) ──────────────────────────────────────
    const makerId = takerSide === "BUY" ? sellerId : buyerId;
    if (takerSide === "BUY") {
      // Maker delivers base.
      if (itemBase) {
        const have = await this.itemTradeService.getItemBalance(makerId, base);
        if (have < Math.floor(qty)) { await refundTaker(); return { success: false, error: "maker-stale" }; }
        const taken = await this.itemTradeService.deductItem(makerId, base, Math.floor(qty));
        if (!taken) { await refundTaker(); return { success: false, error: "maker-stale" }; }
      } else {
        const ok = await this.userModel
          .findOneAndUpdate(
            { telegramId: makerId, [baseKey]: { $gte: Math.max(0, qty - 0.0001) } },
            { $inc: { [baseKey]: -qty } },
            { returnDocument: "after" },
          )
          .exec();
        if (!ok) { await refundTaker(); return { success: false, error: "maker-stale" }; }
      }
    } else {
      // Maker pays quote.
      const ok = await this.userModel
        .findOneAndUpdate(
          { telegramId: makerId, [quoteKey]: { $gte: Math.max(0, grossQuote - 0.0001) } },
          { $inc: { [quoteKey]: -grossQuote } },
          { returnDocument: "after" },
        )
        .exec();
      if (!ok) { await refundTaker(); return { success: false, error: "maker-stale" }; }
    }

    // ── 3. Credit legs (unguarded — both sides already debited) ───────
    if (takerSide === "BUY") {
      if (itemBase) {
        if (buyerGetsBase > 0) await this.itemTradeService.grantItem(buyerId, base, Math.floor(buyerGetsBase));
        await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: grossQuote } }).exec();
      } else {
        await this.userModel.updateOne({ telegramId: buyerId }, { $inc: { [baseKey]: buyerGetsBase } }).exec();
        await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: grossQuote } }).exec();
      }
    } else {
      if (itemBase) {
        if (Math.floor(qty) > 0) await this.itemTradeService.grantItem(buyerId, base, Math.floor(qty));
        await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: sellerProceeds } }).exec();
      } else {
        await this.userModel.updateOne({ telegramId: buyerId }, { $inc: { [baseKey]: qty } }).exec();
        await this.userModel.updateOne({ telegramId: sellerId }, { $inc: { [quoteKey]: sellerProceeds } }).exec();
      }
    }

    // ── 4. Books: fee to platform, volume, history, caches, SSE, TP/SL ─
    // No pool reserve / mid changes — P2P doesn't move house inventory.
    await this.poolModel
      .updateOne(
        { pair },
        {
          $inc: { platformFeesAccumulated: takerFee, lifetimeVolume: qty, volume24h: qty, quoteVolume24h: grossQuote },
          $max: { high24h: price },
          $min: { low24h: price },
        },
      )
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
    this.checkTpSlOrders(pair, price).catch(() => {});

    return {
      success: true, filledBase: qty, grossQuote, takerFee,
      takerTradeId: String(takerTrade._id), makerTradeId: String(makerTrade._id),
    };
  }

  /**
   * Match an incoming taker against resting opposite OPEN orders
   * (price-time priority, no self-match, iceberg makers excluded — their
   * hidden size reveals over time via the pool cycle instead).
   * Returns what got filled; the caller pools-or-rests the remainder.
   */
  private async matchCounterpartyOrders(opts: {
    pair: string;
    takerId: string;
    takerSide: "BUY" | "SELL";
    limit: number;
    amount: number;
    /** Market orders cross everything — no price filter. */
    market?: boolean;
  }): Promise<{ filledBase: number; fills: Array<{ tradeId: string; makerTradeId: string; price: number; qty: number }>; error?: string }> {
    const { pair, takerId, takerSide, limit, market } = opts;
    const oppSide = takerSide === "BUY" ? "SELL" : "BUY";

    // Full-size gate first (same rule as pool fills).
    const gateError = this.checkMinMax(pair, takerSide, round2(opts.amount), round8(limit));
    if (gateError) return { filledBase: 0, fills: [], error: gateError };

    const priceCond = market
      ? {}
      : takerSide === "BUY" ? { price: { $lte: round8(limit) } } : { price: { $gte: round8(limit) } };
    const sortSpec: { [key: string]: 1 | -1 } = takerSide === "BUY" ? { price: 1, createdAt: 1 } : { price: -1, createdAt: 1 };
    const makers = await this.orderModel
      .find({ pair, status: "OPEN", side: oppSide, iceberg: { $ne: true }, telegramId: { $ne: takerId }, ...priceCond })
      .sort(sortSpec)
      .limit(50)
      .lean()
      .exec();

    let remaining = round2(opts.amount);
    const fills: Array<{ tradeId: string; makerTradeId: string; price: number; qty: number }> = [];
    // [SWEEP CAP] A single taker eats at most 3 distinct price levels, then
    // stops — the remainder rests as a placed order (or pool-fills via the
    // caller). Whales chew slowly from the bottom instead of sweeping the
    // whole side in one submit. Successful fills only consume budget.
    const levelsUsed = new Set<number>();
    for (const m of makers) {
      if (!(remaining > 0)) break;
      const makerRemaining = round2((m.amount || 0) - (m.filledAmount || 0));
      if (!(makerRemaining > 0)) continue;
      if (!levelsUsed.has(m.price) && levelsUsed.size >= 3) break; // cap: 3 rows max
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
        if (res.takerShort) break; // taker can't pay → stop, keep partials
        continue; // stale maker → skip to next
      }
      const newFilled = round2((m.filledAmount || 0) + (res.filledBase || 0));
      const [baseAsset] = pair.split("/");
      const minOrderLimit = TRADE_LIMITS[baseAsset]?.min ?? 1;
      const done = (m.amount || 0) - newFilled < minOrderLimit * 0.9;
      await this.orderModel
        .updateOne({ _id: m._id, status: "OPEN" }, { $set: { filledAmount: newFilled, status: done ? "FILLED" : "OPEN" } })
        .exec();
      remaining = round2(remaining - (res.filledBase || 0));
      if ((res.filledBase || 0) > 0) levelsUsed.add(m.price);
      fills.push({ tradeId: res.takerTradeId as string, makerTradeId: res.makerTradeId as string, price: m.price, qty: res.filledBase as number });
      if (!(remaining > 0)) break;
    }
    return { filledBase: round2(opts.amount - remaining), fills };
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
    basePrice: number,
    source: "BOT" | "USER",
  ) {
    if (source === "USER" && !telegramId)
      return { success: false, error: "Missing account" };

    // [TRADE LIMITS] Validate min/max per asset (backend safety net)
    // Dust tolerance on the MINIMUM only: legitimate orders sized exactly
    // at the minimum (50.00) can evaluate to 49.2x after fee deduction,
    // limit-padding, Math.floor or round4 float dust — rejecting those
    // contradicts the advertised minimum. True dust (< 98% of min) still
    // fails. MAX stays strict (haircuts only ever shrink values).
    if (source === "USER") {
      const limitError = this.checkMinMax(pair, side, amount, basePrice);
      if (limitError) return { success: false, error: limitError };
    }

    const pool = await this.getPool(pair);

    // ── Anti-whale slippage penalty (synchronous bonding-curve impact) ─────
    // BUY taker pays MORE (higher effective ask); SELL taker receives LESS
    // (lower effective bid). This converts large-volume round-trips into net losses.
    let price = basePrice;
    let shiftPct = 0;
    if (source === "USER") {
      const impactRatio = amount / Math.max(1, pool.baseReserve ?? 10_000_000);
      shiftPct = Math.min(0.015, impactRatio * 0.5); // cap at 1.5% per fill (was 5%)
      price = side === "BUY"
        ? round8(basePrice * (1 + shiftPct))   // buyer pays more
        : round8(basePrice * (1 - shiftPct));  // seller receives less
    }

  // @ts-ignore - super strict pending
    const [base, quote] = pair.split("/");
    const baseKey = base === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${base}`;
    const quoteKey = quote === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${quote}`;

    let updated: import("../users/schemas/user.schema").User | null = null;
    let fee = 0;
    let feeCurrency = base;
    let receivedBase = 0; // defined at outer scope for auto-grant + message

    if (side === "BUY") {
      // ── BUY accounting ────────────────────────────────────────────────
      // Coins: fee charged in BASE (the currency they receive)
      // Items: fee charged in QUOTE (ELIXCOIN) — items must stay whole numbers
      const spendQuote = round4(amount * price);   // quote leaving user
      const itemBase = isItemBase(base);
      let actualSpend = 0;
      if (itemBase) {
        // ── Item BUY ───────────────────────────────────────────
        // Debit ELIXCOIN (quote) only. Item is credited to its own storage,
        // NOT to cryptoBalances — that field is for crypto tokens only.
        fee = round4(spendQuote * FEE_PCT);
        actualSpend = round4(spendQuote + fee);  // ELIXCOIN total including fee
        receivedBase = amount;                    // full item qty — no splitting
        feeCurrency = quote;

        // Atomic debit of ELIXCOIN — guard against insufficient balance
        updated = await this.userModel
          .findOneAndUpdate(
            { telegramId, [quoteKey]: { $gte: actualSpend } },
            { $inc: { [quoteKey]: -actualSpend } },   // ← only debit quote, NO baseKey credit
            { returnDocument: "after" },
          )
          .exec();
        if (!updated)
          return { success: false, error: `Insufficient ${quote} balance` };

        // Grant item to its PROPER storage (via ItemTradeService)
        const qty = Math.floor(receivedBase);
        if (source === "USER" && qty > 0) {
          await this.itemTradeService.grantItem(telegramId, base, qty);
        }
      } else {
        // Coin fee in BASE (deducted from received amount)
        fee = round4(amount * FEE_PCT);
        receivedBase = round4(amount - fee);
        // Minerals: floor to integer to prevent fractional amounts
        if (["COPPER", "IRON", "SILVER", "GOLD"].includes(base)) {
          receivedBase = Math.floor(receivedBase);
        }
        actualSpend = spendQuote;
        feeCurrency = base;        // [FLOATING POINT TOLERANCE] Allow 0.0001 slack for rounding overshoot.
        // Without this, round8→/ask→×ask→round4 can overshoot by ~0.00002.
        const gteCheck = Math.max(0, spendQuote - 0.0001);
        updated = await this.userModel
          .findOneAndUpdate(
            { telegramId, [quoteKey]: { $gte: gteCheck } },
            { $inc: { [quoteKey]: -spendQuote, [baseKey]: receivedBase } },
            { returnDocument: "after" },
          )
          .exec();
        if (!updated)
          return { success: false, error: `Insufficient ${quote} balance` };
      }




      // [TRADE IMPACT] Save previous mid before changing it.
      if (source === "USER") {
        this.previousMid.set(pair, pool.lastMid);
      }
      // [WHALE GUARD] Taker size > 3% of the pool side reserve → fill in
      // full INSTANTLY but WITHOUT persistent mid impact or lag trigger.
      // No matter how much money the whale has, the displayed price barely
      // moves (execution shift penalty still applies — size still pays).
      // Alarm below is the audit trail (Railway logs → admin alerts).
      const whaleThreshold = side === "BUY" ? (pool.quoteReserve || 0) * 0.03 : (pool.baseReserve || 0) * 0.03;
      const whaleSize = side === "BUY" ? round4(amount * basePrice) : amount;
      const isWhale = source === "USER" && whaleThreshold > 0 && whaleSize > whaleThreshold;
      if (isWhale) {
        this.logger.warn(
          `[WHALE-GUARD] ${side} ${amount} ${pair.split("/")[0]} by ${telegramId} ` +
          `(size ${whaleSize} > 3% reserve ${round4(whaleThreshold)}) — instant fill, impact suppressed.`,
        );
      }
      const midNudge = source === "USER" && !isWhale ? shiftPct * 0.5 : 0;
      const newMid = round8(pool.lastMid * (1 + midNudge));      // [TRADE IMPACT] Track user trade for asymmetric orderbook.
      // BUY sweeps asks → bid-side lags behind (prevent instant buyback).
      if (source === "USER" && !isWhale) {
        this.lastUserTradeImpact.set(pair, {
          side: "BUY",
          time: Date.now(),
          impact: shiftPct,
        });
      }


      // For pool accounting: use actualSpend (total ELIXCOIN taken from user)
      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: -amount,
              quoteReserve: actualSpend,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: round4(Math.abs(price - pool.lastMid) * amount),
            },
            $set: { lastMid: newMid },
          },
        )
        .exec();

      // [CROSS-PAIR SYNC]
      // CRITICAL: Use receivedBase (not full amount) for the base reserve delta.
      // The fee portion of the base stays with the platform (platformFeesAccumulated)
      // and must NOT be subtracted from the virtual reserve — otherwise the asset's
      // price drifts upward on every buy, causing ELIXCOIN pairs to show wrong prices.
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
        .updateOne(
          { pair },
          {
            $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: actualSpend },
            $max: { high24h: price },
            $min: { low24h: price },
          },
        )
        .exec();

      this.tickerCache.delete(pair);
      this.bookCache.delete(pair);
      this.tradesCache.delete(pair);

      // [SSE] Push real-time trade event to subscribers
      this.sseService.broadcast(pair, "trade", {
        side, price, amount, total, fee, feeCurrency, source, pair,
        time: Date.now(),
      });
      this.sseService.broadcast(pair, "ticker", await this.getTicker(pair));

      // [TP/SL] Check pending orders after this trade
      this.checkTpSlOrders(pair, price).catch(() => {});

      const crypto = updated?.cryptoBalances as Record<string, number> | undefined;

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

    } else {
      // ── SELL accounting ───────────────────────────────────
      // User spends `amount` (base) → receives `proceeds` (quote net of fee).
      // Fee is charged in QUOTE (the currency they receive).
      const grossQuote = round4(amount * price);
      fee = round4(grossQuote * FEE_PCT);
      let proceeds = round4(grossQuote - fee);
      feeCurrency = quote;

      if (this.itemTradeService.isItem(base) && source === "USER") {
        // ── Item SELL (via ItemTradeService) ──────────────
        const qty = Math.floor(amount);
        const actualBalance = await this.itemTradeService.getItemBalance(telegramId, base);

        if (actualBalance < qty)
          return { success: false, error: `Insufficient ${base} balance` };

        // Credit ELIXCOIN proceeds to user
        updated = await this.userModel
          .findOneAndUpdate(
            { telegramId },
            { $inc: { [quoteKey]: proceeds } },
            { returnDocument: "after" },
          )
          .exec();
        if (!updated)
          return { success: false, error: "Account not found" };

        // Debit item from its proper storage (via ItemTradeService)
        await this.itemTradeService.deductItem(telegramId, base, qty);

      } else {
        // ── Coin / crypto SELL (or BOT) ─────────────────
        // ELIXCOIN + Minerals: round to integer to prevent floating-point $gte mismatch
        if (["ELIXCOIN", "COPPER", "IRON", "SILVER", "GOLD"].includes(base)) {
          amount = Math.floor(amount);
          const grossQuoteInt = round4(amount * price);
          fee = round4(grossQuoteInt * FEE_PCT);
          proceeds = round4(grossQuoteInt - fee);
        }
        // cryptoBalances is correct for crypto tokens.
        // [FLOATING POINT TOLERANCE] Allow 0.0001 slack.
        const gteCheckSell = Math.max(0, amount - 0.0001);
        updated = await this.userModel
          .findOneAndUpdate(
            { telegramId, [baseKey]: { $gte: gteCheckSell } },
            { $inc: { [baseKey]: -amount, [quoteKey]: proceeds } },
            { returnDocument: "after" },
          )
          .exec();
        if (!updated)
          return { success: false, error: `Insufficient ${base} balance` };
      }

      // [TRADE IMPACT] Save previous mid before changing it.
      if (source === "USER") {
        this.previousMid.set(pair, pool.lastMid);
      }
      // Mid nudges DOWN by HALF the slippage only (skipped for whales —
      // see WHALE GUARD in the BUY branch above).
      const sellWhaleThreshold = (pool.baseReserve || 0) * 0.03;
      const isSellWhale = source === "USER" && sellWhaleThreshold > 0 && amount > sellWhaleThreshold;
      if (isSellWhale) {
        this.logger.warn(
          `[WHALE-GUARD] SELL ${amount} ${pair.split("/")[0]} by ${telegramId} ` +
          `(> 3% reserve ${round4(sellWhaleThreshold)}) — instant fill, impact suppressed.`,
        );
      }
      const midNudge = source === "USER" && !isSellWhale ? shiftPct * 0.5 : 0;
      const newMid = round8(pool.lastMid * (1 - midNudge));

      // [TRADE IMPACT] Track user trade for asymmetric orderbook.
      // SELL sweeps bids → ask-side lags behind (prevent instant sellback).
      if (source === "USER" && !isSellWhale) {
        this.lastUserTradeImpact.set(pair, {
          side: "SELL",
          time: Date.now(),
          impact: shiftPct,
        });
      }

      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: amount,
              quoteReserve: -proceeds,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: round4(Math.abs(pool.lastMid - price) * amount),
            },
            $set: { lastMid: newMid },
          },
        )
        .exec();

      // [CROSS-PAIR SYNC]
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
        .updateOne(
          { pair },
          {
            $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: grossQuote },
            $max: { high24h: price },
            $min: { low24h: price },
          },
        )
        .exec();

      this.tickerCache.delete(pair);
      this.bookCache.delete(pair);
      this.tradesCache.delete(pair);

      // [SSE] Push real-time trade event to subscribers
      this.sseService.broadcast(pair, "trade", {
        side, price, amount, total, fee, feeCurrency, source, pair,
        time: Date.now(),
      });
      this.sseService.broadcast(pair, "ticker", await this.getTicker(pair));

      // [TP/SL] Check pending orders after this trade
      this.checkTpSlOrders(pair, price).catch(() => {});

      const crypto2 = updated?.cryptoBalances as Record<string, number> | undefined;

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



  // ── Resting limit orders ────────────────────────────────────────────────
  async getOpenOrders(telegramId: string, pair: string = DEFAULT_PAIR) {
    const orders = await this.orderModel
      .find({ telegramId, status: "OPEN", pair })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  // @ts-ignore - super strict cleanup pending (auto)
    return {
      success: true,
      orders: orders.map((o) => ({
        id: String(o._id),
        side: o.side,
        price: o.price,
        amount: o.amount,
        status: o.status,
        createdAt: (o as unknown as { createdAt: Date }).createdAt,
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

    const query: Record<string, unknown> = { telegramId, source: "USER" };
    if (pair) query.pair = pair;

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
  // @ts-ignore - super strict cleanup pending (auto)
      trades: trades.map((t) => ({
        id: String(t._id),
        side: t.side,
        price: t.price,
        amount: t.amount,
        total: t.total,
        fee: t.fee,
        feeCurrency: t.feeCurrency,
        source: t.source,
        time: (t as unknown as { createdAt: Date }).createdAt,
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
    const fills: Array<{ orderId: string; trade: unknown }> = [];

    for (const o of open) {
      let fillPrice = 0;
      if (o.side === "BUY" && o.price >= ask) fillPrice = ask;
      if (o.side === "SELL" && o.price <= bid) fillPrice = bid;
      if (!fillPrice) continue;

      const res = await this.executeFill(
        pair,
  // @ts-ignore - super strict cleanup pending (auto)
        o.telegramId,
        o.side,
        o.amount,
        round8(fillPrice),
        "USER",
  // @ts-ignore - super strict pending
      );
      if (res.success) {
        // [ICEBERG] Progress chunk — if more chunks remain, create next one
        if (o.iceberg && o.icebergChunkSize > 0) {
          const chunksFilled = (o.icebergChunksFilled || 0) + 1;
  // @ts-ignore - super strict pending
          const totalChunks = Math.ceil((o.icebergTotal || o.amount) / o.icebergChunkSize);
          const remainingTotal = (o.icebergTotal || o.amount) - chunksFilled * o.icebergChunkSize;

          if (remainingTotal > o.icebergChunkSize) {
            // More chunks — mark current filled, create next visible chunk
            await this.orderModel
              .updateOne(
                { _id: o._id },
                { $set: { status: "FILLED", filledAmount: o.amount } },
              )
              .exec();
            // Create next chunk order
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
          } else if (remainingTotal > 0 && remainingTotal <= o.icebergChunkSize) {
            // Last partial chunk
            await this.orderModel
              .updateOne(
                { _id: o._id },
                { $set: { status: "FILLED", filledAmount: o.amount } },
              )
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
          } else {
            // All chunks done
            await this.orderModel
              .updateOne(
                { _id: o._id },
                { $set: { status: "FILLED", filledAmount: o.amount } },
              )
              .exec();
          }
        } else {
          // Normal order — mark filled
          await this.orderModel
            .updateOne(
              { _id: o._id },
              { $set: { status: "FILLED", filledAmount: o.amount } },
            )
            .exec();
        }
        fills.push({ orderId: String(o._id), trade: (res as { trade: unknown }).trade });
      }
    }
    return fills;
  }

  // ── Market-maker internals (driven by MarketMakerService) ───────────────

  /** Tracks which assets have already been drifted this tick cycle to
   *  prevent double-drift when multiple pairs share the same asset. */
  private driftedThisCycle = new Set<string>();

  async driftMid(pair = DEFAULT_PAIR) {
    const pool = await this.getPool(pair);
  // @ts-ignore - super strict pending
    const [base, quote] = pair.split("/");

    // [STABLE SKIP] Don't drift stable assets themselves (USDC, ELIXIR, ELIXCOIN).
    // They are anchors and their USD price never changes.
    if (STABLE_ASSETS.has(base)) {
      return; // Stable asset as base — skip drift (drift happens via mineral base)
    }

    // [ADMIN PRICE CONTROL] If admin has set a range, drift the mid
    // within [bidFloor, askCeiling] only. Never touch global reserves.
    if (pool.adminBidFloor > 0 && pool.adminAskCeiling > 0) {
      const floor = pool.adminBidFloor;
      const ceiling = pool.adminAskCeiling;
      const adminMid = (floor + ceiling) / 2;
      // Small random walk within the admin range
      const volatility = (Math.random() - 0.5) * 0.002; // ±0.1%
      let next = adminMid * (1 + volatility);
      // Clamp hard to admin range
      next = Math.max(floor, Math.min(ceiling, next));
      const newMid = round8(next);
      pool.lastMid = newMid;
      await this.poolModel
        .updateOne({ pair }, { $set: { lastMid: newMid } })
        .exec();
      return; // Skip global asset drift — admin controls this pair
    }

    // [CROSS-PAIR SYNC] Only drift the BASE asset. The QUOTE (usually
    // USDC or ELIXIR) is a stablecoin anchor and must NEVER drift.
    // This prevents wild price swings caused by drifting the denominator.
    const baseAsset = await this.assetRegistry.getAsset(base);

    // Skip if this asset was already drifted this cycle
    if (!this.driftedThisCycle.has(base)) {
      // Slow professional drift: ±0.1% per cycle + gravity. Drastic moves
      // take many cycles (trend, not teleport) — the 10s cadence is kept
      // because resting user orders rely on cycle fills.
      const baseVolatility = (Math.random() - 0.5) * 0.002;
      let baseGravity = 0;
      if (baseAsset.anchorUsdPrice > 0) {
        const baseDiffPct = (baseAsset.usdPrice - baseAsset.anchorUsdPrice) / baseAsset.anchorUsdPrice;
        baseGravity = -baseDiffPct * 0.05;
      }
      const baseDrift = baseVolatility + baseGravity;
      const newBasePrice = Math.max(
        baseAsset.priceMin,
        Math.min(baseAsset.priceMax, baseAsset.usdPrice * (1 + baseDrift)),
      );

      await this.assetRegistry.setUsdPrice(base, newBasePrice);
      this.driftedThisCycle.add(base);
    }

    // Propagate new mid to ALL affected pairs
    await this.assetRegistry.propagateToAffectedPools(base, quote);
  }

  /** Clear the drift dedup set — called once per full bot tick cycle. */
  clearDriftCycle(): void {
    this.driftedThisCycle.clear();
  }

  async botCycle(pair = DEFAULT_PAIR) {
    const pool = await this.getPool(pair);
    void pool;
    const mid = pool.lastMid;
  // @ts-ignore - super strict pending
    const [base, quote] = pair.split("/");

    // Each cycle = 1 trade, randomly BUY or SELL
    // botTradesPerCycle controls how many times per hour this runs
    const sides: ("BUY" | "SELL")[] = [Math.random() < 0.5 ? "BUY" : "SELL"];

    const trades: Trade[] = [];

    // [ADMIN PRICE CONTROL] Determine the trading range for this cycle
    const hasAdminRange = pool.adminBidFloor > 0 && pool.adminAskCeiling > 0;
    const adminFloor = pool.adminBidFloor;
    const adminCeiling = pool.adminAskCeiling;

    for (const side of sides) {
      // Add random organic human-like delay (2 to 8 seconds) between trades
      // so they don't print as a single robotic block.
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 6000) + 2000));

      // [ITEM vs COIN] Determine if this pair trades items (integer units)
      // or coins/minerals (fractional amounts). Use COIN_BASES not mid.
      const isItem = isItemBase(base);

      let amount: number;
      if (isItem) {
        // Items: trade in whole units only (1-10 items per trade)
        // A buyer never purchases 0.5 of a Roman Coin!
        amount = Math.floor(Math.random() * 10) + 1; // 1 to 10 items
      } else {
        // Coins/minerals: 100-7000 per trade (realistic market activity)
        amount = Math.floor(Math.random() * 6900) + 100; // 100 to 7000
      }

      // [ADMIN PRICE CONTROL] Bot trades within admin range only.
      // TAKER semantics (like a real aggressive bot): BUY lifts the
      // upper side (pays up toward the ceiling), SELL hits the lower
      // side (down toward the floor). Items use 2 decimals
      // (ELIXCOIN units), coins use 8 decimals.
      const priceRound = isItem ? round2 : round8;
      let price: number;
      if (hasAdminRange) {
        if (side === "BUY") {
          price = priceRound(mid + Math.random() * (adminCeiling - mid));
        } else {
          price = priceRound(adminFloor + Math.random() * (mid - adminFloor));
        }
      } else {
        // Natural market: print AT the touch — BUY takes the best ask
        // (red bottom row), SELL takes the best bid (green top row).
        // Never inside the spread: mid prints look robotic and teach
        // users the wrong executable prices.
        const half = (pool.spreadPct || 0.004) / 2;
        if (side === "BUY") {
          price = priceRound(mid * (1 + half));
        } else {
          price = priceRound(mid * (1 - half));
        }
      }

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

    const updateOps: { $inc: Record<string, unknown>; $set?: Record<string, unknown>; $max?: Record<string, unknown>; $min?: Record<string, unknown> } = {
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

    await this.poolModel.updateOne({ pair }, updateOps as unknown as Record<string, unknown>).exec();

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

    // [SSE] Broadcast after bot cycle — push ticker to subscribers
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
}
