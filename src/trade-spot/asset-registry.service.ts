import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AssetRegistry } from "./schemas/asset-registry.schema";
import { LiquidityPool } from "./schemas/pool.schema";

const round8 = (n: number) => Math.round(n * 1e8) / 1e8;

/**
 * Pre-defined assets with their initial reserves and anchor USD prices.
 *
 * All minerals + ELIXCOIN are "shared" — every pair that references them
 * shares the same global virtual reserve, preventing cross-pair arbitrage.
 *
 * USDC is treated as the stablecoin anchor (usdPrice = 1.0).
 */
const ASSET_SEEDS: Record<
  string,
  { virtualReserve: number; anchorUsdPrice: number }
> = {
  USDC:     { virtualReserve: 1_000_000,     anchorUsdPrice: 1.0 },
  ELIXIR:   { virtualReserve: 100_000_000,   anchorUsdPrice: 0.001 },
  ELIXCOIN: { virtualReserve: 10_000_000,    anchorUsdPrice: 0.00000967 },
  IRON:     { virtualReserve: 10_000_000,    anchorUsdPrice: 0.00000030 },
  COPPER:   { virtualReserve: 10_000_000,    anchorUsdPrice: 0.00000060 },
  SILVER:   { virtualReserve: 10_000_000,    anchorUsdPrice: 0.00000068 },
  GOLD:     { virtualReserve: 10_000_000,    anchorUsdPrice: 0.0000068 },
  DIAMOND:  { virtualReserve: 10_000_000,    anchorUsdPrice: 0.000068 },
};

@Injectable()
export class AssetRegistryService {
  private readonly logger = new Logger(AssetRegistryService.name);

  // In-memory cache — refreshed from DB on first access per asset
  private cache = new Map<string, AssetRegistry>();

  constructor(
    @InjectModel(AssetRegistry.name)
    private readonly assetModel: Model<AssetRegistry>,
    @InjectModel(LiquidityPool.name)
    private readonly poolModel: Model<LiquidityPool>,
  ) {}

  // ── Bootstrap: ensure every known asset exists in the registry ────────
  async bootstrap(): Promise<void> {
    for (const [asset, seed] of Object.entries(ASSET_SEEDS)) {
      const exists = await this.assetModel.findOne({ asset }).lean().exec();
      if (!exists) {
        await this.assetModel.create({
          asset,
          virtualReserve: seed.virtualReserve,
          usdPrice: seed.anchorUsdPrice,
          anchorUsdPrice: seed.anchorUsdPrice,
          priceMin: seed.anchorUsdPrice * 0.01,
          priceMax: seed.anchorUsdPrice * 100,
        });
        this.logger.log(`[AssetRegistry] Bootstrapped ${asset}`);
      }

      // [SAFETY] Always enforce stable assets at anchor price on startup.
      // This corrects any drift that leaked in before the fix.
      if (AssetRegistryService.STABLE_ASSETS.has(asset)) {
        await this.assetModel
          .updateOne(
            { asset, usdPrice: { $ne: seed.anchorUsdPrice } },
            { $set: { usdPrice: seed.anchorUsdPrice } },
          )
          .exec();
        this.cache.delete(asset);
      }
    }
  }

  // ── Get asset (with in-memory cache) ─────────────────────────────────
  async getAsset(asset: string): Promise<AssetRegistry> {
    let a = this.cache.get(asset);
    if (a) return a;

    let doc = await this.assetModel.findOne({ asset }).lean().exec();
    if (!doc) {
      // Seed on first access
      const seed = ASSET_SEEDS[asset];
      if (seed) {
        doc = await this.assetModel.create({
          asset,
          virtualReserve: seed.virtualReserve,
          usdPrice: seed.anchorUsdPrice,
          anchorUsdPrice: seed.anchorUsdPrice,
          priceMin: seed.anchorUsdPrice * 0.01,
          priceMax: seed.anchorUsdPrice * 100,
        });
      } else {
        // Unknown asset — create with zero reserves
        doc = await this.assetModel.create({
          asset,
          virtualReserve: 0,
          usdPrice: 0,
          anchorUsdPrice: 0,
        });
      }
    }
    this.cache.set(asset, doc);
    return doc;
  }

  // ── Recalculate USD price from global reserves (constant-product) ────
  /**
   * For a pair BASE/QUOTE, the mid price = quoteUsdPrice / baseUsdPrice.
   *
   * We derive each asset's USD price from its virtual reserve using a
   * simple bonding-curve model:
   *   usdPrice = anchorUsdPrice * (totalSupply / virtualReserve)
   *
   * This means as reserve decreases (asset becomes scarcer), price rises.
   * As reserve increases (asset becomes abundant), price drops.
   */
  async recalcUsdPrice(asset: string): Promise<number> {
    const a = await this.getAsset(asset);
    if (a.virtualReserve <= 0 || a.anchorUsdPrice <= 0) return a.usdPrice;

    // Use a reference reserve (the initial seed) for the bonding curve
    const seed = ASSET_SEEDS[asset];
    const refReserve = seed?.virtualReserve ?? a.virtualReserve;

    // Price = anchor * (reference / current) — scarcer = more expensive
    const newPrice = a.anchorUsdPrice * (refReserve / a.virtualReserve);

    // Clamp to min/max bounds
    const clamped = Math.max(a.priceMin, Math.min(a.priceMax, newPrice));

    // Update in DB + cache
    await this.assetModel
      .updateOne({ asset }, { $set: { usdPrice: round8(clamped) } })
      .exec();
    a.usdPrice = round8(clamped);
    this.cache.set(asset, a);

    return a.usdPrice;
  }

  // ── Get mid price for any pair from global reserves ───────────────────
  /**
   * Given pair "IRON/USDC", calculate mid = USDC.usdPrice / IRON.usdPrice
   * Given pair "ELIXCOIN/IRON", calculate mid = IRON.usdPrice / ELIXCOIN.usdPrice
   *
   * Note: pair format is BASE/QUOTE, and mid = QUOTE per BASE.
   * So mid = quoteAsset.usdPrice / baseAsset.usdPrice
   */
  async getMidFromGlobalReserves(pair: string): Promise<number> {
    const [base, quote] = pair.split("/");
    const baseAsset = await this.getAsset(base);
    const quoteAsset = await this.getAsset(quote);

    if (baseAsset.usdPrice <= 0 || quoteAsset.usdPrice <= 0) {
      // Fallback to anchor prices
      return baseAsset.anchorUsdPrice > 0
        ? baseAsset.anchorUsdPrice / quoteAsset.anchorUsdPrice
        : 0;
    }

    // mid = how many QUOTE per 1 BASE = basePrice(USD) / quotePrice(USD)
    // e.g. IRON/USDC: mid = 0.00000030 / 1.0 = 0.00000030 USDC per IRON
    return round8(baseAsset.usdPrice / quoteAsset.usdPrice);
  }

  // ── Update reserves after a fill + recalculate prices ─────────────────
  /**
   * After a fill:
   *   1. Update global virtualReserves for both base and quote assets
   *   2. Recalculate USD prices for both assets
   *   3. Return new mid prices for all affected pairs
   *
   * @param base       The base asset (e.g. "IRON")
   * @param quote      The quote asset (e.g. "USDC")
   * @param baseDelta  Positive = reserve increases (SELL), negative = decreases (BUY)
   * @param quoteDelta Positive = reserve increases (BUY), negative = decreases (SELL)
   */
  async updateReservesAfterFill(
    base: string,
    quote: string,
    baseDelta: number,
    quoteDelta: number,
  ): Promise<{ basePrice: number; quotePrice: number }> {
    // 1. Update base asset reserve
    await this.assetModel
      .updateOne(
        { asset: base },
        { $inc: { virtualReserve: baseDelta } },
      )
      .exec();
    // Invalidate cache
    this.cache.delete(base);

    // 2. Update quote asset reserve
    await this.assetModel
      .updateOne(
        { asset: quote },
        { $inc: { virtualReserve: quoteDelta } },
      )
      .exec();
    this.cache.delete(quote);

    // 3. Recalculate USD prices
    const basePrice = await this.recalcUsdPrice(base);
    const quotePrice = await this.recalcUsdPrice(quote);

    return { basePrice, quotePrice };
  }

  // ── Propagate mid prices to all affected pools ────────────────────────
  /**
   * After updating global reserves, recalculate and update `lastMid` for
   * every pool that uses either the base or quote asset.
   *
   * Returns the list of updated pairs.
   */
  async propagateToAffectedPools(
    base: string,
    quote: string,
  ): Promise<string[]> {
    // Find all pools that contain either base or quote
    const affectedPools = await this.poolModel
      .find({
        $or: [
          { pair: { $regex: new RegExp(`^${base}/`) } },
          { pair: { $regex: new RegExp(`/${base}$`) } },
          { pair: { $regex: new RegExp(`^${quote}/`) } },
          { pair: { $regex: new RegExp(`/${quote}$`) } },
        ],
      })
      .lean()
      .exec();

    const updatedPairs: string[] = [];

    for (const pool of affectedPools) {
      const newMid = await this.getMidFromGlobalReserves(pool.pair);
      if (newMid > 0 && newMid !== pool.lastMid) {
        await this.poolModel
          .updateOne({ pair: pool.pair }, { $set: { lastMid: newMid } })
          .exec();
        updatedPairs.push(pool.pair);
      }
    }

    return updatedPairs;
  }

  // ── Propagate ALL pools (for drift cycles) ───────────────────────────
  async propagateAllPools(): Promise<void> {
    const pools = await this.poolModel.find({}).lean().exec();
    for (const pool of pools) {
      const newMid = await this.getMidFromGlobalReserves(pool.pair);
      if (newMid > 0) {
        await this.poolModel
          .updateOne({ pair: pool.pair }, { $set: { lastMid: newMid } })
          .exec();
      }
    }
  }

  // ── Migrate existing pool reserves into the asset registry ────────────
  /**
   * One-time migration: for each pool, push its baseReserve and quoteReserve
   * into the global asset registry. This runs once on startup.
   */
  async migrateFromPools(): Promise<void> {
    const pools = await this.poolModel.find({}).lean().exec();
    for (const pool of pools) {
      const [base, quote] = pool.pair.split("/");
      const baseReserve =
        pool.baseReserve || (pool as any).elixcoinReserve || 0;
      const quoteReserve =
        pool.quoteReserve || (pool as any).elixirReserve || 0;

      if (baseReserve > 0) {
        await this.assetModel
          .updateOne(
            { asset: base },
            { $max: { virtualReserve: baseReserve } },
          )
          .exec();
      }
      if (quoteReserve > 0) {
        await this.assetModel
          .updateOne(
            { asset: quote },
            { $max: { virtualReserve: quoteReserve } },
          )
          .exec();
      }
    }
    this.logger.log("[AssetRegistry] Migration from pools complete");
  }

  // ── Stable assets (NEVER drift from anchor price) ─────────────────────
  private static readonly STABLE_ASSETS = new Set(["USDC", "ELIXIR"]);

  // ── Update USD price directly (for drift cycles) ─────────────────────
  async setUsdPrice(asset: string, price: number): Promise<void> {
    // [SAFETY] Stable assets are pegged to their anchor — never allow drift.
    if (AssetRegistryService.STABLE_ASSETS.has(asset)) {
      const seed = ASSET_SEEDS[asset];
      if (seed) {
        this.cache.delete(asset);
        return; // keep the stable asset at its anchor price
      }
    }
    await this.assetModel
      .updateOne({ asset }, { $set: { usdPrice: round8(price) } })
      .exec();
    this.cache.delete(asset);
  }

  // ── Clear cache (call after external updates) ─────────────────────────
  invalidateCache(asset?: string): void {
    if (asset) this.cache.delete(asset);
    else this.cache.clear();
  }
}
