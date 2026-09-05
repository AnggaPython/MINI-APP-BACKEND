import { Model } from "mongoose";
import { CaseBoxDocument, CaseTier, CaseOutcome } from "./schemas/case-box.schema";
import { UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
import { LevelingService } from "../leveling-miner/leveling.service";
export declare const CASE_TIER_WEIGHTS: Record<CaseTier, number>;
export declare const OUTCOME_WEIGHTS: Record<CaseOutcome, number>;
export declare const LOOT_RARITY_WEIGHTS: Record<CaseTier, number>;
export declare const BUFF_RARITY_WEIGHTS: Record<string, number>;
export declare const ELIXCOIN_BANDS: Record<CaseTier, [number, number]>;
export declare const MATERIAL_AMOUNTS: Record<CaseTier, [number, number]>;
export declare const CASE_HP_BANDS: Record<CaseTier, [number, number]>;
export declare const CASE_DURABILITY_COST = 3;
export declare const CASE_MATERIALS: Record<CaseTier, string[]>;
export declare class CaseBoxService {
    private readonly caseBoxModel;
    private readonly userModel;
    private readonly usersService;
    private readonly buffCollectionsService;
    private readonly levelingService;
    private readonly lastSpawnAt;
    private readonly destroyTimestamps;
    private readonly lastClaimAt;
    constructor(caseBoxModel: Model<CaseBoxDocument>, userModel: Model<UserDocument>, usersService: UsersService, buffCollectionsService: BuffItemCollectionsService, levelingService: LevelingService);
    private evictRateLimit;
    private getCooldownLeft;
    private roll01;
    private weightedPick;
    spawn(telegramId: string): Promise<{
        success: boolean;
        error: string;
        cooldownLeft?: undefined;
        durabilityCost?: undefined;
        box?: undefined;
    } | {
        success: boolean;
        error: string;
        cooldownLeft: number;
        durabilityCost?: undefined;
        box?: undefined;
    } | {
        success: boolean;
        durabilityCost: number;
        box: {
            caseId: any;
            tier: any;
            maxHp: any;
        };
        error?: undefined;
        cooldownLeft?: undefined;
    }>;
    getStatus(telegramId: string, caseId: string): Promise<{
        success: boolean;
        exists: boolean;
        status: null;
        tier?: undefined;
        maxHp?: undefined;
    } | {
        success: boolean;
        exists: boolean;
        status: any;
        tier: any;
        maxHp: any;
    }>;
    destroy(telegramId: string, caseId: string): Promise<{
        success: boolean;
        error: string;
        caseId?: undefined;
        tier?: undefined;
        outcome?: undefined;
        rarity?: undefined;
        loot?: undefined;
        buffGranted?: undefined;
        economyMultiplier?: undefined;
        droprateBonus?: undefined;
        starCount?: undefined;
        xpAwarded?: undefined;
        level?: undefined;
        levelUp?: undefined;
        newLevel?: undefined;
        pickaxeGrants?: undefined;
        pendingStars?: undefined;
        lockedLevel?: undefined;
        levelMultiplier?: undefined;
    } | {
        success: boolean;
        caseId: any;
        tier: any;
        outcome: CaseOutcome;
        rarity: CaseTier | null;
        loot: Record<string, number> | null;
        buffGranted: unknown;
        economyMultiplier: number | undefined;
        droprateBonus: number | undefined;
        starCount: number;
        xpAwarded: number;
        level: number;
        levelUp: boolean;
        newLevel: number;
        pickaxeGrants: string[];
        pendingStars: number;
        lockedLevel: number | null;
        levelMultiplier: number;
        error?: undefined;
    }>;
    claimCase(caseId: string, telegramId: string, opts?: {
        autoRun?: boolean;
    }): Promise<{
        success: boolean;
        error: string;
        adRequired?: undefined;
    } | {
        success: boolean;
        adRequired: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
        adRequired?: undefined;
    }>;
    history(telegramId: string): Promise<{
        success: boolean;
        history: any;
    }>;
}
