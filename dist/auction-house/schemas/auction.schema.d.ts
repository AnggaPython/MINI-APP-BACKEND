import { Document } from "mongoose";
export type AuctionDocument = Auction & Document;
export type AuctionStatus = "active" | "sold" | "cancelled";
export declare class Auction {
    sellerId: string;
    sellerName: string;
    itemCategory: string;
    instanceId?: string;
    baseItemId: string;
    amount: number;
    buffType: string;
    rarity: string;
    price: number;
    tax: number;
    netAmount: number;
    status: AuctionStatus;
    listedAt: Date;
    expiresAt: Date;
    collateralDeposit: number;
    collateralReturned: boolean;
    resolvedAt: Date;
    buyerId: string;
}
export declare const AuctionSchema: any;
