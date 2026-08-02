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
    startMining(telegramId: string): Promise<{
        error: string;
        success?: undefined;
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
            referralBalance: number;
            totalReferrals: number;
            history: (import("mongoose").Document<unknown, {}, import("./schemas/referral-log.schema").ReferralLogDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/referral-log.schema").ReferralLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            } & {
                id: string;
            })[];
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
    getBalance(id: string): Promise<{
        error: string;
        success?: undefined;
        balance?: undefined;
    } | {
        success: boolean;
        balance: number;
        error?: undefined;
    }>;
}
