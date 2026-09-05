import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ReferralNotificationDocument = ReferralNotification & Document;

/**
 * Referral notification queue — one document per event.
 *
 * - `kind: "invite"`  → for the UPLINE when a downline binds
 *   (downlineUsername + amount feed the aggregated congratulations modal).
 * - `kind: "welcome"` → for the DOWNLINE itself on first capture
 *   (tells them where the +25 vault bonus lives).
 *
 * Delivery is pull-based: pending rows (`ackedAt == null`) ride along the
 * regular `/users/sync` response, so no realtime transport is needed —
 * online users get it within seconds, offline users get the backlog as
 * one aggregated modal on next open. The client reports back explicit
 * acks (X dismissed / CLAIM NOW tapped) and acked rows never resurface.
 * All timestamps are server-side.
 */
@Schema({ timestamps: true })
export class ReferralNotification {
  @Prop({ required: true, index: true })
  recipientTelegramId: string;

  @Prop({ required: true, enum: ["invite", "welcome"] })
  kind: string;

  @Prop({ required: true })
  downlineUsername: string;

  @Prop({ required: true })
  amount: number;

  // NOTE: no `index: true` here on purpose — the TTL index below covers
  // this field, and MongoDB rejects two indexes with the same key pattern.
  @Prop({ default: null })
  ackedAt: Date;

  @Prop({ default: null })
  ackedVia: string;
}

export const ReferralNotificationSchema =
  SchemaFactory.createForClass(ReferralNotification);

// Hygiene: auto-delete acked rows 30 days after acknowledgement.
// Unacked rows (ackedAt == null) are never touched by this TTL.
ReferralNotificationSchema.index(
  { ackedAt: 1 },
  {
    name: "ackedAt_ttl",
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { ackedAt: { $type: "date" } },
  },
);
