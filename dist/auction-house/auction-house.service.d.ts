import { Model } from "mongoose";
import { AuctionDocument } from "./schemas/auction.schema";
import { UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import { BuffItemDocument, BuffType, BuffRarity } from "../buff-item-collections/schemas/buff-item.schema";
import { UserBuffCollectionDocument } from "../buff-item-collections/schemas/user-buff-collection.schema";
declare const COLLATERAL_DEPOSIT = 10000;
declare const LISTING_DURATION_MS: number;
declare const MIN_PRICE_TABLE: Record<BuffType, Record<BuffRarity, number>>;
export { MIN_PRICE_TABLE, COLLATERAL_DEPOSIT, LISTING_DURATION_MS };
export declare class AuctionHouseService {
    private auctionModel;
    private userModel;
    private buffItemModel;
    private userBuffModel;
    private readonly usersService;
    private readonly logger;
    constructor(auctionModel: Model<AuctionDocument>, userModel: Model<UserDocument>, buffItemModel: Model<BuffItemDocument>, userBuffModel: Model<UserBuffCollectionDocument>, usersService: UsersService);
    createListing(telegramId: string, buffId: string, price: number): Promise<{
        success: boolean;
        error: string;
        collateralDeposit?: undefined;
        listingDurationDays?: undefined;
        auction?: undefined;
    } | {
        success: boolean;
        collateralDeposit: number;
        listingDurationDays: number;
        auction: {
            id: string;
            buffId: string;
            buffType: BuffType;
            rarity: BuffRarity;
            price: number;
            tax: number;
            netAmount: number;
            sellerName: string;
            listedAt: Date;
            expiresAt: Date;
            collateralDeposit: number;
        };
        error?: undefined;
    }>;
    buyListing(telegramId: string, auctionId: string): Promise<{
        success: boolean;
        error: string;
        purchased?: undefined;
    } | {
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
    }>;
    cancelListing(telegramId: string, auctionId: string): Promise<{
        success: boolean;
        error: string;
        buffId?: undefined;
        collateralDeposit?: undefined;
        penalty?: undefined;
        returnedDeposit?: undefined;
    } | {
        success: boolean;
        buffId: string;
        collateralDeposit: number;
        penalty: number;
        returnedDeposit: number;
        error?: undefined;
    }>;
    expireOldListings(): Promise<number>;
    browse(params: {
        search?: string;
        buffType?: string;
        rarity?: string;
        sort?: string;
        page?: number;
        limit?: number;
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
    }>;
    getStats(): Promise<{
        success: boolean;
        stats: {
            totalActive: number;
            totalSold: number;
            totalVolume: any;
            totalTaxCollected: any;
            avgByRarity: any;
            minPriceTable: Record<BuffType, Record<BuffRarity, number>>;
            collateralDeposit: number;
            collateralPenaltyRate: number;
            listingDurationDays: number;
        };
    }>;
}
