import { Document } from 'mongoose';
export type ReferralLogDocument = ReferralLog & Document;
export declare class ReferralLog {
    uplineTelegramId: string;
    downlineUsername: string;
    amount: number;
    actionHash: string;
}
export declare const ReferralLogSchema: any;
