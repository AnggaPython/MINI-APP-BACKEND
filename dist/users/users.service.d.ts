import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ReferralLog, ReferralLogDocument } from './schemas/referral-log.schema';
import { AchievementsService } from '../achievements/achievements.service';
export declare class UsersService {
    private userModel;
    private referralLogModel;
    private achievementsService;
    constructor(userModel: Model<UserDocument>, referralLogModel: Model<ReferralLogDocument>, achievementsService: AchievementsService);
    syncTelegramUser(userData: any, referredBy?: string): Promise<User>;
    startMining(telegramId: string): Promise<User | null>;
    claimMining(telegramId: string): Promise<{
        user: User | null;
        claimedAmount: number;
        error?: string;
    }>;
    findByTelegramId(telegramId: string): Promise<User | null>;
    debitElixir(telegramId: string, amount: number): Promise<boolean>;
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
    }>;
}
