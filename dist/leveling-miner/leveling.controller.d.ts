import { LevelingService } from "./leveling.service";
export declare class LevelingController {
    private readonly levelingService;
    constructor(levelingService: LevelingService);
    getMyLevel(telegramId: string): Promise<{
        success: boolean;
        level: any;
        exp: any;
        xpForNextLevel: number;
        xpInLevel: number;
        progress: number;
        maxLevel: number;
        totalXp: number;
        currentBenefit: import("./leveling.service").LevelBenefit;
        multiplier: number;
        nextMultiplier: number;
        pendingStars: any;
        lockedLevel: any;
        milestoneRequirement: import("./leveling.service").MilestoneRequirement | null;
        materialCheck: {
            enough: boolean;
            missing: Record<string, number>;
        } | null;
        materialCounts: {
            common: number;
            medium: number;
            rare: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    getBenefits(): Promise<{
        success: boolean;
        benefits: import("./leveling.service").LevelBenefit[];
        maxLevel: number;
        totalXp: number;
    }>;
    craftLevel(telegramId: string): Promise<{
        success: boolean;
        error?: string;
        newLevel?: number;
        materialsUsed?: Record<string, number>;
    }>;
}
