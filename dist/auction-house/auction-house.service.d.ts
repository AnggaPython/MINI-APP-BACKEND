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
    createListing(telegramId: string, price: number, itemCategory: "buff" | "material", instanceId?: string, baseItemId?: string, amount?: number): Promise<{
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
    }>;
    buyListing(telegramId: string, auctionId: string): Promise<{
        success: boolean;
        error: string;
        purchased?: undefined;
    } | {
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
    }>;
    cancelListing(telegramId: string, auctionId: string): Promise<{
        success: boolean;
        error: string;
        instanceId?: undefined;
        collateralDeposit?: undefined;
        penalty?: undefined;
        returnedDeposit?: undefined;
    } | {
        success: boolean;
        instanceId: any;
        collateralDeposit: any;
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
        listings: any;
        total: any;
        page: number;
        totalPages: number;
    }>;
    browseItemListings(baseItemId: string): Promise<{
        success: boolean;
        buffItem: any;
        listings: any;
    }>;
    myListings(telegramId: string): Promise<{
        success: boolean;
        listings: any;
    }>;
    getStats(): Promise<{
        success: boolean;
        stats: {
            totalActive: any;
            totalSold: any;
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
