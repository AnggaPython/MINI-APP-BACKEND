import { Document } from "mongoose";
export type CaseBoxDocument = CaseBox & Document;
export type CaseTier = "COMMON" | "MEDIUM" | "RARE";
export type BuffRarity = "COMMON" | "MEDIUM" | "RARE" | "ULTRA_RARE";
export type CaseOutcome = "ZONK" | "ELIXCOIN" | "MATERIAL" | "BUFF";
export declare class CaseBox {
    telegramId: string;
    tier: CaseTier;
    maxHp: number;
    status: string;
    outcome: CaseOutcome | null;
    lootRarity: CaseTier | null;
    lootName: string | null;
    loot: Record<string, number> | null;
    openedAt: Date | null;
    claimedAt: Date | null;
    expireAt: Date;
}
export declare const CaseBoxSchema: any;
