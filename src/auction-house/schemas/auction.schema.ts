import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AuctionDocument = Auction & Document;

export type AuctionStatus = "active" | "sold" | "cancelled";

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

  /** The buff item ID being sold (e.g. "ATK-COMMON-01"). */
  @Prop({ required: true, index: true })
  buffId: string;

  /** Buff type — ATK / ECONOMY / DURABILITY / DROPRATE. */
  @Prop({ required: true, enum: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"] })
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
  @Prop({ required: true, enum: ["active", "sold", "cancelled"], default: "active" })
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
