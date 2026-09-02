import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PendingTpSlDocument = PendingTpSl & Document;

/**
 * Pending Take-Profit / Stop-Loss order.
 * Created when a user places a trade with TP/SL enabled.
 * Checked on every trade execution — triggers auto-sell when price hits target.
 */
@Schema({ timestamps: true })
export class PendingTpSl {
  @Prop({ required: true })
  telegramId: string;

  @Prop({ required: true })
  pair: string;

  /** Original buy/sell side — TP/SL always triggers the OPPOSITE side. */
  @Prop({ required: true, enum: ["BUY", "SELL"] })
  originalSide: string;

  /** TP trigger price (auto-sell when price >= tpPrice). 0 = disabled. */
  @Prop({ default: 0 })
  tpPrice: number;

  /** SL trigger price (auto-sell when price <= slPrice). 0 = disabled. */
  @Prop({ default: 0 })
  slPrice: number;

  /** Amount of base asset to sell when triggered. */
  @Prop({ required: true })
  amount: number;

  /** Whether this order has been triggered and executed. */
  @Prop({ default: false })
  triggered: boolean;

  /** Whether this order was cancelled by user. */
  @Prop({ default: false })
  cancelled: boolean;

  /** When it was triggered. */
  @Prop({ default: null })
  triggeredAt: Date;
}

export const PendingTpSlSchema = SchemaFactory.createForClass(PendingTpSl);
PendingTpSlSchema.index({ pair: 1, triggered: 1, cancelled: 1 });
PendingTpSlSchema.index({ telegramId: 1, pair: 1 });
