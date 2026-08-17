import { Document } from "mongoose";
export type BankLogDocument = BankLog & Document;
export declare class BankLog {
    telegramId: string;
    actionType: string;
    amount: number;
}
export declare const BankLogSchema: any;
