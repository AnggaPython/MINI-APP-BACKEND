import { AuctionHouseService } from "./auction-house.service";
export declare class AuctionHouseController {
    private readonly auctionService;
    constructor(auctionService: AuctionHouseService);
    createListing(telegramId: string, body: {
        buffId: string;
        price: number;
    }): Promise<{
        success: boolean;
        collateralDeposit: number;
        listingDurationDays: number;
        auction: {
            id: any;
            buffId: string;
            buffType: any;
            rarity: any;
            price: number;
            tax: number;
            netAmount: number;
            sellerName: any;
            listedAt: any;
            expiresAt: any;
            collateralDeposit: number;
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
            buffId: any;
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
        buffId: any;
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
