import { Model } from "mongoose";
import { MiningStoneDocument } from "./schemas/mining-stone.schema";
import { UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
import { LevelingService } from "../leveling-miner/leveling.service";
import { FragmentService } from "../fragment/fragment.service";
export declare const ELIX_RATES: Record<string, number>;
export declare const PICKAXE_TIERS: readonly ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
export type PickaxeTier = (typeof PICKAXE_TIERS)[number];
export declare class MinerStoneService {
    private miningStoneModel;
    private userModel;
    private readonly usersService;
    private readonly buffCollectionsService;
    private readonly levelingService;
    private readonly fragmentService;
    private readonly logger;
    private readonly lastSpawnAt;
    private readonly destroyTimestamps;
    constructor(miningStoneModel: Model<MiningStoneDocument>, userModel: Model<UserDocument>, usersService: UsersService, buffCollectionsService: BuffItemCollectionsService, levelingService: LevelingService, fragmentService: FragmentService);
    private evictRateLimit;
    private roll01;
    private round2;
    spawn(telegramId: string): Promise<{
        success: boolean;
        error: string;
        stone?: undefined;
    } | {
        success: boolean;
        stone: {
            stoneId: any;
            tier: any;
            maxHp: any;
            zonk: any;
        };
        error?: undefined;
    }>;
    rotate(telegramId: string): Promise<{
        success: boolean;
        stone: {
            stoneId: any;
            tier: any;
            maxHp: any;
            zonk: any;
        };
    } | {
        success: boolean;
        error: string;
    }>;
    private spawnFresh;
    repairPickaxe(telegramId: string, tier: string): Promise<{
        success: boolean;
        error: string;
        tier?: undefined;
        cost?: undefined;
        repairedAt?: undefined;
        balances?: undefined;
        durability?: undefined;
        ownedPickaxes?: undefined;
    } | {
        success: boolean;
        tier: string;
        cost: Record<string, number>;
        repairedAt: Date;
        balances: Record<string, number>;
        durability: number;
        ownedPickaxes: any;
        error?: undefined;
    }>;
    private durabilityMaxFor;
    getDurability(telegramId: string): Promise<{
        success: boolean;
        error: string;
        durability?: undefined;
    } | {
        success: boolean;
        durability: Record<string, number>;
        error?: undefined;
    }>;
    syncDurability(telegramId: string, durability: Record<string, number>): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    destroy(telegramId: string, stoneId: string): Promise<{
        success: boolean;
        error: string;
        zonk?: undefined;
        adRequired?: undefined;
        stone?: undefined;
        rewards?: undefined;
        starCount?: undefined;
        xpAwarded?: undefined;
        level?: undefined;
        levelUp?: undefined;
        newLevel?: undefined;
        pickaxeGrants?: undefined;
        pendingStars?: undefined;
        lockedLevel?: undefined;
        fragmentDrops?: undefined;
        levelMultiplier?: undefined;
    } | {
        success: boolean;
        zonk: boolean;
        adRequired: boolean;
        stone: {
            stoneId: any;
            tier: any;
            maxHp: any;
        };
        rewards: {};
        starCount: number;
        xpAwarded: number;
        level: number;
        levelUp: boolean;
        newLevel: number;
        pickaxeGrants: string[];
        pendingStars: number;
        lockedLevel: number | null;
        fragmentDrops: {
            spinWheel: number;
            mineSwipe: number;
        };
        error?: undefined;
        levelMultiplier?: undefined;
    } | {
        success: boolean;
        zonk: boolean;
        adRequired: boolean;
        stone: {
            stoneId: any;
            tier: any;
            maxHp: any;
        };
        rewards: Record<string, number>;
        starCount: number;
        xpAwarded: number;
        level: number;
        levelUp: boolean;
        newLevel: number;
        pickaxeGrants: string[];
        pendingStars: number;
        lockedLevel: number | null;
        levelMultiplier: number;
        fragmentDrops: {
            spinWheel: number;
            mineSwipe: number;
        };
        error?: undefined;
    }>;
    claimRewards(telegramId: string, stoneId: string, action: string, opts?: {
        autoRun?: boolean;
    }): Promise<{
        success: boolean;
        error: string;
        adRequired?: undefined;
        action?: undefined;
        stoneId?: undefined;
        credited?: undefined;
        elixir?: undefined;
        cryptoBalances?: undefined;
        elixcoinBalance?: undefined;
        economyMultiplier?: undefined;
    } | {
        success: boolean;
        adRequired: boolean;
        error: string;
        action?: undefined;
        stoneId?: undefined;
        credited?: undefined;
        elixir?: undefined;
        cryptoBalances?: undefined;
        elixcoinBalance?: undefined;
        economyMultiplier?: undefined;
    } | {
        success: boolean;
        action: string;
        stoneId: any;
        credited: Record<string, number>;
        elixir: number;
        cryptoBalances: Record<string, number>;
        elixcoinBalance: number;
        economyMultiplier: number | undefined;
        error?: undefined;
        adRequired?: undefined;
    }>;
    history(telegramId: string): Promise<{
        success: boolean;
        history: any;
    }>;
}
