import { OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import { BuffItemDocument, BuffType, BuffRarity } from "./schemas/buff-item.schema";
import { UserBuffCollectionDocument } from "./schemas/user-buff-collection.schema";
import { UserDocument } from "../users/schemas/user.schema";
export declare class BuffItemCollectionsService implements OnModuleInit {
    private buffItemModel;
    private userBuffModel;
    private userModel;
    private readonly logger;
    constructor(buffItemModel: Model<BuffItemDocument>, userBuffModel: Model<UserBuffCollectionDocument>, userModel: Model<UserDocument>);
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
        inventory: any;
        activeInstanceIds: any;
        ownedItems: any;
        activeItems: any;
        totals: Record<BuffType, number>;
    }>;
    grantBuffItem(telegramId: string, buffId: string): Promise<{
        success: boolean;
        error: string;
        buffItem?: undefined;
        instanceId?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        buffItem: any;
        instanceId: `${string}-${string}-${string}-${string}-${string}`;
        message: string;
        error?: undefined;
    }>;
    removeBuffItem(telegramId: string, buffId: string, count?: number): Promise<number>;
    countBuffInstances(telegramId: string, buffId: string): Promise<number>;
    grantMaterial(telegramId: string, displayName: string, amount?: number): Promise<void>;
    removeMaterial(telegramId: string, displayName: string, count?: number): Promise<number>;
    activateBuff(telegramId: string, buffId: string): Promise<{
        success: boolean;
        error: string;
        activeInstanceIds?: undefined;
    } | {
        success: boolean;
        activeInstanceIds: any;
        error?: undefined;
    }>;
    deactivateBuff(telegramId: string, buffId: string): Promise<{
        success: boolean;
        error: string;
        activeInstanceIds?: undefined;
    } | {
        success: boolean;
        activeInstanceIds: any;
        error?: undefined;
    }>;
    activateAllByType(telegramId: string, buffType: BuffType): Promise<{
        success: boolean;
        error: string;
        activated?: undefined;
        activeInstanceIds?: undefined;
    } | {
        success: boolean;
        activated: any;
        activeInstanceIds: any;
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
        instanceId?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        buffItem: any;
        instanceId: `${string}-${string}-${string}-${string}-${string}`;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        granted: null;
        message: string;
    }>;
}
