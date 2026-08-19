import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserBuffCollectionDocument = UserBuffCollection & Document;

/**
 * Tracks a user's buff-item collection.
 *
 *  - `ownedBuffIds`:   All buff IDs the user has obtained (permanent).
 *  - `activeBuffIds`:  Subset of owned buffs that are currently equipped/activated.
 *
 * Only active buffs contribute to gameplay bonuses. Users can toggle buffs
 * on/off freely — activation is instant and free.
 */
@Schema({ timestamps: true, collection: "user_buff_collections" })
export class UserBuffCollection {
  @Prop({ required: true, unique: true, index: true })
  telegramId: string;

  /**
   * All buff IDs this user has collected (never removed — permanent ownership).
   * E.g. ["ATK-COMMON-01", "ECONOMY-MEDIUM-03", "DROPRATE-RARE-07"]
   */
  @Prop({ type: [String], default: [] })
  ownedBuffIds: string[];

  /**
   * Currently activated/equipped buff IDs (subset of ownedBuffIds).
   * Only active buffs apply their bonuses to gameplay.
   */
  @Prop({ type: [String], default: [] })
  activeBuffIds: string[];
}

export const UserBuffCollectionSchema =
  SchemaFactory.createForClass(UserBuffCollection);
