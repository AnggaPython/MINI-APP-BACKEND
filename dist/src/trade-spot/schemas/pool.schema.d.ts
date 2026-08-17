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
}
export declare const LiquidityPoolSchema: any;
