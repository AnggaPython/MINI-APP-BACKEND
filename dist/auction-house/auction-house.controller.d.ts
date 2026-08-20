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
            id: string;
            buffId: string;
            buffType: import("../buff-item-collections/schemas/buff-item.schema").BuffType;
            rarity: import("../buff-item-collections/schemas/buff-item.schema").BuffRarity;
            price: number;
            tax: number;
            netAmount: number;
            sellerName: string;
            listedAt: Date;
            expiresAt: Date;
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
            buffId: string;
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
        buffId: string;
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
        listings: {
            id: string;
            buffId: string;
            buffType: string;
            rarity: string;
            price: number;
            tax: number;
            netAmount: number;
            sellerId: string;
            sellerName: string;
            listedAt: Date;
            expiresAt: Date;
            collateralDeposit: number;
            name: string;
            description: string;
            icon: string;
            buffValue: number;
            buffUnit: "flat" | "percent";
        }[];
        total: number;
        page: number;
        totalPages: number;
    } | {
        success: boolean;
        error: string;
    }>;
    myListings(telegramId: string): Promise<{
        success: boolean;
        listings: {
            id: string;
            buffId: string;
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
