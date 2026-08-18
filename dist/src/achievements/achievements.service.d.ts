import { Model } from "mongoose";
import { AchievementDocument } from "./schemas/achievement.schema";
import { UsersService } from "../users/users.service";
export declare class AchievementsService {
    private achievementModel;
    private usersService;
    constructor(achievementModel: Model<AchievementDocument>, usersService: UsersService);
    getStats(telegramId: string): Promise<{
        current: number;
        claimed: boolean;
        id: number;
        title: string;
        reward: number;
        max: number;
    }[]>;
    incrementProgress(telegramId: string, achievementIds: number[], amount?: number): Promise<void>;
    setProgressMax(telegramId: string, achievementIds: number[]): Promise<void>;
    claimReward(telegramId: string, achievementId: number): Promise<{
        error: string;
        success?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        reward: number;
        error?: undefined;
    }>;
}
