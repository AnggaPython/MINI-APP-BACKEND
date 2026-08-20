import { BuffItemCollectionsService } from "./buff-item-collections.service";
import { BuffType } from "./schemas/buff-item.schema";
export declare class BuffItemCollectionsController {
    private readonly service;
    constructor(service: BuffItemCollectionsService);
    getAll(): Promise<{
        success: boolean;
        items: (import("./schemas/buff-item.schema").BuffItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            total: number;
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
        items: (import("./schemas/buff-item.schema").BuffItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
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
        ownedBuffIds: string[];
        activeBuffIds: string[];
        ownedItems: (import("./schemas/buff-item.schema").BuffItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        activeItems: (import("./schemas/buff-item.schema").BuffItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
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
        activeBuffIds: string[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    deactivate(telegramId: string, buffId: string): Promise<{
        success: boolean;
        activeBuffIds: string[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    activateAllByType(telegramId: string, type: string): Promise<{
        success: boolean;
        activated: number;
        activeBuffIds: string[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    grant(telegramId: string, buffId: string): Promise<{
        success: boolean;
        buffItem: import("./schemas/buff-item.schema").BuffItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    grantRandom(telegramId: string, preferredRarity?: string): Promise<{
        success: boolean;
        error: string;
        buffItem?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        buffItem: import("./schemas/buff-item.schema").BuffItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        granted: null;
        message: string;
    }>;
}
