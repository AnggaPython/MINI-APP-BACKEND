import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MarketplaceItemDocument = MarketplaceItem & Document;

/**
 * Marketplace item — one document per tradeable item (235 total).
 *
 * 160 buff items (ATK/ECONOMY/DURABILITY/DROPRATE × 4 rarities × 10 values)
 * + 75 material tools (COMMON/MEDIUM/RARE × 25)
 *
 * BUY price  = platform buys from user (instant cash, lower price)
 * SELL price = platform sells to user (market price, higher price)
 * Spread     = SELL / BUY ratio (target: 10x = 900% ROI for platform)
 */
@Schema({ timestamps: true, collection: "marketplace_items" })
export class MarketplaceItem {
  /** Unique item ID — matches collectionItemId (buff) or material name */
  @Prop({ required: true, unique: true, index: true })
  itemId: string;

  /** Item type — buff item or material tool */
  @Prop({ required: true, enum: ["buff", "material"] })
  itemType: "buff" | "material";

  /** Display name */
  @Prop({ required: true })
  name: string;

  /** Rarity tier */
  @Prop({ required: true, enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] })
  rarity: string;

  /** Buff type (only for buff items) */
  @Prop({ type: String, default: null })
  buffType: string | null;

  /** Buff value (only for buff items) */
  @Prop({ default: 0 })
  buffValue: number;

  /** Platform BUY price — user sells item to platform (ELIXCOIN) */
  @Prop({ required: true })
  buyPrice: number;

  /** Platform SELL price — user buys item from platform (ELIXCOIN) */
  @Prop({ required: true })
  sellPrice: number;

  /** Current liquidity — how many units platform has in stock */
  @Prop({ default: 1000 })
  liquidity: number;

  /** Max liquidity cap */
  @Prop({ default: 10000 })
  maxLiquidity: number;

  /** Icon emoji */
  @Prop({ default: "📦" })
  icon: string;

  /** Whether this item is currently tradeable */
  @Prop({ default: true })
  active: boolean;
}

export const MarketplaceItemSchema =
  SchemaFactory.createForClass(MarketplaceItem);

// Indexes for fast queries
MarketplaceItemSchema.index({ rarity: 1 });
MarketplaceItemSchema.index({ itemType: 1 });
MarketplaceItemSchema.index({ active: 1 });
