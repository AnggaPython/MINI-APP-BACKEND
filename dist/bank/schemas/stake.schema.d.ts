import { Document } from 'mongoose';
export type StakeDocument = Stake & Document;
export declare class Stake {
    telegramId: string;
    amount: number;
    durationDays: number;
    rate: number;
    stakeDate: Date;
    maturityDate: Date;
    lastClaimDate: Date;
    status: string;
    autoClaim: boolean;
    autoReinvest: boolean;
    isXpClaimed: boolean;
}
export declare const StakeSchema: any;
