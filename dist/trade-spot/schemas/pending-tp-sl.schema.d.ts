import { Document } from "mongoose";
export type PendingTpSlDocument = PendingTpSl & Document;
export declare class PendingTpSl {
    telegramId: string;
    pair: string;
    originalSide: string;
    tpPrice: number;
    slPrice: number;
    amount: number;
    triggered: boolean;
    cancelled: boolean;
    triggeredAt: Date;
}
export declare const PendingTpSlSchema: any;
