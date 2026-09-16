import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MiningStoneDocument = MiningStone & Document;

export type StoneTier = "Common" | "Medium" | "Rare";

/**
 * A single spawned stone session. Three server round-trips per stone:
 *   - GET  /miner-stone/spawn    → creates this document (unique _id = stoneId)
 *   - POST /miner-stone/destroy  → atomically locks the stone & rolls its loot
 *   - POST /miner-stone/claim    → commits the loot: SAVE (resources) or SELL (ELIX)
 *
 * The stone's current HP progress is NEVER stored here — it lives locally on
 * the client. Only the server-authoritative maxHp (rolled at spawn) is kept so
 * reward scaling can be computed server-side without trusting the client.
 *
 * `zonk` is part of the spawn RNG: some stones simply contain nothing, so the
 * destroy response carries no loot and the client shows the "NOPE" modal.
 */
@Schema({ timestamps: true })
export class MiningStone {
  @Prop({ required: true, index: true })
  telegramId: string;

  @Prop({ required: true, enum: ["Common", "Medium", "Rare"] })
  tier: StoneTier;

  @Prop({ required: true })
  maxHp: number;

  // Rolled at spawn by the server-side HMAC RNG — a ZONK stone has no loot at all
  @Prop({ type: Boolean, default: false })
  zonk: boolean;

  @Prop({ required: true, enum: ["active", "claimed"], default: "active" })
  status: string;

  @Prop({ type: Object, default: null })
  rewards: Record<string, number> | null;

  // Loot commit: null = pending, "save" = resources to bag, "sell" = converted to ELIX
  @Prop({ type: String, default: null, enum: [null, "save", "sell"] })
  claimAction: string | null;

  @Prop({ type: Date, default: null })
  claimedAt: Date | null;

  @Prop({ type: Date, default: null })
  finalizedAt: Date | null;

  // TTL expiry: active (unclaimed) stones die after 2h to keep the collection
  // lean; claimed stones live 30 days so the History tab stays meaningful.
  @Prop({ type: Date, required: true })
  expireAt: Date;
}

export const MiningStoneSchema = SchemaFactory.createForClass(MiningStone);
MiningStoneSchema.index({ telegramId: 1, status: 1 });
MiningStoneSchema.index({ telegramId: 1, status: 1, claimedAt: -1 });
MiningStoneSchema.index({ telegramId: 1, status: 1, claimAction: 1 });


MiningStoneSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
