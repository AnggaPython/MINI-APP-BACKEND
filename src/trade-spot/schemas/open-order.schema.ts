import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type OpenOrderDocument = OpenOrder & Document;

/**
 * A resting user limit order on ELIXIR/ELIXCOIN.
 * Fills when the real-time price crosses the limit (checked on every
 * market-maker cycle); until then it stays OPEN and can be cancelled.
 */
@Schema({ timestamps: true })
export class OpenOrder {
  @Prop({ required: true, index: true })
  telegramId: string;

  @Prop({ default: "ELIXCOIN/ELIXIR" })
  pair: string;

  @Prop({ required: true, enum: ["BUY", "SELL"] })
  side: "BUY" | "SELL";

  /** Limit price — ELIXCOIN per 1 ELIXIR. */
  @Prop({ required: true })
  price: number;

  /** Remaining base amount to fill (ELIXIR). */
  @Prop({ required: true })
  amount: number;

  @Prop({ default: 0 })
  filledAmount: number;

  @Prop({ required: true, default: "OPEN", enum: ["OPEN", "FILLED", "CANCELLED"] })
  status: "OPEN" | "FILLED" | "CANCELLED";

  // ── Iceberg: split large order into smaller visible chunks ──────────
  /** Whether this is an Iceberg order. */
  @Prop({ default: false })
  iceberg: boolean;

  /** Total amount of the original order (before chunking). */
  @Prop({ default: 0 })
  icebergTotal: number;

  /** Size of each visible chunk (e.g., 10000). */
  @Prop({ default: 0 })
  icebergChunkSize: number;

  /** How many chunks have been filled so far. */
  @Prop({ default: 0 })
  icebergChunksFilled: number;
}

export const OpenOrderSchema = SchemaFactory.createForClass(OpenOrder);
OpenOrderSchema.index({ status: 1, price: 1 });
