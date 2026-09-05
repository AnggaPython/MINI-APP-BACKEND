import { Document } from "mongoose";
export type ReferralNotificationDocument = ReferralNotification & Document;
export declare class ReferralNotification {
    recipientTelegramId: string;
    kind: string;
    downlineUsername: string;
    amount: number;
    ackedAt: Date;
    ackedVia: string;
}
export declare const ReferralNotificationSchema: any;
