import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AssetRegistryDocument = AssetRegistry & Document;

/**
 * Global asset registry — the single source of truth for each asset's
 * virtual reserve and USD-equivalent price.
 *
 * When a user trades IRON in the IRON/USDC pair, the global IRON reserve
 * changes. The ELIXCOIN/IRON pair's mid price is automatically derived
 * from the updated global reserves, preventing cross-pair arbitrage.
 *
 * Each asset has:
 *  - virtualReserve: the platform's total virtual inventory (abstract units)
 *  - usdPrice: the asset's reference price in USD (derived from reserves)
 *  - anchorUsdPrice: the initial/target price (gravity anchor for drift)
 */
@Schema({ timestamps: true })
export class AssetRegistry {
  /** Asset ticker — e.g. "IRON", "COPPER", "ELIXCOIN", "USDC", "ELIXIR" */
  @Prop({ required: true, unique: true })
  asset: string;

  /** Platform's total virtual inventory of this asset (abstract units). */
  @Prop({ default: 0 })
  virtualReserve: number;

  /** Current reference price in USD (recalculated on every fill). */
  @Prop({ default: 0 })
  usdPrice: number;

  /** Anchor/target USD price — gravity pulls drift back towards this. */
  @Prop({ default: 0 })
  anchorUsdPrice: number;

  /** Minimum bound for price drift. */
  @Prop({ default: 0 })
  priceMin: number;

  /** Maximum bound for price drift. */
  @Prop({ default: Infinity })
  priceMax: number;

  /** Total supply cap (for reference — not enforced in trading). */
  @Prop({ default: 0 })
  totalSupply: number;
}

export const AssetRegistrySchema =
  SchemaFactory.createForClass(AssetRegistry);
