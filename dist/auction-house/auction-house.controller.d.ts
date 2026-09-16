import { AuctionHouseService } from "./auction-house.service";
export declare class AuctionHouseController {
    private readonly auctionService;
    constructor(auctionService: AuctionHouseService);
    createListing(telegramId: string, body: {
        instanceId?: string;
        baseItemId?: string;
        itemCategory: "buff" | "material";
        amount?: number;
        price: number;
    }): Promise<{
        success: boolean;
        collateralDeposit: number;
        listingDurationDays: number;
        auction: {
            id: any;
            itemCategory: "buff" | "material";
            instanceId: string | undefined;
            baseItemId: string | undefined;
            amount: number;
            buffType: string;
            rarity: string;
            price: number;
            tax: number;
            netAmount: number;
            sellerName: string;
            listedAt: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    buyListing(telegramId: string, body: {
        auctionId: string;
    }): Promise<{
        success: boolean;
        purchased: {
            instanceId: string | undefined;
            baseItemId: string;
            buffType: string;
            rarity: string;
            price: number;
            tax: number;
            seller: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    cancelListing(telegramId: string, body: {
        auctionId: string;
    }): Promise<{
        success: boolean;
        instanceId: string | undefined;
        collateralDeposit: number;
        penalty: number;
        returnedDeposit: number;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    browse(telegramId: string, query: {
        search?: string;
        buffType?: string;
        rarity?: string;
        sort?: string;
        page?: string;
        limit?: string;
    }): Promise<{
        success: boolean;
        listings: any;
        total: any;
        page: number;
        totalPages: number;
    } | {
        success: boolean;
        error: string;
    }>;
    browseItem(telegramId: string, baseItemId: string): Promise<{
        success: boolean;
        buffItem: (import("../buff-item-collections/schemas/buff-item.schema").BuffItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
        listings: {
            id: string;
            instanceId: string | undefined;
            baseItemId: string;
            sellerId: string;
            sellerName: string;
            price: number;
            tax: number;
            netAmount: number;
            listedAt: Date;
            expiresAt: Date;
        }[];
    } | {
        success: boolean;
        error: string;
    }>;
    myListings(telegramId: string): Promise<{
        success: boolean;
        listings: {
            id: string;
            instanceId: string | undefined;
            baseItemId: string;
            buffType: string;
            rarity: string;
            price: number;
            tax: number;
            netAmount: number;
            status: import("./schemas/auction.schema").AuctionStatus;
            sellerName: string;
            buyerId: string | null;
            listedAt: Date;
            expiresAt: Date;
            resolvedAt: Date;
            collateralDeposit: number;
            collateralReturned: boolean;
            name: string;
            description: string;
            icon: string;
            buffValue: number;
            buffUnit: "flat" | "percent";
        }[];
    } | {
        success: boolean;
        error: string;
    }>;
    getStats(telegramId: string): Promise<{
        success: boolean;
        stats: {
            totalActive: number;
            totalSold: number;
            totalVolume: any;
            totalTaxCollected: any;
            avgByRarity: any;
            minPriceTable: Record<import("../buff-item-collections/schemas/buff-item.schema").BuffType, Record<import("../buff-item-collections/schemas/buff-item.schema").BuffRarity, number>>;
            collateralDeposit: number;
            collateralPenaltyRate: number;
            listingDurationDays: number;
        };
    } | {
        success: boolean;
        error: string;
    }>;
}
