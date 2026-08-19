import { Document } from "mongoose";
export type LiquidityPoolDocument = LiquidityPool & Document;
export declare class LiquidityPool {
    pair: string;
    elixirReserve: number;
    elixcoinReserve: number;
    lastMid: number;
    spreadPct: number;
    feePct: number;
    platformFeesAccumulated: number;
    spreadProfitAccumulated: number;
    botRunCount: number;
    lastBotRunAt: Date;
    lifetimeVolume: number;
    botEnabled: boolean;
    botIntervalMinutes: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    open24h: number;
    dayResetAt: Date;
}
export declare const LiquidityPoolSchema: any;
