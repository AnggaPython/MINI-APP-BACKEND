import { Model } from "mongoose";
import { MiningStoneDocument } from "./schemas/mining-stone.schema";
import { UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
export declare const ELIX_RATES: Record<string, number>;
export declare const PICKAXE_TIERS: readonly ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
export type PickaxeTier = (typeof PICKAXE_TIERS)[number];
export declare const PICKAXE_COSTS: Record<Exclude<PickaxeTier, "Common">, {
    GOLD: number;
    DIAMOND: number;
}>;
export declare class MinerStoneService {
    private miningStoneModel;
    private userModel;
    private readonly usersService;
    private readonly logger;
    private readonly lastSpawnAt;
    constructor(miningStoneModel: Model<MiningStoneDocument>, userModel: Model<UserDocument>, usersService: UsersService);
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
    purchasePickaxe(telegramId: string, tier: string): Promise<{
        success: boolean;
        error: string;
        tier?: undefined;
        ownedPickaxes?: undefined;
        balances?: undefined;
    } | {
        success: boolean;
        tier: string;
        ownedPickaxes: any;
        balances: {
            GOLD: any;
            DIAMOND: any;
        };
        error?: undefined;
    }>;
    repairPickaxe(telegramId: string, tier: string): Promise<{
        success: boolean;
        error: string;
        tier?: undefined;
        cost?: undefined;
        repairedAt?: undefined;
        balances?: undefined;
        ownedPickaxes?: undefined;
    } | {
        success: boolean;
        tier: string;
        cost: Record<string, number>;
        repairedAt: Date;
        balances: Record<string, number>;
        ownedPickaxes: any;
        error?: undefined;
    }>;
    destroy(telegramId: string, stoneId: string): Promise<{
        success: boolean;
        error: string;
        zonk?: undefined;
        stone?: undefined;
        rewards?: undefined;
    } | {
        success: boolean;
        zonk: boolean;
        stone: {
            stoneId: any;
            tier: any;
            maxHp: any;
        };
        rewards: Record<string, number>;
        error?: undefined;
    }>;
    claimRewards(telegramId: string, stoneId: string, action: string): Promise<{
        success: boolean;
        error: string;
        action?: undefined;
        stoneId?: undefined;
        credited?: undefined;
        elixir?: undefined;
        cryptoBalances?: undefined;
        elixirBalance?: undefined;
    } | {
        success: boolean;
        action: string;
        stoneId: any;
        credited: Record<string, number>;
        elixir: number;
        cryptoBalances: any;
        elixirBalance: any;
        error?: undefined;
    }>;
    history(telegramId: string): Promise<{
        success: boolean;
        history: any;
    }>;
}
