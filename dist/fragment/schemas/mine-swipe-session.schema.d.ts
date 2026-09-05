import { Document } from "mongoose";
export type MineSwipeSessionDocument = MineSwipeSession & Document;
export declare class MineSwipeSession {
    telegramId: string;
    boardSize: number;
    mineCount: number;
    mines: string[];
    revealed: string[];
    status: string;
    accumulatedReward: number;
    finalReward: number | null;
    rewardPerTile: number;
    expireAt: Date;
}
export declare const MineSwipeSessionSchema: any;
