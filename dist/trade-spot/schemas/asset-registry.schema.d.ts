import { Document } from "mongoose";
export type AssetRegistryDocument = AssetRegistry & Document;
export declare class AssetRegistry {
    asset: string;
    virtualReserve: number;
    usdPrice: number;
    anchorUsdPrice: number;
    priceMin: number;
    priceMax: number;
    totalSupply: number;
}
export declare const AssetRegistrySchema: any;
