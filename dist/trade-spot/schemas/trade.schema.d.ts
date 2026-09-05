import { Document } from "mongoose";
export type TradeDocument = Trade & Document;
export declare class Trade {
    pair: string;
    side: "BUY" | "SELL";
    price: number;
    amount: number;
    total: number;
    fee: number;
    feeCurrency: string;
    source: "BOT" | "USER";
    telegramId?: string;
}
export declare const TradeSchema: any;
