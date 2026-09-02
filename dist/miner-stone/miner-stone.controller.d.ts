import { MinerStoneService } from "./miner-stone.service";
export declare class MinerStoneController {
    private readonly minerStoneService;
    constructor(minerStoneService: MinerStoneService);
    spawn(telegramId: string): Promise<{
        success: boolean;
        stone: {
            stoneId: string;
            tier: import("./schemas/mining-stone.schema").StoneTier;
            maxHp: number;
            zonk: boolean;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    history(telegramId: string): Promise<{
        success: boolean;
        history: {
            stoneId: string;
            tier: import("./schemas/mining-stone.schema").StoneTier;
            maxHp: number;
            rewards: Record<string, number>;
            claimedAt: Date | null;
        }[];
    } | {
        success: boolean;
        error: string;
    }>;
    repairPickaxe(telegramId: string, body: {
        tier?: string;
    }): Promise<{
        success: boolean;
        tier: string;
        cost: Record<string, number>;
        repairedAt: Date;
        balances: Record<string, number>;
        ownedPickaxes: string[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    destroy(telegramId: string, body: {
        stoneId?: string;
    }): Promise<{
        success: boolean;
        zonk: boolean;
        adRequired: boolean;
        stone: {
            stoneId: string;
            tier: import("./schemas/mining-stone.schema").StoneTier;
            maxHp: number;
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
            stoneId: string;
            tier: import("./schemas/mining-stone.schema").StoneTier;
            maxHp: number;
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
    } | {
        success: boolean;
        error: string;
    }>;
    claim(telegramId: string, body: {
        stoneId?: string;
        action?: string;
    }): Promise<{
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
        stoneId: string;
        credited: Record<string, number>;
        elixir: number;
        cryptoBalances: Record<string, number>;
        elixcoinBalance: number;
        economyMultiplier: number | undefined;
        error?: undefined;
        adRequired?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
}
