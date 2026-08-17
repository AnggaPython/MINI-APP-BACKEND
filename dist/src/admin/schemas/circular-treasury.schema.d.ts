import { Document } from "mongoose";
export type CircularTreasuryDocument = CircularTreasury & Document;
export declare class CircularTreasury {
    key: string;
    adminTreasuryElixir: number;
    circularLossPoolElixir: number;
    burnedTotalElixir: number;
    adminTreasuryStartCycle: number;
    totalTaxCollectedThisCycle: number;
    isRefillMode: boolean;
    refillTriggerCountThisCycle: number;
    paramAdminTreasuryStart: number;
    paramRefillTriggerBelow: number;
    paramRefillStopAbove: number;
    paramAdminTaxNormal: number;
    paramAdminTaxRefill: number;
    paramCircularShareNormal: number;
    paramCircularShareRefill: number;
    paramBurnRate: number;
    paramMaxAdminPayoutPercentPerBet: number;
    paramWhaleBetThresholdElixir: number;
    paramWhalePatternNormalTargetLoss: number;
    paramWhalePatternRefillTargetLoss: number;
    liveImpactLog: Array<{
        betId: string;
        telegramId: string;
        betAmount: number;
        isWhale: boolean;
        isWin: boolean;
        circularPoolDelta: number;
        adminTreasuryDelta: number;
        burnedDelta: number;
        timestamp: number;
    }>;
    dailySnapshots30D: Array<{
        dateYYYYMMDD: string;
        adminTreasuryElixir: number;
        circularLossPool: number;
        burnedToday: number;
        taxCollectedToday: number;
        betsToday: number;
    }>;
    lastDailySnapshot?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const CircularTreasurySchema: any;
