import { AchievementsService } from './achievements.service';
export declare class AchievementsController {
    private readonly achievementsService;
    constructor(achievementsService: AchievementsService);
    getStats(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        stats?: undefined;
    } | {
        success: boolean;
        stats: {
            current: number;
            claimed: boolean;
            id: number;
            title: string;
            reward: number;
            max: number;
        }[];
        error?: undefined;
    }>;
    claimReward(body: {
        telegramId: string;
        achievementId: number;
    }): Promise<{
        success: boolean;
        reward: number;
        error?: undefined;
    } | {
        error: string;
    }>;
}
