import { Model } from 'mongoose';
import { StakeDocument } from './schemas/stake.schema';
import { BankLogDocument } from './schemas/bank-log.schema';
import { UsersService } from '../users/users.service';
import { AchievementsService } from '../achievements/achievements.service';
import { AdminService } from '../admin/admin.service';
export declare class BankService {
    private stakeModel;
    private bankLogModel;
    private usersService;
    private achievementsService;
    private adminService;
    private readonly logger;
    constructor(stakeModel: Model<StakeDocument>, bankLogModel: Model<BankLogDocument>, usersService: UsersService, achievementsService: AchievementsService, adminService: AdminService);
    handleAutoClaim(): Promise<void>;
    calculateYield(stake: StakeDocument): number;
    getStats(telegramId: string): Promise<{
        activeStakes: any;
        history: any;
        totalUnclaimedEarning: number;
        totalLiquidityPool: any;
        networkStaked: any;
        personalStaked: any;
    }>;
    createStake(telegramId: string, amount: number, durationDays: number, rate: number, autoClaim?: boolean): Promise<{
        error: string;
        success?: undefined;
        stake?: undefined;
    } | {
        success: boolean;
        stake: any;
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
    toggleStakeConfig(telegramId: string, stakeId: string, autoClaim: boolean, autoReinvest: boolean): Promise<{
        error: string;
        success?: undefined;
        stake?: undefined;
    } | {
        success: boolean;
        stake: any;
        error?: undefined;
    }>;
}
