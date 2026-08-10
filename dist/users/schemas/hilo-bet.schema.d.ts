import { Document } from 'mongoose';
export type HiLoBetDocument = HiLoBet & Document;
export declare class HiLoBet {
    telegramId: string;
    betAmount: number;
    multiplier: number;
    targetType: string;
    rolledNumber: number;
    isWin: boolean;
    profit: number;
    newBalance: number;
    serverSeed: string;
    clientSeed: string;
    hash: string;
}
export declare const HiLoBetSchema: any;
