import { Document } from "mongoose";
export type OpenOrderDocument = OpenOrder & Document;
export declare class OpenOrder {
    telegramId: string;
    side: "BUY" | "SELL";
    price: number;
    amount: number;
    filledAmount: number;
    status: "OPEN" | "FILLED" | "CANCELLED";
}
export declare const OpenOrderSchema: any;
