import { Model } from "mongoose";
import { UserDocument } from "../users/schemas/user.schema";
export declare const getLevelMultiplier: (level: number) => number;
export declare const getHpMultiplier: (level: number) => number;
export declare const xpRequiredForLevel: (level: number) => number;
export interface MilestoneRequirement {
    level: number;
    common: number;
    medium: number;
    rare: number;
}
export declare const isMilestoneLevel: (level: number) => boolean;
export declare const getMilestoneRequirement: (level: number) => MilestoneRequirement | null;
export declare const hasEnoughMaterials: (userMaterials: Record<string, number>, requirement: MilestoneRequirement) => {
    enough: boolean;
    missing: Record<string, number>;
};
export declare const STAR_XP_PER_TIER: Record<string, number>;
export interface LevelBenefit {
    level: number;
    title: string;
    description: string;
    pickaxeGrant?: string;
}
export declare const LEVEL_BENEFITS: LevelBenefit[];
export declare class LevelingService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    getUserLevel(telegramId: string): Promise<{
        success: boolean;
        error: string;
        level?: undefined;
        exp?: undefined;
        xpForNextLevel?: undefined;
        xpInLevel?: undefined;
        progress?: undefined;
        maxLevel?: undefined;
        totalXp?: undefined;
        currentBenefit?: undefined;
        multiplier?: undefined;
        nextMultiplier?: undefined;
        pendingStars?: undefined;
        lockedLevel?: undefined;
        milestoneRequirement?: undefined;
        materialCheck?: undefined;
        materialCounts?: undefined;
    } | {
        success: boolean;
        level: number;
        exp: number;
        xpForNextLevel: number;
        xpInLevel: number;
        progress: number;
        maxLevel: number;
        totalXp: number;
        currentBenefit: LevelBenefit;
        multiplier: number;
        nextMultiplier: number;
        pendingStars: number;
        lockedLevel: number | null;
        milestoneRequirement: MilestoneRequirement | null;
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
    }>;
    getLevelBenefits(): Promise<{
        success: boolean;
        benefits: LevelBenefit[];
        maxLevel: number;
        totalXp: number;
    }>;
    private grantPickaxesOnLevelUp;
    awardStoneXp(telegramId: string, tier: string): Promise<{
        starCount: number;
        xpAwarded: number;
        level: number;
        levelUp: boolean;
        newLevel: number;
        pickaxeGrants: string[];
        pendingStars: number;
        lockedLevel: number | null;
    }>;
    awardCaseXp(telegramId: string, tier: string): Promise<{
        starCount: number;
        xpAwarded: number;
        level: number;
        levelUp: boolean;
        newLevel: number;
        pickaxeGrants: string[];
        pendingStars: number;
        lockedLevel: number | null;
    }>;
    craftLevel(telegramId: string): Promise<{
        success: boolean;
        error?: string;
        newLevel?: number;
        materialsUsed?: Record<string, number>;
    }>;
}
