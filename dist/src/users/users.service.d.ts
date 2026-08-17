import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import { ReferralLogDocument } from "./schemas/referral-log.schema";
import { HiLoBetDocument } from "./schemas/hilo-bet.schema";
import { AchievementsService } from "../achievements/achievements.service";
import { AdminService } from "../admin/admin.service";
import { CircularCasinoService } from "../admin/circular-casino.service";
export declare const VIP_RANKS: {
    name: string;
    xp: number;
    reward: number;
    wdLimit: number;
    maxWdUsd: number;
    miningBoost: number;
}[];
export declare function getUserVipRank(exp: number): {
    name: string;
    xp: number;
    reward: number;
    wdLimit: number;
    maxWdUsd: number;
    miningBoost: number;
};
export declare class UsersService {
    private userModel;
    private referralLogModel;
    private hiloBetModel;
    private achievementsService;
    private adminService;
    private circularCasino;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, referralLogModel: Model<ReferralLogDocument>, hiloBetModel: Model<HiLoBetDocument>, achievementsService: AchievementsService, adminService: AdminService, circularCasino: CircularCasinoService);
    cleanupOldCodeDrops(): Promise<void>;
    notifyFullMining(): Promise<void>;
    syncTelegramUser(userData: any, referredBy?: string): Promise<User>;
    startMining(telegramId: string): Promise<{
        user: User | null;
        error?: string;
    }>;
    boostMining(telegramId: string): Promise<{
        user: User | null;
        error?: string;
    }>;
    claimMining(telegramId: string): Promise<{
        user: User | null;
        claimedAmount: number;
        error?: string;
    }>;
    findByTelegramId(telegramId: string): Promise<User | null>;
    findBySessionToken(token: string): Promise<UserDocument | null>;
    devLoginUsernamePassword(username: string, password: string): Promise<{
        error: string;
        success?: undefined;
        token?: undefined;
        tokenExpiresAt?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        token: any;
        tokenExpiresAt: any;
        user: {
            telegramId: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        error?: undefined;
    }>;
    debitElixir(telegramId: string, amount: number): Promise<boolean>;
    debitCrypto(telegramId: string, coin: string, amount: number): Promise<boolean>;
    creditCrypto(telegramId: string, coin: string, amount: number): Promise<boolean>;
    creditRewardAndLogTask(telegramId: string, reward: number, campaignId: string): Promise<boolean>;
    creditReferralBonus(uplineTelegramId: string, margin: number, downlineUsername: string, actionHash: string): Promise<boolean>;
    getReferralStats(telegramId: string): Promise<{
        referralBalance: any;
        totalReferrals: any;
        history: any;
    }>;
    claimReferralVault(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        claimedAmount?: undefined;
    } | {
        success: boolean;
        user: any;
        claimedAmount: any;
        error?: undefined;
    }>;
    claimDailyLogin(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        reward?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        reward: number;
        user: any;
        error?: undefined;
    }>;
    claimVipRank(telegramId: string, rankName: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        user: any;
        reward: number;
        error?: undefined;
    }>;
    registerMonetagTicket(telegramId: string, payoutUSD?: number): Promise<void>;
    claimFaucet(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        finalNum?: undefined;
        reward?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        finalNum: number;
        reward: number;
        user: any;
        error?: undefined;
    }>;
    claimCodeDrop(telegramId: string, code: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        user: any;
        reward: number;
        error?: undefined;
    }>;
    verifyTelegramChannel(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        reward?: undefined;
        user?: undefined;
        mock?: undefined;
    } | {
        success: boolean;
        reward: number;
        user: any;
        mock: boolean;
        error?: undefined;
    } | {
        success: boolean;
        reward: number;
        user: any;
        error?: undefined;
        mock?: undefined;
    }>;
    getBalance(telegramId: string): Promise<{
        elixirBalance: any;
        cryptoBalances: any;
        ownedPickaxes: any;
        cwalletUid: any;
        solanaAddress: any;
        withdrawLimits: Record<string, number>;
        lifetimeElixir: any;
        lastFaucetRoll: any;
        totalReferrals: any;
        exp: any;
        isBanned: boolean;
    }>;
    bindCwalletUid(telegramId: string, uid: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: any;
        error?: undefined;
    }>;
    bindSolanaAddress(telegramId: string, address: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: any;
        error?: undefined;
    }>;
    private priceCache;
    getLivePrice(geckoId: string): Promise<number | null>;
    swapTokens(telegramId: string, fromAmount: number, targetCoin: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        received?: undefined;
        gross?: undefined;
        spread?: undefined;
    } | {
        success: boolean;
        user: any;
        received: number;
        gross: number;
        spread: number;
        error?: undefined;
    }>;
    convertDustToElixir(telegramId: string, coinsToConvert: string[]): Promise<{
        error: string;
        success?: undefined;
        elixirGained?: undefined;
        newElixirBalance?: undefined;
        cryptoBalances?: undefined;
    } | {
        success: boolean;
        elixirGained: number;
        newElixirBalance: any;
        cryptoBalances: any;
        error?: undefined;
    }>;
    executeHiLoBet(telegramId: string, betAmount: number, multiplier: number, type: "hi" | "lo"): Promise<{
        error: string;
        success?: undefined;
        rolledNumber?: undefined;
        thresholdHI?: undefined;
        thresholdLO?: undefined;
        isWin?: undefined;
        profit?: undefined;
        newBalance?: undefined;
        vestingLocked?: undefined;
        vestingTurnoverRequired?: undefined;
        circularMeta?: undefined;
    } | {
        success: boolean;
        rolledNumber: number;
        thresholdHI: number;
        thresholdLO: number;
        isWin: boolean;
        profit: number;
        newBalance: any;
        vestingLocked: number;
        vestingTurnoverRequired: number;
        circularMeta: any;
        error?: undefined;
    } | {
        success: boolean;
        rolledNumber: number;
        thresholdHI: number;
        thresholdLO: number;
        isWin: boolean;
        profit: number;
        newBalance: any;
        error?: undefined;
        vestingLocked?: undefined;
        vestingTurnoverRequired?: undefined;
        circularMeta?: undefined;
    }>;
    getHiLoHistory(telegramId: string): Promise<any>;
    searchUserForAdmin(query: string): Promise<User | null>;
    updateUserBalanceAdmin(telegramId: string, elixirBalance?: number, cryptoBalances?: Record<string, number>): Promise<User | null>;
    setUserBanStatus(telegramId: string, isBanned: boolean): Promise<User | null>;
    getDashboardStatsAdmin(): Promise<{
        totalUsers: any;
        totalElixir: any;
        totalAdRevenueUSD: any;
        recentUsers: any;
    }>;
    getTopUsersPaginated(page?: number, perPage?: number): Promise<{
        users: any;
        page: number;
        perPage: number;
        totalUsers: any;
        hasMore: boolean;
        loadedCount: any;
    }>;
    lockUserForWithdrawal(telegramId: string): Promise<boolean>;
    unlockUserWithdrawal(telegramId: string): Promise<void>;
    addExp(telegramId: string, amount: number): Promise<void>;
}
