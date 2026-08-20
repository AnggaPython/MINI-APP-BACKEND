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
        token: string;
        tokenExpiresAt: string;
        user: {
            telegramId: string;
            firstName: string;
            lastName: string;
            username: string;
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
            referralBalance: number;
            totalReferrals: number;
            history: (import("./schemas/referral-log.schema").ReferralLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            })[];
        };
    }>;
    claimReferral(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        claimedAmount?: undefined;
    } | {
        success: boolean;
        user: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | undefined;
        claimedAmount: number | undefined;
        error?: undefined;
    }>;
    claimDaily(telegramId: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        user: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | undefined;
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
        user: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | undefined;
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
        user: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | undefined;
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
        user: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | undefined;
        reward: number | undefined;
        error?: undefined;
    }>;
    getBalance(telegramId: string): Promise<{
        success: boolean;
        balance: number;
        cryptoBalances: Record<string, number>;
        ownedPickaxes: string[];
        cwalletUid: string | null;
        solanaAddress: string | null;
        withdrawLimits: Record<string, number>;
        lifetimeElixir: number;
        totalReferrals: number;
        lastFaucetRoll: Date | null;
        exp: number;
        isBanned: boolean;
    }>;
    bindWallet(telegramId: string, cwalletUid: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
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
        user: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
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
        newElixirBalance: number;
        cryptoBalances: Record<string, number>;
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
        user: import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
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
        newBalance: number;
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
        newBalance: number;
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
        history: (import("./schemas/hilo-bet.schema").HiLoBet & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
}
