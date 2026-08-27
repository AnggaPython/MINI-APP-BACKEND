import { OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import { MarketplaceItem, MarketplaceItemDocument } from "./schemas/marketplace-item.schema";
export declare class MarketplaceService implements OnModuleInit {
    private marketplaceModel;
    private readonly logger;
    constructor(marketplaceModel: Model<MarketplaceItemDocument>);
    onModuleInit(): Promise<void>;
    private seedMarketplace;
    getMarketplaceItems(filters?: {
        itemType?: string;
        rarity?: string;
        search?: string;
    }): Promise<{
        success: boolean;
        items: (MarketplaceItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        meta: {
            buffTypes: string[];
            rarities: string[];
            totalItems: number;
        };
    }>;
    getMarketplaceItem(itemId: string): Promise<{
        success: boolean;
        error: string;
        item?: undefined;
    } | {
        success: boolean;
        item: MarketplaceItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        error?: undefined;
    }>;
    getMarketplaceStats(): Promise<{
        success: boolean;
        totalItems: number;
        byRarity: any[];
        byType: any[];
    }>;
}
