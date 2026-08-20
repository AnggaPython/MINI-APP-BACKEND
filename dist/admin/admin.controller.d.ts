import { AdminService } from "./admin.service";
import { CircularCasinoService } from "./circular-casino.service";
import { UsersService } from "../users/users.service";
import { TradeSpotService } from "../trade-spot/trade-spot.service";
import { MarketMakerService } from "../trade-spot/market-maker.service";
export declare class AdminController {
    private readonly adminService;
    private readonly usersService;
    private readonly circularCasino;
    private readonly tradeSpotService;
    private readonly marketMakerService;
    constructor(adminService: AdminService, usersService: UsersService, circularCasino: CircularCasinoService, tradeSpotService: TradeSpotService, marketMakerService: MarketMakerService);
    login(body: any, req: any): Promise<{
        success: boolean;
        token: string;
        role: string;
        error?: undefined;
    } | {
        error: string;
    }>;
    getFeed(): Promise<{
        totalUsers: number;
        totalElixir: number;
        totalAdRevenueUSD: number;
        recentUsers: (import("../users/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        success: boolean;
    }>;
    getTopUsers(page?: string, limit?: string): Promise<{
        users: (import("../users/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        page: number;
        perPage: number;
        totalUsers: number;
        hasMore: boolean;
        loadedCount: number;
        success: boolean;
    }>;
    getProfitBalances(): Promise<{
        success: boolean;
        profitBalances: Record<string, number>;
        monetagSummary: {
            totalRevenueUSD: number;
            totalImpressions: number;
            averagePayoutPerImpressionUSD: number;
            lastSevenDaysRevenueUSD: number;
            dailyRunRateUSD: number;
            primaryMilestoneUsd: 100 | 250 | 500 | 1000;
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
                targetUSD: 100 | 250 | 500 | 1000;
                achieved: boolean;
                progressPercent: number;
                remainingUSD: number;
                estImpressionsRemaining: number;
            }[];
            extendedTargetIfAllReachedUsd: number;
            source: string;
            coin: string;
        };
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
    }>;
    getMonetagTopUsers(page?: string, limit?: string): Promise<{
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
        success: boolean;
    }>;
    getProfitLogs(coin: string, page?: string, limit?: string): Promise<{
        success: boolean;
        logs: import("./schemas/profit-log.schema").ProfitLogDocument[];
        pagination: {
            page: number;
            perPage: number;
            totalLogs: number;
            hasMore: boolean;
            hardLimit: number;
        };
    }>;
    getWithdrawLimits(): Promise<{
        success: boolean;
        withdrawLimits: Record<string, number>;
    }>;
    updateWithdrawLimit(body: {
        coin: string;
        limit: number;
    }): Promise<{
        error: string;
        success?: undefined;
        withdrawLimits?: undefined;
    } | {
        success: boolean;
        withdrawLimits: Record<string, number>;
        error?: undefined;
    }>;
    searchUser(query: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("../users/schemas/user.schema").User;
        error?: undefined;
    }>;
    updateUserBalance(body: {
        telegramId: string;
        elixirBalance?: number;
        cryptoBalances?: Record<string, number>;
    }): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("../users/schemas/user.schema").User;
        error?: undefined;
    }>;
    banUser(body: {
        telegramId: string;
        isBanned: boolean;
    }): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("../users/schemas/user.schema").User;
        error?: undefined;
    }>;
    getBaseCasinoStats(): Promise<{
        success: boolean;
        treasury: any;
        circularPool: any;
        burned: any;
        taxThisCycle: any;
        params: any;
        liveImpactLog: any;
        dailySnapshots30D: any;
        monthlyBook: any;
        topWhales: any[];
    }>;
    getTopWhales(): Promise<{
        success: boolean;
        whales: any[];
    }>;
    updateBaseCasinoParams(body: Record<string, any>): Promise<{
        error: string;
        success?: undefined;
        params?: undefined;
        treasury?: undefined;
        circularPool?: undefined;
    } | {
        success: boolean;
        params: any;
        treasury: any;
        circularPool: any;
        error?: undefined;
    }>;
    closeCurrentCycle(): Promise<{
        success: boolean;
        monthlyBook: any;
        treasury: any;
    }>;
    getTradeSpotBot(): Promise<{
        enabled: boolean;
        intervalMinutes: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        success: boolean;
        botRunCount: number;
        botTrades: number;
        userTrades: number;
        totalTrades: number;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        elixirReserve: number;
        elixcoinReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    updateTradeSpotBot(body: {
        enabled?: boolean;
        intervalMinutes?: number;
    }): Promise<{
        enabled: boolean;
        intervalMinutes: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        success: boolean;
        botRunCount: number;
        botTrades: number;
        userTrades: number;
        totalTrades: number;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        elixirReserve: number;
        elixcoinReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    } | {
        success: boolean;
        error: string;
    }>;
    runTradeSpotBotNow(): Promise<{
        runNow: {
            ran: boolean;
            count: number;
        };
        enabled: boolean;
        intervalMinutes: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        success: boolean;
        botRunCount: number;
        botTrades: number;
        userTrades: number;
        totalTrades: number;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        elixirReserve: number;
        elixcoinReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
}
