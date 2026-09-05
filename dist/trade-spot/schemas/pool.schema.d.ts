import { Document } from "mongoose";
export type LiquidityPoolDocument = LiquidityPool & Document;
export declare class LiquidityPool {
    pair: string;
    elixcoinReserve: number;
    elixirReserve: number;
    baseReserve: number;
    quoteReserve: number;
    midMin: number;
    midMax: number;
    lastMid: number;
    spreadPct: number;
    feePct: number;
    platformFeesAccumulated: number;
    spreadProfitAccumulated: number;
    botRunCount: number;
    lastBotRunAt: Date;
    lifetimeVolume: number;
    botEnabled: boolean;
    botTradesPerCycle: number;
    botIntervalMinutes: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    open24h: number;
    dayResetAt: Date;
    cosmeticChangePct: number;
    cosmeticPctUpdatedAt: Date;
    adminAskCeiling: number;
    adminBidFloor: number;
    adminSellWalls: {
        price: number;
        amount: number;
    }[];
    adminBuyWalls: {
        price: number;
        amount: number;
    }[];
}
export declare const LiquidityPoolSchema: any;
