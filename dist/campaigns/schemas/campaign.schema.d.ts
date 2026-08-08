import { Document } from 'mongoose';
export type CampaignDocument = Campaign & Document;
export declare class Campaign {
    creatorTelegramId: string;
    title: string;
    description: string;
    category: string;
    url: string;
    rewardPerClick: number;
    totalBudget: number;
    remainingBudget: number;
    status: string;
    oneUserLifetime: boolean;
    autoRenew: boolean;
}
export declare const CampaignSchema: any;
