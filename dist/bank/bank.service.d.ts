import { Model } from 'mongoose';
import { Stake, StakeDocument } from './schemas/stake.schema';
import { BankLog, BankLogDocument } from './schemas/bank-log.schema';
import { UsersService } from '../users/users.service';
import { AchievementsService } from '../achievements/achievements.service';
export declare class BankService {
    private stakeModel;
    private bankLogModel;
    private usersService;
    private achievementsService;
    private readonly logger;
    constructor(stakeModel: Model<StakeDocument>, bankLogModel: Model<BankLogDocument>, usersService: UsersService, achievementsService: AchievementsService);
    handleAutoClaim(): Promise<void>;
    calculateYield(stake: StakeDocument): number;
    getStats(telegramId: string): Promise<{
        activeStakes: {
            id: import("mongoose").Types.ObjectId;
            amount: number;
            aprLabel: string;
            rate: number;
            stakeDate: Date;
            maturityDate: Date;
            pendingYield: number;
            autoClaim: boolean;
        }[];
        history: (import("mongoose").Document<unknown, {}, BankLogDocument, {}, import("mongoose").DefaultSchemaOptions> & BankLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        totalUnclaimedEarning: number;
        totalLiquidityPool: any;
        networkStaked: any;
        personalStaked: number;
    }>;
    createStake(telegramId: string, amount: number, durationDays: number, rate: number, autoClaim?: boolean): Promise<{
        error: string;
        success?: undefined;
        stake?: undefined;
    } | {
        success: boolean;
        stake: import("mongoose").Document<unknown, {}, StakeDocument, {}, import("mongoose").DefaultSchemaOptions> & Stake & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    }>;
    claimEarnings(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        claimedAmount?: undefined;
    } | {
        success: boolean;
        claimedAmount: number;
        error?: undefined;
    }>;
    unstake(telegramId: string, stakeId: string): Promise<{
        error: string;
        success?: undefined;
        returnAmount?: undefined;
        penaltyMatured?: undefined;
    } | {
        success: boolean;
        returnAmount: number;
        penaltyMatured: boolean;
        error?: undefined;
    }>;
    toggleAutoClaim(telegramId: string, autoClaim: boolean): Promise<{
        success: boolean;
        autoClaim: boolean;
    }>;
}
