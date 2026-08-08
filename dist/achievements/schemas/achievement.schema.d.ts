import { Document } from 'mongoose';
export type AchievementDocument = Achievement & Document;
export declare class Achievement {
    telegramId: string;
    achievementId: number;
    progress: number;
    claimed: boolean;
}
export declare const AchievementSchema: any;
