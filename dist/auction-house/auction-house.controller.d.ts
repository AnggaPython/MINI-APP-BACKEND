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
            sellerName: any;
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
            instanceId: any;
            baseItemId: any;
            buffType: any;
            rarity: any;
            price: any;
            tax: any;
            seller: any;
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
        instanceId: any;
        collateralDeposit: any;
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
        buffItem: any;
        listings: any;
    } | {
        success: boolean;
        error: string;
    }>;
    myListings(telegramId: string): Promise<{
        success: boolean;
        listings: any;
    } | {
        success: boolean;
        error: string;
    }>;
    getStats(telegramId: string): Promise<{
        success: boolean;
        stats: {
            totalActive: any;
            totalSold: any;
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
