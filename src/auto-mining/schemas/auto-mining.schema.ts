import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

// ── Auto-mining SaaS subscription ──────────────────────────────────────────
// Paid autopilot: 250,000 ELIXIR / 30 days, max 500 automated runs per day.
// Single active doc per user (renew overwrites after expiry/cancel).
@Schema({ timestamps: true })
export class AutoMiningSub {
  @Prop({ required: true, unique: true })
  telegramId: string;

  @Prop({
    required: true,
    enum: ["active", "paused", "expired", "cancelled"],
    default: "active",
  })
  status: string;

  @Prop({ required: true, default: 30 })
  planDays: number;

  @Prop({ required: true, default: 250000 })
  feePaid: number;

  /** Claim destination for stone runs: "save" → bag, "sell" → ELIXCOIN */
  @Prop({ required: true, enum: ["save", "sell"], default: "save" })
  claimMode: string;

  /** "stone" | "casebox" | "split" */
  @Prop({
    required: true,
    enum: ["stone", "casebox", "split"],
    default: "stone",
  })
  target: string;

  /** Split mode: % of daily quota for miner-stone (rest → case-box) */
  @Prop({ default: 50 })
  splitStonePct: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 500 })
  dailyQuota: number;

  /** Pause/resume switch (cron skips when false) */
  @Prop({ default: true })
  autopilotOn: boolean;

  @Prop({ type: Date, default: null })
  lastRunAt: Date | null;

  @Prop({ default: 0 })
  totalRuns: number;

  @Prop({ default: 0 })
  totalElixirValue: number;

  /** Loadout: favourite pickaxe (display + manual farming) */
  @Prop({ type: String, default: null })
  favPickaxe: string | null;

  /** Buff base-item IDs this plan activated (removed on end/cancel) */
  @Prop({ type: [String], default: [] })
  planBuffs: string[];
}

export type AutoMiningSubDocument = AutoMiningSub & Document;
export const AutoMiningSubSchema = SchemaFactory.createForClass(AutoMiningSub);

// ── Per-day, per-target run ledger (drives 1/7/30-day reports + ROI) ───────
@Schema()
export class AutoMiningDay {
  @Prop({ required: true })
  telegramId: string;

  /** Local calendar day YYYY-MM-DD (server timezone) */
  @Prop({ required: true })
  date: string;

  /** "stone" | "casebox" */
  @Prop({ required: true })
  target: string;

  @Prop({ default: 0 })
  runs: number;

  /** Skipped attempts (busy session, rate limit, transient error) */
  @Prop({ default: 0 })
  skipped: number;

  /** Merged earnings, e.g. { IRON: 120, ELIXCOIN: 3.5 } */
  @Prop({ type: Object, default: {} })
  earned: Record<string, number>;

  /** Estimated earnings in ELIXIR (documented estimate, see service) */
  @Prop({ default: 0 })
  elixirValue: number;
}

export type AutoMiningDayDocument = AutoMiningDay & Document;
export const AutoMiningDaySchema = SchemaFactory.createForClass(AutoMiningDay);
AutoMiningDaySchema.index(
  { telegramId: 1, date: 1, target: 1 },
  { unique: true },
);
AutoMiningDaySchema.index({ telegramId: 1, date: 1 });
