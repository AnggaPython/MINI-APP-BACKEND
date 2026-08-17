import { UsersService } from "./users.service";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    syncUser(userData: any, telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: import("./schemas/user.schema").User;
        error?: undefined;
    }>;
    monetagPostback(userid?: string, eventLegacy?: string, rewardLegacy?: string, payoutLegacy?: string, ymid?: string, eventType?: string, rewardEventType?: string, estimatedPrice?: string, telegramId?: string): Promise<{
        status: string;
        reason: string;
        user?: undefined;
        payout?: undefined;
    } | {
        status: string;
        user: string;
        payout: number;
        reason?: undefined;
    }>;
    devPublicLogin(username: string, password: string): Promise<{
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
    startMining(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: import("./schemas/user.schema").User | null;
        error?: undefined;
    }>;
    boostMining(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: import("./schemas/user.schema").User | null;
        error?: undefined;
    }>;
    claimMining(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        claimedAmount?: undefined;
    } | {
        success: boolean;
        user: import("./schemas/user.schema").User | null;
        claimedAmount: number;
        error?: undefined;
    }>;
    getReferralStats(telegramId: string): Promise<{
        success: boolean;
        stats: {
            referralBalance: any;
            totalReferrals: any;
            history: any;
        };
    }>;
    claimReferral(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        claimedAmount?: undefined;
    } | {
        success: boolean;
        user: any;
        claimedAmount: any;
        error?: undefined;
    }>;
    claimDaily(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        user: any;
        reward: number | undefined;
        error?: undefined;
    }>;
    claimFaucet(telegramId: string): Promise<{
        success: boolean;
        error: string;
        finalNum?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        finalNum: number | undefined;
        reward: number | undefined;
        error?: undefined;
    }>;
    claimCodeDrop(telegramId: string, code: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        user: any;
        reward: number | undefined;
        error?: undefined;
    }>;
    claimVipRank(telegramId: string, rankName: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        user: any;
        reward: number | undefined;
        error?: undefined;
    }>;
    verifyTelegram(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        user: any;
        reward: number | undefined;
        error?: undefined;
    }>;
    getBalance(telegramId: string): Promise<{
        success: boolean;
        balance: any;
        cryptoBalances: any;
        ownedPickaxes: any;
        cwalletUid: any;
        solanaAddress: any;
        withdrawLimits: Record<string, number>;
        lifetimeElixir: any;
        totalReferrals: any;
        lastFaucetRoll: any;
        exp: any;
        isBanned: boolean;
    }>;
    bindWallet(telegramId: string, cwalletUid: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    bindSolana(telegramId: string, solanaAddress: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    convertDust(telegramId: string, coins: string[]): Promise<{
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
    } | {
        success: boolean;
        error: string;
    }>;
    swapElixir(telegramId: string, amount: number, targetCoin: string): Promise<{
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
    } | {
        success: boolean;
        error: string;
    }>;
    executeHiLoBet(telegramId: string, betAmount: any, multiplier: any, type: "hi" | "lo"): Promise<{
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
    } | {
        success: boolean;
        error: string;
    }>;
    getHiLoHistory(telegramId: string): Promise<{
        success: boolean;
        history: any;
    }>;
}
