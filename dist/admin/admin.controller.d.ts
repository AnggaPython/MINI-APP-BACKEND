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
    login(body: Record<string, string>, req: Record<string, unknown>): Promise<{
        success: boolean;
        token: string;
        role: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    getFeed(): Promise<{
        totalUsers: any;
        totalElixir: any;
        totalAdRevenueUSD: any;
        recentUsers: any;
        success: boolean;
    }>;
    getTopUsers(page?: string, limit?: string): Promise<{
        users: any;
        page: number;
        perPage: number;
        totalUsers: any;
        hasMore: boolean;
        loadedCount: any;
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
        logs: any[];
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
        treasury: unknown;
        circularPool: unknown;
        burned: unknown;
        taxThisCycle: unknown;
        params: unknown;
        liveImpactLog: unknown;
        dailySnapshots30D: unknown;
        monthlyBook: unknown;
        topWhales: Record<string, unknown>[];
    }>;
    getTopWhales(): Promise<{
        success: boolean;
        whales: Record<string, unknown>[];
    }>;
    updateBaseCasinoParams(body: Record<string, unknown>): Promise<{
        error: string;
        success?: undefined;
        params?: undefined;
        treasury?: undefined;
        circularPool?: undefined;
    } | {
        success: boolean;
        params: unknown;
        treasury: unknown;
        circularPool: unknown;
        error?: undefined;
    }>;
    closeCurrentCycle(): Promise<{
        success: boolean;
        monthlyBook: unknown;
        treasury: unknown;
    }>;
    getTradeSpotBot(): Promise<{
        pair: string;
        enabled: boolean;
        intervalMinutes: number;
        tradesPerCycle: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        success: boolean;
        botRunCount: number;
        botTrades: any;
        userTrades: any;
        totalTrades: any;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        quoteReserve: number;
        baseReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    updateTradeSpotBot(body: {
        pair?: string;
        enabled?: boolean;
        intervalMinutes?: number;
        tradesPerCycle?: number;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        pair: string;
        enabled: boolean;
        intervalMinutes: number;
        tradesPerCycle: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        botRunCount: number;
        botTrades: any;
        userTrades: any;
        totalTrades: any;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        quoteReserve: number;
        baseReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
        error?: undefined;
    }>;
    runTradeSpotBotNow(body: {
        pair?: string;
    }): Promise<{
        runNow: {
            ran: boolean;
            count: number;
        };
        pair: string;
        enabled: boolean;
        intervalMinutes: number;
        tradesPerCycle: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        success: boolean;
        botRunCount: number;
        botTrades: any;
        userTrades: any;
        totalTrades: any;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        quoteReserve: number;
        baseReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    getBotSchedules(): Promise<{
        success: boolean;
        schedules: Record<string, {
            hourWindowStart: number;
            tradesDone: number;
            tradesTotal: number;
            nextExecutions: number[];
        }>;
    }>;
    getAllPools(): Promise<{
        success: boolean;
        pools: import("../trade-spot/schemas/pool.schema").LiquidityPool[];
    }>;
    setPriceControl(body: {
        pair: string;
        bidFloor: number;
        askCeiling: number;
    }): Promise<Record<string, unknown>>;
    clearPriceControl(body: {
        pair: string;
    }): Promise<Record<string, unknown>>;
    setWalls(body: {
        pair: string;
        sellWalls?: {
            price: number;
            amount: number;
        }[];
        buyWalls?: {
            price: number;
            amount: number;
        }[];
    }): Promise<Record<string, unknown>>;
    clearWalls(body: {
        pair: string;
    }): Promise<Record<string, unknown>>;
}
