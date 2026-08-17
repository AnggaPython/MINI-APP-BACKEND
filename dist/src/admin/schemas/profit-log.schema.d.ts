import { Document } from "mongoose";
export type ProfitLogDocument = ProfitLog & Document;
export declare class ProfitLog {
    coin: string;
    amount: number;
    source: string;
    telegramId: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ProfitLogSchema: any;
