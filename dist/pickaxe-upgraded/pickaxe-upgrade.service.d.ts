import { Model } from "mongoose";
import { UserDocument } from "../users/schemas/user.schema";
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
export declare function getUpgradeStats(tier: PickaxeTier, upgradeLevel: number): PickaxeBaseStats;
export declare function getTotalUpgradeCost(tier: PickaxeTier, targetLevel: number): Record<string, number>;
export declare function getMaterialToolsNeeded(tier: PickaxeTier, targetLevel: number): number;
export declare class PickaxeUpgradeService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    getUpgradeStatus(telegramId: string): Promise<{
        success: boolean;
        error: string;
        upgrades?: undefined;
        materialCounts?: undefined;
    } | {
        success: boolean;
        upgrades: Record<string, Record<string, unknown>>;
        materialCounts: {
            common: number;
            medium: number;
            rare: number;
        };
        error?: undefined;
    }>;
    upgradePickaxe(telegramId: string, tier: string): Promise<{
        success: boolean;
        error: string;
        tier?: undefined;
        newLevel?: undefined;
        stats?: undefined;
        costUsed?: undefined;
    } | {
        success: boolean;
        tier: string;
        newLevel: number;
        stats: PickaxeBaseStats;
        costUsed: {
            [x: string]: any;
        };
        error?: undefined;
    }>;
}
export {};
