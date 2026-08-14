import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ReferralLogDocument = ReferralLog & Document;

@Schema({ timestamps: true })
export class ReferralLog {
  @Prop({ required: true, index: true })
  uplineTelegramId: string;

  @Prop({ required: true })
  downlineUsername: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  actionHash: string;
}

export const ReferralLogSchema = SchemaFactory.createForClass(ReferralLog);
