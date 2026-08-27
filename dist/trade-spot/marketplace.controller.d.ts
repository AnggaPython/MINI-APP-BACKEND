import { MarketplaceService } from "./marketplace.service";
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    getItems(type?: string, rarity?: string, search?: string): Promise<{
        success: boolean;
        items: (import("./schemas/marketplace-item.schema").MarketplaceItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getItem(itemId: string): Promise<{
        success: boolean;
        error: string;
        item?: undefined;
    } | {
        success: boolean;
        item: import("./schemas/marketplace-item.schema").MarketplaceItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        error?: undefined;
    }>;
    getStats(): Promise<{
        success: boolean;
        totalItems: number;
        byRarity: any[];
        byType: any[];
    }>;
}
