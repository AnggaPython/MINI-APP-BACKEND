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

  /** Platform ELIXCOIN inventory. */
  @Prop({ default: 0 })
  elixcoinReserve: number;

  /** Platform ELIXIR inventory. */
  @Prop({ default: 0 })
  elixirReserve: number;

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

  /** Admin-tunable cooldown between bot cycles, in minutes (1–60). */
  @Prop({ default: 15, min: 1, max: 60 })
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
}

export const LiquidityPoolSchema =
  SchemaFactory.createForClass(LiquidityPool);
