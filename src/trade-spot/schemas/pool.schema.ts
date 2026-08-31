import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LiquidityPoolDocument = LiquidityPool & Document;

/**
 * The platform's liquidity pool for the ELIXCOIN/ELIXIR pair.
 *
 * The platform/admin pre-installs both reserves (1 ELIXCOIN ≈ 0.15 ELIXIR at
 * the reference mid ≈ 0.14872647389), quotes a bid/ask spread around the
 * real-time mid, and captures profit from (a) the spread slip on every user
 * fill and (b) a flat 1.5% fee on every transaction — user AND market-maker
 * bot alike.
 *
 * The market-maker bot trades against this pool at the exact mid price, so
 * its synthetic volume never moves the price (no pump / no dump).
 */
@Schema({ timestamps: true })
export class LiquidityPool {
  @Prop({ required: true, unique: true })
  pair: string; // "ELIXCOIN/ELIXIR"

  /** Legacy: Platform ELIXCOIN inventory. Use baseReserve for new pairs. */
  @Prop({ default: 0 })
  elixcoinReserve: number;

  /** Legacy: Platform ELIXIR inventory. Use quoteReserve for new pairs. */
  @Prop({ default: 0 })
  elixirReserve: number;

  /** Platform Base inventory (Generic). */
  @Prop({ default: 0 })
  baseReserve: number;

  /** Platform Quote inventory (Generic). */
  @Prop({ default: 0 })
  quoteReserve: number;

  /** The AI minimum bound for this pair. */
  @Prop({ default: 0 })
  midMin: number;

  /** The AI maximum bound for this pair. */
  @Prop({ default: Infinity })
  midMax: number;

  /** Real-time mid price — ELIXIR per 1 ELIXCOIN (reference ≈ 0.14872647389). */
  @Prop({ default: 0.14872647389 })
  lastMid: number;

  /** Full quoted spread as a fraction (e.g. 0.004 = 0.4%). */
  @Prop({ default: 0.004 })
  spreadPct: number;

  /** Flat fee per transaction (0.015 = 1.5%). */
  @Prop({ default: 0.025 })
  feePct: number;

  /** Total fees collected by the platform (ELIXCOIN). */
  @Prop({ default: 0 })
  platformFeesAccumulated: number;

  /** Spread-slip profit (|fillPrice − mid| × amount) on user fills (ELIXCOIN). */
  @Prop({ default: 0 })
  spreadProfitAccumulated: number;

  /** How many market-maker cycles have run. */
  @Prop({ default: 0 })
  botRunCount: number;

  @Prop({ default: null })
  lastBotRunAt: Date;

  /** Total base volume ever traded on the pair (ELIXIR). */
  @Prop({ default: 0 })
  lifetimeVolume: number;

  /** Admin switch — the market-maker bot runs only while enabled. */
  @Prop({ default: true })
  botEnabled: boolean;

  /** Admin-tunable: how many random executions per hour (1 trade each). */
  @Prop({ default: 7, min: 1, max: 100 })
  botTradesPerCycle: number;

  /** Admin-tunable cooldown between bot cycles, in minutes (1–60). */
  @Prop({ default: 5, min: 1, max: 60 })
  botIntervalMinutes: number;

  // ── 24h pre-computed stats (eliminates full table scan every 5s) ────────
  // Updated on every trade (bot + user). Reset daily by the bot cycle.
  @Prop({ default: 0 })
  high24h: number;

  @Prop({ default: Infinity })
  low24h: number;

  @Prop({ default: 0 })
  volume24h: number;

  @Prop({ default: 0 })
  quoteVolume24h: number;

  @Prop({ default: 0 })
  open24h: number;

  @Prop({ default: null })
  dayResetAt: Date;

  // ── Cosmetic 24h change% (random -1.56% to +2.27%, refreshes hourly) ──
  // Since all prices are fixed, real change% is always 0.
  // This field provides a realistic-looking percentage for UI display only.
  @Prop({ default: 0 })
  cosmeticChangePct: number;

  @Prop({ default: null })
  cosmeticPctUpdatedAt: Date;

  // ── Admin Price Control ──────────────────────────────────────────────
  // When set, the MM bot and driftMid operate within this range.
  // Admin sets SELL ceiling (askCeiling) and BUY floor (bidFloor).
  // The mid price is always: (askCeiling + bidFloor) / 2.
  // Bot trades ONLY between bidFloor and askCeiling — never above/below.

  /** Admin-controlled SELL ceiling (highest ask price). 0 = disabled. */
  @Prop({ default: 0 })
  adminAskCeiling: number;

  /** Admin-controlled BUY floor (lowest bid price). 0 = disabled. */
  @Prop({ default: 0 })
  adminBidFloor: number;

  // ── Admin Order Book Walls ───────────────────────────────────────────
  // 10 SELL walls (asks) + 10 BUY walls (bids) that appear in the
  // order book as synthetic depth. These are NOT real orders — they
  // create the illusion of liquidity and support/resistance levels.

  /** SELL walls: [{ price: number, amount: number }] — shown as asks. */
  @Prop({ type: [{ price: Number, amount: Number }], default: [] })
  adminSellWalls: { price: number; amount: number }[];

  /** BUY walls: [{ price: number, amount: number }] — shown as bids. */
  @Prop({ type: [{ price: Number, amount: Number }], default: [] })
  adminBuyWalls: { price: number; amount: number }[];
}

export const LiquidityPoolSchema =
  SchemaFactory.createForClass(LiquidityPool);
