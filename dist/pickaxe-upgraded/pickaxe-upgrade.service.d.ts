import { Model } from "mongoose";
import { UserDocument } from "../users/schemas/user.schema";
import { LevelingService } from "../leveling-miner/leveling.service";
export type PickaxeTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";
export declare const MAX_UPGRADE_LEVEL = 20;
interface PickaxeBaseStats {
    power: number;
    maxDurability: number;
}
export declare const PICKAXE_BASE_STATS: Record<PickaxeTier, PickaxeBaseStats>;
interface PickaxeUpgradePerLevel {
    powerPerLevel: number;
    durabilityPerLevel: number;
}
export declare const PICKAXE_UPGRADE_PER_LEVEL: Record<PickaxeTier, PickaxeUpgradePerLevel>;
export interface UpgradeCost {
    IRON?: number;
    COPPER?: number;
    SILVER?: number;
    GOLD?: number;
    DIAMOND?: number;
    materialRarity: "COMMON" | "MEDIUM" | "RARE";
}
export declare const PICKAXE_UPGRADE_COST: Record<PickaxeTier, UpgradeCost>;
export declare const SKIN_MILESTONES: number[];
export declare function skinIdFor(tier: string, level: number): string;
export declare function getUpgradeStats(tier: PickaxeTier, upgradeLevel: number): PickaxeBaseStats;
export declare function getTotalUpgradeCost(tier: PickaxeTier, targetLevel: number): Record<string, number>;
export declare function getMaterialToolsNeeded(tier: PickaxeTier, targetLevel: number): number;
export declare class PickaxeUpgradeService {
    private userModel;
    private levelingService;
    constructor(userModel: Model<UserDocument>, levelingService: LevelingService);
    getUpgradeStatus(telegramId: string): Promise<{
        success: boolean;
        error: string;
        upgrades?: undefined;
        materialCounts?: undefined;
        unlockedPickaxeSkins?: undefined;
        activePickaxeSkins?: undefined;
    } | {
        success: boolean;
        upgrades: Record<string, Record<string, unknown>>;
        materialCounts: {
            common: number;
            medium: number;
            rare: number;
        };
        unlockedPickaxeSkins: string[];
        activePickaxeSkins: Record<string, string>;
        error?: undefined;
    }>;
    upgradePickaxe(telegramId: string, tier: string): Promise<{
        success: boolean;
        error: string;
        tier?: undefined;
        newLevel?: undefined;
        stats?: undefined;
        costUsed?: undefined;
        pickaxeGrants?: undefined;
        skinUnlocked?: undefined;
    } | {
        success: boolean;
        tier: string;
        newLevel: number;
        stats: PickaxeBaseStats;
        costUsed: {
            [x: string]: any;
        };
        pickaxeGrants: string[];
        skinUnlocked: string | null;
        error?: undefined;
    }>;
    setActiveSkin(telegramId: string, tier: string, skin: string): Promise<{
        success: boolean;
        error: string;
        tier?: undefined;
        skin?: undefined;
    } | {
        success: boolean;
        tier: string;
        skin: string;
        error?: undefined;
    }>;
}
export {};
