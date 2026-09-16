import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type AuctionDocument = Auction & Document;

export type AuctionStatus = "active" | "settling" | "sold" | "cancelled";

/**
 * A single auction listing on the marketplace.
 *
 * Sellers list their buff collection items for ELIXCOIN.
 * Buyers pay the listed price; the platform takes a 19% tax.
 * Minimum listing prices vary by buff type + rarity.
 */
@Schema({ timestamps: true, collection: "auctions" })
export class Auction {
  /** The seller's Telegram ID. */
  @Prop({ required: true, index: true })
  sellerId: string;

  /** The seller's display name (cached at listing time). */
  @Prop({ required: true })
  sellerName: string;

  /** The item category: buff (NFT-style) or material (Stackable). */
  @Prop({ required: true, enum: ["buff", "material"], default: "buff" })
  itemCategory: string;

  /** The unique instance ID of the buff item being sold (Optional for materials). */
  @Prop({ required: false, index: true })
  instanceId?: string;

  /** The base buff item ID being sold (e.g. "ATK-COMMON-01" or "Rusty Nail"). */
  @Prop({ required: true, index: true })
  baseItemId: string;

  /** Amount of items being sold (used for materials). */
  @Prop({ required: false, default: 1 })
  amount: number;

  /** Buff type — ATK / ECONOMY / DURABILITY / DROPRATE / MATERIAL. */
  @Prop({ required: true, enum: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE", "MATERIAL"] })
  buffType: string;

  /** Rarity tier — COMMON / MEDIUM / RARE / ULTRA_RARE. */
  @Prop({ required: true, enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] })
  rarity: string;

  /** Listing price in ELIXCOIN (buyer pays this amount). */
  @Prop({ required: true, min: 0 })
  price: number;

  /** Platform tax (19%) in ELIXCOIN — deducted on sale. */
  @Prop({ required: true })
  tax: number;

  /** Net amount seller receives after tax. */
  @Prop({ required: true })
  netAmount: number;

  /** Listing status. */
  @Prop({ required: true, enum: ["active", "settling", "sold", "cancelled"], default: "active" })
  status: AuctionStatus;

  /** When the item was listed. */
  @Prop({ default: Date.now })
  listedAt: Date;

  /** When the listing expires (7 days from listing). */
  @Prop({ required: true })
  expiresAt: Date;

  /** Collateral deposit amount held in escrow (10,000 ELIXCOIN). */
  @Prop({ required: true, default: 10000 })
  collateralDeposit: number;

  /** Whether collateral has been returned to the seller. */
  @Prop({ default: false })
  collateralReturned: boolean;

  /**
   * Deadline of an in-flight settle claim. A listing moved to "settling" is
   * owned exclusively by the request that claimed it; if that request dies
   * mid-settlement the listing stays here and is reported by the hourly
   * recovery sweep instead of being silently re-sold (re-selling could pay a
   * seller twice if the first request already moved money).
   */
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  claimExpiresAt: Date | null;

  /** When the item was sold or cancelled. */
  @Prop({ default: null })
  resolvedAt: Date;

  /** The buyer's Telegram ID (set on sale). */
  @Prop({ default: null })
  buyerId: string;
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);

// Query indexes for marketplace performance
AuctionSchema.index({ status: 1, buffType: 1, rarity: 1 });
AuctionSchema.index({ status: 1, price: 1 });
AuctionSchema.index({ sellerId: 1, status: 1 });
AuctionSchema.index({ listedAt: -1 });

// One active listing per item instance, enforced by the database. The service
// still checks first (fast path), but two concurrent creates used to both pass
// that check and duplicate the escrow. "settling" is excluded so a claimed
// listing in flight does not block anything else.
AuctionSchema.index(
  { sellerId: 1, instanceId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    name: "one_active_listing_per_instance",
  },
);
