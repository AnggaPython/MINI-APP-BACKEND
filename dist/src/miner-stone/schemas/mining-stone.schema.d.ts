import { Document } from "mongoose";
export type MiningStoneDocument = MiningStone & Document;
export type StoneTier = "Common" | "Medium" | "Rare";
export declare class MiningStone {
    telegramId: string;
    tier: StoneTier;
    maxHp: number;
    zonk: boolean;
    status: string;
    rewards: Record<string, number> | null;
    claimAction: string | null;
    claimedAt: Date | null;
    finalizedAt: Date | null;
    expireAt: Date;
}
export declare const MiningStoneSchema: any;
