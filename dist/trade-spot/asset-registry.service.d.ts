import { Model } from "mongoose";
import { AssetRegistry } from "./schemas/asset-registry.schema";
import { LiquidityPool } from "./schemas/pool.schema";
export declare class AssetRegistryService {
    private readonly assetModel;
    private readonly poolModel;
    private readonly logger;
    private cache;
    constructor(assetModel: Model<AssetRegistry>, poolModel: Model<LiquidityPool>);
    bootstrap(): Promise<void>;
    getAsset(asset: string): Promise<AssetRegistry>;
    recalcUsdPrice(asset: string): Promise<number>;
    getMidFromGlobalReserves(pair: string): Promise<number>;
    updateReservesAfterFill(base: string, quote: string, baseDelta: number, quoteDelta: number): Promise<{
        basePrice: number;
        quotePrice: number;
    }>;
    propagateToAffectedPools(base: string, quote: string): Promise<string[]>;
    propagateAllPools(): Promise<void>;
    migrateFromPools(): Promise<void>;
    private static readonly STABLE_ASSETS;
    setUsdPrice(asset: string, price: number): Promise<void>;
    invalidateCache(asset?: string): void;
}
