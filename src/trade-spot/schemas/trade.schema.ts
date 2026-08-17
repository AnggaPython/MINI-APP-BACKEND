import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TradeDocument = Trade & Document;

/**
 * A single executed fill on the ELIXIR/ELIXCOIN spot market.
 * Every fill — bot or user — is recorded here and powers the trade history,
 * the 24h ticker, and the market-maker's synthetic volume.
 */
@Schema({ timestamps: true })
export class Trade {
  @Prop({ required: true, default: "ELIXIR/ELIXCOIN" })
  pair: string;

  /** BUY = buying base (ELIXIR) with quote (ELIXCOIN) · SELL = the reverse. */
  @Prop({ required: true, enum: ["BUY", "SELL"] })
  side: "BUY" | "SELL";

  /** Execution price — ELIXCOIN per 1 ELIXIR (8 decimals). */
  @Prop({ required: true })
  price: number;

  /** Base amount traded (ELIXIR). */
  @Prop({ required: true })
  amount: number;

  /** Quote total before fee (ELIXCOIN) = amount * price. */
  @Prop({ required: true })
  total: number;

  /** 2.5% fee charged in ELIXCOIN — always accrues to the platform pool. */
  @Prop({ required: true })
  fee: number;

  /** "BOT" = market-maker background volume · "USER" = real user order. */
  @Prop({ required: true, default: "USER", enum: ["BOT", "USER"] })
  source: "BOT" | "USER";

  @Prop({ index: true })
  telegramId?: string;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
TradeSchema.index({ createdAt: -1 });
TradeSchema.index({ pair: 1, createdAt: -1 });
