import { OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import { AdminDocument } from "./schemas/admin.schema";
import { ProfitLogDocument } from "./schemas/profit-log.schema";
import { UserDocument } from "../users/schemas/user.schema";
export declare class AdminService implements OnModuleInit {
    private adminModel;
    private profitLogModel;
    private userModel;
    private _cgCache;
    private _cgInflight;
    constructor(adminModel: Model<AdminDocument>, profitLogModel: Model<ProfitLogDocument>, userModel: Model<UserDocument>);
    onModuleInit(): Promise<void>;
    authenticate(username: string, passwordString: string, ip?: string): Promise<{
        error: string;
        success?: undefined;
        token?: undefined;
        role?: undefined;
    } | {
        success: boolean;
        token: string;
        role: any;
        error?: undefined;
    }>;
    verifySessionToken(token: string): Promise<AdminDocument | null>;
    addProfit(coin: string, amount: number, source: string, telegramId: string): Promise<void>;
    fetchLivePricesUsd(): Promise<Record<string, number>>;
    private _bootstrapFeesTotalUsd;
    getProfitBalances(): Promise<{
        balances: Record<string, number>;
        totalProfitFeesAllCoinsUsd: number;
        profitFeeValueByCoin: {
            [k: string]: {
                amount: number;
                priceUsd: number;
                valueUsd: number;
            };
        };
        livePriceUsdByCoin: {
            [k: string]: number;
        };
        monetagSummary: {
            totalRevenueUSD: number;
            totalImpressions: number;
            averagePayoutPerImpressionUSD: number;
            lastSevenDaysRevenueUSD: number;
            dailyRunRateUSD: number;
            primaryMilestoneUsd: 100 | 500 | 250 | 1000;
            remainingUSD: number;
            progressPercent: number;
            estimatedImpressionsRemaining: number;
            estimatedDaysToPrimaryWithdraw: number | null;
            allMilestonesReached: boolean;
            currentMilestoneIndex: number;
            nextMilestone: {
                targetUSD: number;
                progressPercent: number;
                remainingUSD: number;
                estImpressionsRemaining: number;
            };
            milestonesRoadmap: {
                targetUSD: 100 | 500 | 250 | 1000;
                achieved: boolean;
                progressPercent: number;
                remainingUSD: number;
                estImpressionsRemaining: number;
            }[];
            extendedTargetIfAllReachedUsd: number;
            source: string;
            coin: string;
        };
    }>;
    getMonetagTopUsers(page?: number, perPage?: number): Promise<{
        users: Array<{
            telegramId: string;
            firstName: string;
            lastName?: string | null;
            username?: string | null;
            totalEarnedUsd: number;
            impressionCount: number;
            avgEarningsPerImpressionUsd: number;
            lastImpressionAt: Date | null;
        }>;
        totalUsers: number;
        hasMore: boolean;
        page: number;
        perPage: number;
        hardLimit: number;
    }>;
    getProfitLogsPaginated(coin?: string, page?: number, perPage?: number): Promise<{
        logs: ProfitLogDocument[];
        totalLogs: number;
        page: number;
        perPage: number;
        hasMore: boolean;
        hardLimit: number;
    }>;
    getProfitLogs(coin?: string): Promise<any[]>;
    getWithdrawLimits(): Promise<Record<string, number>>;
    getTreasuryElixirLiquidity(): Promise<number>;
    updateWithdrawLimit(coin: string, limit: number): Promise<Record<string, number>>;
}
