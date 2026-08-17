import { MinerStoneService } from "./miner-stone.service";
export declare class MinerStoneController {
    private readonly minerStoneService;
    constructor(minerStoneService: MinerStoneService);
    spawn(telegramId: string): Promise<{
        success: boolean;
        stone: {
            stoneId: any;
            tier: any;
            maxHp: any;
            zonk: any;
        };
        error?: undefined;
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
        action: string;
        stoneId: any;
        credited: Record<string, number>;
        elixir: number;
        cryptoBalances: any;
        elixirBalance: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
}
