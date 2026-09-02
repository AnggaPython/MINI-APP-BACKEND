import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

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
  exp: number; // LEGACY: dual-use for VIP + game — use vipExp/gameExp going forward

  @Prop({ default: 0 })
  vipExp: number; // VIP Rank XP (VIP_RANKS)

  @Prop({ default: 0 })
  gameExp: number; // Game Level XP (level 1-100)

  @Prop({ default: 1 })
  level: number;

  // ── Profile XP (separate from game XP) ─────────────────────────────────
  // Awarded 1 XP per stone destroy / medium+rare case box.
  // Used for account-level progression (not game rewards).
  @Prop({ default: 0 })
  profileXp: number;

  @Prop({ default: 1 })
  profileLevel: number;

  // ── Leveling material system ──────────────────────────────────────────
  // Stars held when level is locked (pending material craft)
  @Prop({ default: 0 })
  pendingStars: number;

  // Level that requires material craft to unlock (null = no locked level)
  @Prop({ type: Number, default: null })
  lockedLevel: number | null;

  // Material tools inventory: { "Rusty Nail": 3, "Steel Alloy": 1, ... }
  @Prop({ type: Object, default: {} })
  materials: Record<string, number>;

  // Pickaxe upgrade levels: { "Common": 5, "Uncommon": 0, ... }
  @Prop({ type: Object, default: {} })
  pickaxeUpgrades: Record<string, number>;

  @Prop({ type: [String], default: [] })
  claimedVipRanks: string[];

  @Prop({ type: Object, default: {} })
  cryptoBalances: Record<string, number>;

  // Server-authoritative pickaxe ownership — Common is granted to every new user
  @Prop({ type: [String], default: ["Common"] })
  ownedPickaxes: string[];

  // Server-side audit trail of paid repairs: tier -> { count, lastRepairAt }
  @Prop({ type: Object, default: {} })
  pickaxeRepairs: Record<string, { count: number; lastRepairAt: Date }>;

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

  // Dev-mode username-password session auth + future native login support
  @Prop({ type: String, default: null })
  authPasswordHash: string | null;

  @Prop({ type: String, default: null })
  sessionToken: string | null;

  @Prop({ type: Date, default: null })
  tokenExpiresAt: Date | null;

  // ── Fragment system (miner-stone mini-games) ─────────────────────────
  // Fragments drop randomly when destroying stones. Collect 100 to play:
  //   spin-wheel  → lucky wheel spin (stateless, instant reward)
  //   mine-swipe  → minesweeper-style multi-step game
  @Prop({ default: 0 })
  spinWheelFragments: number;

  @Prop({ default: 0 })
  mineSwipeFragments: number;

  // ── Holding balances (escrow) ─────────────────────────────────────────
  // Mini-game winnings go here first. User must explicitly "claim" to
  // transfer into cryptoBalances (tradeable resources). This creates a
  // satisfying cash-out moment and prevents instant abuse.
  //
  // spinWheels  → GOLD rewards from Spin Wheel
  // mineSwipe   → ELIXCOIN rewards from Mine Swipe
  @Prop({ type: Object, default: { spinWheels: 0, mineSwipe: 0 } })
  goldBalance: { spinWheels: number; mineSwipe: number };
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ sessionToken: 1 }, { sparse: true });
UserSchema.index({ isBanned: 1, telegramId: 1 });


// Database CPU Load Optimizations for high-frequency queries
UserSchema.index({ miningStartDate: 1, isMiningNotified: 1 }); // Cron Mining Engine (Zero CPU)
UserSchema.index({ claimedCodeDrops: 1 }); // Cron System Garbage Collector Matrix
UserSchema.index({ elixirBalance: -1 }); // Dashboard Leaderboard Fetch Limits
UserSchema.index({ referredBy: 1 }); // Upline Referral Counting Metrics
