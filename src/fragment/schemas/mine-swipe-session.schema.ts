import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MineSwipeSessionDocument = MineSwipeSession & Document;

/**
 * Mine Swipe game session — minesweeper-style multi-step mini-game.
 *
 * Flow:
 *   1. User pays 100 mine-swipe fragments → server creates board
 *   2. User reveals tiles one by one via POST /fragment/mine-swipe/reveal
 *   3. Server checks if tile is a mine → if safe, add to revealed set
 *   4. User can claim at any time via POST /fragment/mine-swipe/claim
 *   5. Reward = base reward × number of safe tiles revealed
 *   6. If user hits a mine → game over, lose accumulated reward
 *
 * Board representation:
 *   - mines: array of "row,col" strings marking mine positions
 *   - revealed: array of "row,col" strings the user has revealed (all safe)
 *   - boardSize: NxN grid (default 5x5 = 25 tiles)
 *   - mineCount: number of mines (default 5)
 */
@Schema({ timestamps: true })
export class MineSwipeSession {
  @Prop({ required: true, index: true })
  telegramId: string;

  @Prop({ required: true, default: 5 })
  boardSize: number;

  @Prop({ required: true, default: 5 })
  mineCount: number;

  // Mine positions as "row,col" strings (server-authoritative, hidden from client)
  @Prop({ type: [String], required: true })
  mines: string[];

  // Safe tiles the user has revealed (all are guaranteed safe)
  @Prop({ type: [String], default: [] })
  revealed: string[];

  // Session status
  @Prop({ required: true, enum: ["active", "won", "lost", "claimed"], default: "active" })
  status: string;

  // Accumulated reward (increases with each safe reveal)
  @Prop({ type: Number, default: 0 })
  accumulatedReward: number;

  // Final reward (set when claimed or won)
  @Prop({ type: Number, default: null })
  finalReward: number | null;

  // Base reward per safe tile (scaled by stone tier that dropped the fragment)
  @Prop({ type: Number, required: true })
  rewardPerTile: number;

  // TTL: auto-expire active sessions after 30 minutes
  @Prop({ type: Date, required: true })
  expireAt: Date;
}

export const MineSwipeSessionSchema = SchemaFactory.createForClass(MineSwipeSession);

// Auto-delete expired sessions
MineSwipeSessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
// Fast lookup by user + active status
MineSwipeSessionSchema.index({ telegramId: 1, status: 1 });
