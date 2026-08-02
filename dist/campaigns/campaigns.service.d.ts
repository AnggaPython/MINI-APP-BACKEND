import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { UsersService } from '../users/users.service';
import { AchievementsService } from '../achievements/achievements.service';
export declare class CampaignsService {
    private campaignModel;
    private usersService;
    private achievementsService;
    constructor(campaignModel: Model<CampaignDocument>, usersService: UsersService, achievementsService: AchievementsService);
    createCampaign(data: {
        creatorTelegramId: string;
        title: string;
        description: string;
        category: string;
        rewardPerClick: number;
        totalBudget: number;
        url?: string;
    }): Promise<{
        success: boolean;
        error: string;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: import("mongoose").Document<unknown, {}, CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    }>;
    getActiveCampaigns(telegramId: string): Promise<(import("mongoose").Document<unknown, {}, CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getMyCampaigns(creatorTelegramId: string): Promise<(import("mongoose").Document<unknown, {}, CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    completeTask(telegramId: string, campaignId: string): Promise<{
        success: boolean;
        error: string;
        reward?: undefined;
    } | {
        success: boolean;
        reward: number;
        error?: undefined;
    }>;
    updateCampaign(campaignId: string, data: {
        title?: string;
        description?: string;
        url?: string;
    }): Promise<{
        success: boolean;
        error: string;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: import("mongoose").Document<unknown, {}, CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    }>;
    addBudget(campaignId: string, amount: number, telegramId: string): Promise<{
        success: boolean;
        error: string;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: import("mongoose").Document<unknown, {}, CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    }>;
}
