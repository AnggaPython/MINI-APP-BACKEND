import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LiquidityPoolDocument = LiquidityPool & Document;

/**
 * The platform's liquidity pool for the ELIXIR/ELIXCOIN pair.
 *
 * The platform/admin pre-installs both reserves (1 ELIXIR = 10 ELIXCOIN at
 * the reference mid), quotes a bid/ask spread around the real-time mid, and
 * captures profit from (a) the spread slip on every user fill and (b) a flat
 * 1.5% fee on every transaction — user AND market-maker bot alike.
 *
 * The market-maker bot trades against this pool at the exact mid price, so
 * its synthetic volume never moves the price (no pump / no dump).
 */
@Schema({ timestamps: true })
export class LiquidityPool {
  @Prop({ required: true, unique: true })
  pair: string; // "ELIXIR/ELIXCOIN"

  /** Platform ELIXIR inventory. */
  @Prop({ default: 0 })
  elixirReserve: number;

  /** Platform ELIXCOIN inventory. */
  @Prop({ default: 0 })
  elixcoinReserve: number;

  /** Real-time mid price — ELIXCOIN per 1 ELIXIR (reference 10.00000000). */
  @Prop({ default: 10 })
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
}

export const LiquidityPoolSchema =
  SchemaFactory.createForClass(LiquidityPool);
