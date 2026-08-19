import { MinerStoneService } from "./miner-stone.service";
export declare class MinerStoneController {
    private readonly minerStoneService;
    constructor(minerStoneService: MinerStoneService);
    spawn(telegramId: string): Promise<{
        success: boolean;
        error: string;
        cooldownLeft: number;
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
        cooldownLeft?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    history(telegramId: string): Promise<{
        success: boolean;
        history: any;
    } | {
        success: boolean;
        error: string;
    }>;
    purchasePickaxe(telegramId: string, body: {
        tier?: string;
    }): Promise<{
        success: boolean;
        tier: string;
        ownedPickaxes: any;
        balances: {
            GOLD: any;
            DIAMOND: any;
        };
        error?: undefined;
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
        ownedPickaxes: any;
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
            stoneId: any;
            tier: any;
            maxHp: any;
        };
        rewards: Record<string, number>;
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
        stoneId: any;
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
