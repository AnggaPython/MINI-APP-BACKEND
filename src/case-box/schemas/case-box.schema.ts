import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CaseBoxDocument = CaseBox & Document;

export type CaseTier = "COMMON" | "MEDIUM" | "RARE";
export type BuffRarity = "COMMON" | "MEDIUM" | "RARE" | "ULTRA_RARE";
export type CaseOutcome = "ZONK" | "ELIXCOIN" | "MATERIAL" | "BUFF";

/**
 * A single spawned case-box session. Two server round-trips per case:
 *   - GET  /case-box/spawn   → creates this document (unique _id = caseId)
 *   - POST /case-box/destroy → atomically locks the case & rolls the loot
 *
 * The case's HP progress is NEVER stored here — it lives locally on the
 * client. Only the server-authoritative maxHp (rolled at spawn) is kept so
 * the case can't be opened without enough hits.
 *
 * The loot outcome is decided by the multi-layer RNG at destroy time:
 *   Layer 1 — 30% MATERIAL · 35% ZONK · 35% ELIXCOIN (band by case tier)
 *   Layer 2 — MATERIAL rarity: 70% COMMON · 22% MEDIUM · 8% RARE
 *   Layer 3 — exactly 1 tool of that rarity
 * MEDIUM/RARE cases additionally require a Monetag S2S ad ticket before the
 * lock breaks. Every roll is recorded here for audit + history.
 */
@Schema({ timestamps: true })
export class CaseBox {
  @Prop({ required: true, index: true })
  telegramId: string;

  // Spawned case rarity — decides which case SVG is shown + the maxHp band.
  @Prop({ required: true, enum: ["COMMON", "MEDIUM", "RARE"] })
  tier: CaseTier;

  // Rolled at spawn by the server-side HMAC RNG — the lock takes this many hits.
  @Prop({ required: true })
  maxHp: number;

  @Prop({
    required: true,
    enum: ["active", "opened", "claimed"],
    default: "active",
  })
  status: string;

  // Rolled at destroy by the multi-layer RNG (stored for audit + history).
  @Prop({ type: String, default: null, enum: [null, "ZONK", "ELIXCOIN", "MATERIAL", "BUFF"] })
  outcome: CaseOutcome | null;

  @Prop({ type: String, default: null, enum: [null, "COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] })
  lootRarity: CaseTier | null;

  @Prop({ type: String, default: null })
  lootName: string | null;

  // What the user actually received, e.g. { ELIXCOIN: 742 } or { "Void Diamond": 3 }.
  @Prop({ type: Object, default: null })
  loot: Record<string, number> | null;

  @Prop({ type: Date, default: null })
  openedAt: Date | null;

  // Timestamp when the user claimed the loot — used for server-side cooldown
  // enforcement so bots cannot spam-spawn cases.
  @Prop({ type: Date, default: null })
  claimedAt: Date | null;

  // TTL expiry: active (unopened) cases die after 2h; opened cases live 30 days
  // so the History tab stays meaningful.
  @Prop({ type: Date, required: true })
  expireAt: Date;
}

export const CaseBoxSchema = SchemaFactory.createForClass(CaseBox);
CaseBoxSchema.index({ telegramId: 1, status: 1, openedAt: -1 });
CaseBoxSchema.index({ telegramId: 1, status: 1, claimedAt: -1 });


CaseBoxSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
CaseBoxSchema.index({ telegramId: 1, status: 1, createdAt: -1 });
