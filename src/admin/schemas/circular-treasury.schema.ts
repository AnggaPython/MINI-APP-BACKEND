import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CircularTreasuryDocument = CircularTreasury & Document;

@Schema({ timestamps: true })
export class CircularTreasury {
  @Prop({ required: true, type: String, default: "MAIN" })
  key: string;

  @Prop({ required: true, type: Number, default: 100000 })
  adminTreasuryElixir: number;

  @Prop({ required: true, type: Number, default: 0 })
  circularLossPoolElixir: number;

  @Prop({ required: true, type: Number, default: 0 })
  burnedTotalElixir: number;

  @Prop({ required: true, type: Number, default: 100000 })
  adminTreasuryStartCycle: number;

  @Prop({ required: true, type: Number, default: 0 })
  totalTaxCollectedThisCycle: number;

  @Prop({ required: true, type: Boolean, default: false })
  isRefillMode: boolean;

  @Prop({ required: true, type: Number, default: 0 })
  refillTriggerCountThisCycle: number;

  @Prop({ required: true, type: Number, default: 100000 })
  paramAdminTreasuryStart: number;

  @Prop({ required: true, type: Number, default: 90000 })
  paramRefillTriggerBelow: number;

  @Prop({ required: true, type: Number, default: 102000 })
  paramRefillStopAbove: number;

  @Prop({ required: true, type: Number, default: 0.15 })
  paramAdminTaxNormal: number;

  @Prop({ required: true, type: Number, default: 0.25 })
  paramAdminTaxRefill: number;

  @Prop({ required: true, type: Number, default: 0.8 })
  paramCircularShareNormal: number;

  @Prop({ required: true, type: Number, default: 0.7 })
  paramCircularShareRefill: number;

  @Prop({ required: true, type: Number, default: 0.05 })
  paramBurnRate: number;

  @Prop({ required: true, type: Number, default: 0.02 })
  paramMaxAdminPayoutPercentPerBet: number;

  @Prop({ required: true, type: Number, default: 500 })
  paramWhaleBetThresholdElixir: number;

  @Prop({ required: true, type: Number, default: 0.12 })
  paramWhalePatternNormalTargetLoss: number;

  @Prop({ required: true, type: Number, default: 0.22 })
  paramWhalePatternRefillTargetLoss: number;

  @Prop({ type: [{ type: Object }], default: [] })
  liveImpactLog: Array<{
    betId: string;
    telegramId: string;
    betAmount: number;
    isWhale: boolean;
    isWin: boolean;
    circularPoolDelta: number;
    adminTreasuryDelta: number;
    burnedDelta: number;
    timestamp: number;
  }>;

  @Prop({ type: [{ type: Object }], default: [] })
  dailySnapshots30D: Array<{
    dateYYYYMMDD: string;
    adminTreasuryElixir: number;
    circularLossPool: number;
    burnedToday: number;
    taxCollectedToday: number;
    betsToday: number;
  }>;

  @Prop({ type: Date })
  lastDailySnapshot?: Date;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const CircularTreasurySchema =
  SchemaFactory.createForClass(CircularTreasury);
