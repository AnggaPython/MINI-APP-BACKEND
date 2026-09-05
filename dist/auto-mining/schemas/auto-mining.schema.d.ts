import { Document } from "mongoose";
export declare class AutoMiningSub {
    telegramId: string;
    status: string;
    planDays: number;
    feePaid: number;
    claimMode: string;
    target: string;
    splitStonePct: number;
    startDate: Date;
    endDate: Date;
    dailyQuota: number;
    autopilotOn: boolean;
    lastRunAt: Date | null;
    totalRuns: number;
    totalElixirValue: number;
    favPickaxe: string | null;
    planBuffs: string[];
}
export type AutoMiningSubDocument = AutoMiningSub & Document;
export declare const AutoMiningSubSchema: any;
export declare class AutoMiningDay {
    telegramId: string;
    date: string;
    target: string;
    runs: number;
    skipped: number;
    earned: Record<string, number>;
    elixirValue: number;
}
export type AutoMiningDayDocument = AutoMiningDay & Document;
export declare const AutoMiningDaySchema: any;
