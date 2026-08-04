import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  telegramId: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  username: string;

  @Prop()
  photoUrl: string;

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ type: Object, default: {} })
  cryptoBalances: Record<string, number>;

  @Prop({ default: 0 })
  elixirBalance: number;

  @Prop({ default: null })
  miningStartDate: Date;

  @Prop({ type: [String], default: [] })
  completedTasks: string[];

  @Prop({ default: null })
  referredBy: string;

  @Prop({ default: 0 })
  referralBalance: number;

  @Prop({ default: null })
  lastDailyLogin: Date;

  @Prop({ default: false })
  joinedTelegram: boolean;

  @Prop({ default: null })
  cwalletUid: string;

  @Prop({ default: null })
  solanaAddress: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
