import { Document } from 'mongoose';
export type MonthlyBookCycleDocument = MonthlyBookCycle & Document;
export declare class MonthlyBookCycle {
    cycleId: string;
    startDate: Date;
    endDate?: Date | null;
    isActive: boolean;
    startAdminTreasury: number;
    endAdminTreasury?: number | null;
    totalTaxCollected: number;
    totalBurned: number;
    totalWithdrawalFees: number;
    totalAdsRevenueElixirEquivalent: number;
    totalBets: number;
    totalBetsVolume: number;
    refillModeTriggeredCount: number;
    dailySeries: Array<{
        dayIndex: number;
        dateKey: string;
        adminTreasury: number;
        taxCollected: number;
        betsVolume: number;
    }>;
    netProfitPercent?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const MonthlyBookCycleSchema: any;
