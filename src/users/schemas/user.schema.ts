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

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ default: false })
  isWithdrawing: boolean;

  @Prop({ default: 0 })
  exp: number;

  @Prop({ type: [String], default: [] })
  claimedVipRanks: string[];

  @Prop({ type: Object, default: {} })
  cryptoBalances: Record<string, number>;

  @Prop({ default: 0 })
  elixirBalance: number;

  @Prop({ default: 0 })
  lifetimeElixir: number;

  @Prop({ default: null })
  miningStartDate: Date;

  @Prop({ default: false })
  isMiningBoosted: boolean;

  @Prop({ default: false })
  isMiningNotified: boolean;

  @Prop({ default: null })
  lastFaucetRoll: Date;

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

  @Prop({ default: 0 })
  adTickets: number;

  @Prop({ default: 0 })
  totalAdRevenueGeneratedUSD: number;

  @Prop({ type: [String], default: [] })
  claimedCodeDrops: string[];

  @Prop({ default: null })
  miningVoucherExpiry: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Database CPU Load Optimizations for high-frequency queries
UserSchema.index({ miningStartDate: 1, isMiningNotified: 1 }); // Cron Mining Engine (Zero CPU)
UserSchema.index({ claimedCodeDrops: 1 }); // Cron System Garbage Collector Matrix
UserSchema.index({ elixirBalance: -1 }); // Dashboard Leaderboard Fetch Limits
UserSchema.index({ referredBy: 1 }); // Upline Referral Counting Metrics
