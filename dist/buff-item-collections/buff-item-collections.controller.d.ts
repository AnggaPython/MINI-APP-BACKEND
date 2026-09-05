import { BuffItemCollectionsService } from "./buff-item-collections.service";
import { BuffType } from "./schemas/buff-item.schema";
export declare class BuffItemCollectionsController {
    private readonly service;
    constructor(service: BuffItemCollectionsService);
    getAll(): Promise<{
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
            buffValues: Record<import("./schemas/buff-item.schema").BuffRarity, number[]>;
        };
    }>;
    getByType(type: string): Promise<{
        success: boolean;
        items: any;
        meta: {
            label: string;
            description: string;
            unit: "flat" | "percent";
            icon: string;
        };
    } | {
        success: boolean;
        error: string;
    }>;
    getMyCollection(telegramId: string): Promise<{
        success: boolean;
        inventory: any;
        activeInstanceIds: any;
        ownedItems: any;
        activeItems: any;
        totals: Record<BuffType, number>;
    } | {
        success: boolean;
        error: string;
    }>;
    getMyTotals(telegramId: string): Promise<{
        success: boolean;
        totals: {
            ATK: number;
            ECONOMY: number;
            DURABILITY: number;
            DROPRATE: number;
        };
    } | {
        success: boolean;
        error: string;
    }>;
    activate(telegramId: string, buffId: string): Promise<{
        success: boolean;
        activeInstanceIds: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    deactivate(telegramId: string, buffId: string): Promise<{
        success: boolean;
        activeInstanceIds: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    activateAllByType(telegramId: string, type: string): Promise<{
        success: boolean;
        activated: any;
        activeInstanceIds: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    grant(telegramId: string, buffId: string): Promise<{
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
    grantRandom(telegramId: string, preferredRarity?: string): Promise<{
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
