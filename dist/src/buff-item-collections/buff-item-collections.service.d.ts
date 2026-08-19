import { OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import { BuffItemDocument, BuffType, BuffRarity } from "./schemas/buff-item.schema";
import { UserBuffCollectionDocument } from "./schemas/user-buff-collection.schema";
export declare class BuffItemCollectionsService implements OnModuleInit {
    private buffItemModel;
    private userBuffModel;
    private readonly logger;
    constructor(buffItemModel: Model<BuffItemDocument>, userBuffModel: Model<UserBuffCollectionDocument>);
    onModuleInit(): Promise<void>;
    private seedBuffItems;
    getAllBuffItems(): Promise<{
        success: boolean;
        items: any;
        meta: {
            total: any;
            buffTypes: string[];
            rarities: string[];
            buffTypeMeta: Record<BuffType, {
                label: string;
                description: string;
                unit: "flat" | "percent";
                icon: string;
            }>;
            buffValues: Record<BuffRarity, number[]>;
        };
    }>;
    getBuffItemsByType(buffType: BuffType): Promise<{
        success: boolean;
        items: any;
        meta: {
            label: string;
            description: string;
            unit: "flat" | "percent";
            icon: string;
        };
    }>;
    getBuffItem(buffId: string): Promise<{
        success: boolean;
        error: string;
        item?: undefined;
    } | {
        success: boolean;
        item: any;
        error?: undefined;
    }>;
    getUserCollection(telegramId: string): Promise<{
        success: boolean;
        ownedBuffIds: any;
        activeBuffIds: any;
        ownedItems: any;
        activeItems: any;
        totals: Record<BuffType, number>;
    }>;
    grantBuffItem(telegramId: string, buffId: string): Promise<{
        success: boolean;
        error: string;
        buffItem?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        buffItem: any;
        message: string;
        error?: undefined;
    }>;
    activateBuff(telegramId: string, buffId: string): Promise<{
        success: boolean;
        error: string;
        activeBuffIds?: undefined;
    } | {
        success: boolean;
        activeBuffIds: any;
        error?: undefined;
    }>;
    deactivateBuff(telegramId: string, buffId: string): Promise<{
        success: boolean;
        error: string;
        activeBuffIds?: undefined;
    } | {
        success: boolean;
        activeBuffIds: any;
        error?: undefined;
    }>;
    activateAllByType(telegramId: string, buffType: BuffType): Promise<{
        success: boolean;
        error: string;
        activated?: undefined;
        activeBuffIds?: undefined;
    } | {
        success: boolean;
        activated: any;
        activeBuffIds: any;
        error?: undefined;
    }>;
    calculateBuffTotals(activeItems: any[]): Record<BuffType, number>;
    getUserBuffTotals(telegramId: string): Promise<{
        success: boolean;
        totals: {
            ATK: number;
            ECONOMY: number;
            DURABILITY: number;
            DROPRATE: number;
        };
    }>;
    static readonly BUFF_RARITY_WEIGHTS: Record<BuffRarity, number>;
    static readonly BUFF_TYPE_WEIGHTS: Record<BuffType, number>;
    grantRandomBuff(telegramId: string, preferredRarity?: BuffRarity): Promise<{
        success: boolean;
        error: string;
        buffItem?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        buffItem: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        granted: null;
        message: string;
    }>;
}
