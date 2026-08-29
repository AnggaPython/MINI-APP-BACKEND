import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type BuffItemDocument = BuffItem & Document;

/**
 * Buff type — each type applies to a specific game mechanic.
 *
 *  - ATK:        Flat damage bonus per hit (mining + case box)
 *  - ECONOMY:    Percentage boost on claimed resources (iron, copper, etc.)
 *  - DURABILITY: Slows down durability drain — pickaxe lasts longer
 *  - DROPRATE:   Increases chance of rare item drops
 */
export type BuffType = "ATK" | "ECONOMY" | "DURABILITY" | "DROPRATE";

/**
 * Rarity tier — determines buff value range.
 *
 *  COMMON:      10 values  →  +0.10 … +0.60
 *  MEDIUM:      10 values  →  +1.25 … +3.50
 *  RARE:        10 values  →  +3.75 … +6.00
 *  ULTRA_RARE:  10 values  →  +6.00 … +33.00
 */
export type BuffRarity = "COMMON" | "MEDIUM" | "RARE" | "ULTRA_RARE";

/**
 * A single buff item in the 160-item collection.
 *
 * Each item is linked to a frontend collection item (via `collectionItemId`)
 * and grants a specific buff when owned + activated by the user.
 *
 * Distribution:
 *   ATK:        40 items (10 per rarity)
 *   ECONOMY:    40 items (10 per rarity)
 *   DURABILITY: 40 items (10 per rarity)
 *   DROPRATE:   40 items (10 per rarity)
 *   ─────────────────────────────────────
 *   TOTAL:     160 items
 */
@Schema({ timestamps: true, collection: "buff_items" })
export class BuffItem {
  /**
   * Unique buff identifier — e.g. "ATK-COMMON-01", "ECONOMY-ULTRA_RARE-10".
   * This is the primary key used in user collections.
   */
  @Prop({ required: true, unique: true, index: true })
  buffId: string;

  /**
   * Reference to the frontend collection item ID (e.g. "clay-pot").
   * Links the SVG visual to this buff item.
   */
  @Prop({ required: true })
  collectionItemId: string;

  /**
   * Buff category — determines which game mechanic this item boosts.
   */
  @Prop({ required: true, enum: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"] })
  buffType: BuffType;

  /**
   * Rarity tier — determines buff value range and visual glow.
   */
  @Prop({ required: true, enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] })
  rarity: BuffRarity;

  /**
   * Numeric buff value — meaning depends on buffType:
   *   ATK:        flat damage per hit (e.g. 3.75 = +3.75 damage)
   *   ECONOMY:    percentage on resources (e.g. 15 = +15%)
   *   DURABILITY: flat durability restored every 5 hits (e.g. 5 = +5 durability)
   *   DROPRATE:   percentage on rare drop chance (e.g. 33 = +33%)
   */
  @Prop({ required: true })
  buffValue: number;

  /**
   * Unit label for display — "flat" for ATK/DURABILITY, "percent" for ECONOMY/DROPRATE.
   */
  @Prop({ required: true, enum: ["flat", "percent"] })
  buffUnit: "flat" | "percent";

  /** English display name — e.g. "Clay Pot" */
  @Prop({ required: true })
  name: string;

  /** Short description — e.g. "+0.1 ATK per hit" */
  @Prop({ required: true })
  description: string;

  /** Emoji icon for UI — e.g. "🏺" */
  @Prop({ default: "📦" })
  icon: string;
}

export const BuffItemSchema = SchemaFactory.createForClass(BuffItem);

// Query indexes
BuffItemSchema.index({ buffType: 1, rarity: 1 });
BuffItemSchema.index({ collectionItemId: 1 });
