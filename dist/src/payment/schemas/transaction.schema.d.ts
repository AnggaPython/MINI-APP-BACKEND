import { Document } from "mongoose";
export type TransactionDocument = Transaction & Document;
export declare class Transaction {
    telegramId: string;
    orderId?: string;
    type: string;
    coin: string;
    amount: number;
    tier: string;
    status: string;
}
export declare const TransactionSchema: any;
