import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserBuffCollectionDocument = UserBuffCollection & Document;

/**
 * Tracks a user's buff-item collection using an instance-based model.
 *
 *  - `inventory`:          All unique item instances the user has obtained.
 *  - `activeInstanceIds`:  Subset of instanceIds that are currently equipped/activated.
 *
 * Only active instances contribute to gameplay bonuses. Users can toggle instances
 * on/off freely — activation is instant and free.
 */

@Schema({ _id: false })
export class ItemInstance {
  @Prop({ required: true, index: true })
  instanceId: string;

  @Prop({ required: true })
  baseItemId: string;

  @Prop({ default: Date.now })
  acquiredAt: Date;
}
export const ItemInstanceSchema = SchemaFactory.createForClass(ItemInstance);
@Schema({ timestamps: true, collection: "user_buff_collections" })
export class UserBuffCollection {
  @Prop({ required: true, unique: true, index: true })
  telegramId: string;

  /**
   * All item instances this user has collected. Contains unique UUIDs.
   * E.g. [{ instanceId: "idx1", baseItemId: "ATK-COMMON-01", ... }]
   */
  @Prop({ type: [ItemInstanceSchema], default: [] })
  inventory: ItemInstance[];

  /**
   * Currently activated/equipped instance IDs (subset of inventory instanceIds).
   * Only active instances apply their bonuses to gameplay.
   */
  @Prop({ type: [String], default: [] })
  activeInstanceIds: string[];
}

export const UserBuffCollectionSchema =
  SchemaFactory.createForClass(UserBuffCollection);
