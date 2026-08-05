import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ReferralLog, ReferralLogDocument } from './schemas/referral-log.schema';
import { HiLoBet, HiLoBetDocument } from './schemas/hilo-bet.schema';
import { AchievementsService } from '../achievements/achievements.service';
import { AdminService } from '../admin/admin.service';
export declare class UsersService {
    private userModel;
    private referralLogModel;
    private hiloBetModel;
    private achievementsService;
    private adminService;
    constructor(userModel: Model<UserDocument>, referralLogModel: Model<ReferralLogDocument>, hiloBetModel: Model<HiLoBetDocument>, achievementsService: AchievementsService, adminService: AdminService);
    syncTelegramUser(userData: any, referredBy?: string): Promise<User>;
    startMining(telegramId: string): Promise<User | null>;
    claimMining(telegramId: string): Promise<{
        user: User | null;
        claimedAmount: number;
        error?: string;
    }>;
    findByTelegramId(telegramId: string): Promise<User | null>;
    debitElixir(telegramId: string, amount: number): Promise<boolean>;
    debitCrypto(telegramId: string, coin: string, amount: number): Promise<boolean>;
    creditCrypto(telegramId: string, coin: string, amount: number): Promise<boolean>;
    creditRewardAndLogTask(telegramId: string, reward: number, campaignId: string): Promise<boolean>;
    creditReferralBonus(uplineTelegramId: string, margin: number, downlineUsername: string, actionHash: string): Promise<boolean>;
    getReferralStats(telegramId: string): Promise<{
        referralBalance: number;
        totalReferrals: number;
        history: (import("mongoose").Document<unknown, {}, ReferralLogDocument, {}, import("mongoose").DefaultSchemaOptions> & ReferralLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
    }>;
    claimReferralVault(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        claimedAmount?: undefined;
    } | {
        success: boolean;
        user: import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        claimedAmount: number;
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
        user: import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
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
        user: import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        mock: boolean;
        error?: undefined;
    } | {
        success: boolean;
        reward: number;
        user: import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
        mock?: undefined;
    }>;
    getBalance(telegramId: string): Promise<{
        elixirBalance: number;
        cryptoBalances: Record<string, number>;
        cwalletUid: string | null;
        solanaAddress: string | null;
    }>;
    bindCwalletUid(telegramId: string, uid: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: (import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        error?: undefined;
    }>;
    bindSolanaAddress(telegramId: string, address: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: (import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        error?: undefined;
    }>;
    swapTokens(telegramId: string, fromAmount: number, targetCoin: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
        received?: undefined;
        gross?: undefined;
        spread?: undefined;
    } | {
        success: boolean;
        user: import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }>;
    executeHiLoBet(telegramId: string, betAmount: number, multiplier: number, type: 'hi' | 'lo'): Promise<{
        error: string;
        success?: undefined;
        rolledNumber?: undefined;
        isWin?: undefined;
        profit?: undefined;
        newBalance?: undefined;
    } | {
        success: boolean;
        rolledNumber: number;
        isWin: boolean;
        profit: number;
        newBalance: number;
        error?: undefined;
    }>;
    getHiLoHistory(telegramId: string): Promise<(import("mongoose").Document<unknown, {}, HiLoBetDocument, {}, import("mongoose").DefaultSchemaOptions> & HiLoBet & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    searchUserForAdmin(query: string): Promise<User | null>;
    updateUserBalanceAdmin(telegramId: string, elixirBalance?: number, cryptoBalances?: Record<string, number>): Promise<User | null>;
    setUserBanStatus(telegramId: string, isBanned: boolean): Promise<User | null>;
    getDashboardStatsAdmin(): Promise<{
        totalUsers: number;
        totalElixir: number;
        recentUsers: (import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
    }>;
}
