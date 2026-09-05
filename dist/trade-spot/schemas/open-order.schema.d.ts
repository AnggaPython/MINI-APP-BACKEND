import { Document } from "mongoose";
export type OpenOrderDocument = OpenOrder & Document;
export declare class OpenOrder {
    telegramId: string;
    pair: string;
    side: "BUY" | "SELL";
    price: number;
    amount: number;
    filledAmount: number;
    status: "OPEN" | "FILLED" | "CANCELLED";
    iceberg: boolean;
    icebergTotal: number;
    icebergChunkSize: number;
    icebergChunksFilled: number;
}
export declare const OpenOrderSchema: any;
