import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    syncUser(userData: any): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("./schemas/user.schema").User;
        error?: undefined;
    }>;
    monetagPostback(userid: string, eventType: string, reward: string, ymid: string, payout?: string): Promise<{
        status: string;
    }>;
    startMining(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("./schemas/user.schema").User;
        error?: undefined;
    }>;
    boostMining(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: import("./schemas/user.schema").User | null;
        error?: undefined;
    }>;
    claimMining(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        claimedAmount?: undefined;
    } | {
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
        error: string;
        success?: undefined;
        stats?: undefined;
    } | {
        success: boolean;
        stats: {
            referralBalance: any;
            totalReferrals: any;
            history: any;
        };
        error?: undefined;
    }>;
    claimReferral(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        claimedAmount?: undefined;
    } | {
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
        error: string;
        success?: undefined;
        user?: undefined;
        reward?: undefined;
    } | {
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
        error: string;
        success?: undefined;
        finalNum?: undefined;
        reward?: undefined;
    } | {
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
    claimCodeDrop(body: {
        telegramId: string;
        code: string;
    }): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        reward?: undefined;
    } | {
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
    claimVipRank(body: {
        telegramId: string;
        rankName: string;
    }): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        reward?: undefined;
    } | {
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
        error: string;
        success?: undefined;
        user?: undefined;
        reward?: undefined;
    } | {
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
    getBalance(id: string): Promise<{
        error: string;
        success?: undefined;
        balance?: undefined;
        cryptoBalances?: undefined;
        cwalletUid?: undefined;
        solanaAddress?: undefined;
        withdrawLimits?: undefined;
        lifetimeElixir?: undefined;
        totalReferrals?: undefined;
        lastFaucetRoll?: undefined;
    } | {
        success: boolean;
        balance: any;
        cryptoBalances: any;
        cwalletUid: any;
        solanaAddress: any;
        withdrawLimits: Record<string, number>;
        lifetimeElixir: any;
        totalReferrals: any;
        lastFaucetRoll: any;
        error?: undefined;
    }>;
    bindWallet(body: {
        telegramId: string;
        cwalletUid: string;
    }): Promise<{
        success: boolean;
        user: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    bindSolana(body: {
        telegramId: string;
        solanaAddress: string;
    }): Promise<{
        success: boolean;
        user: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    convertDust(body: {
        telegramId: string;
        coins: string[];
    }): Promise<{
        success: boolean;
        elixirGained: number;
        newElixirBalance: any;
        cryptoBalances: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    swapElixir(body: {
        telegramId: string;
        amount: number;
        targetCoin: string;
    }): Promise<{
        success: boolean;
        user: any;
        received: number;
        gross: number;
        spread: number;
        error?: undefined;
    } | {
        error: string;
    }>;
    executeHiLoBet(body: {
        telegramId: string;
        betAmount: any;
        multiplier: any;
        type: 'hi' | 'lo';
    }): Promise<{
        success: boolean;
        rolledNumber: number;
        isWin: boolean;
        profit: number;
        newBalance: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    getHiLoHistory(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        history?: undefined;
    } | {
        success: boolean;
        history: any;
        error?: undefined;
    }>;
}
