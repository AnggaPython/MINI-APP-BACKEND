import { Model } from "mongoose";
import { CampaignDocument } from "./schemas/campaign.schema";
import { UsersService } from "../users/users.service";
import { AchievementsService } from "../achievements/achievements.service";
import { AdminService } from "../admin/admin.service";
export declare class CampaignsService {
    private campaignModel;
    private usersService;
    private achievementsService;
    private adminService;
    constructor(campaignModel: Model<CampaignDocument>, usersService: UsersService, achievementsService: AchievementsService, adminService: AdminService);
    createCampaign(data: {
        creatorTelegramId: string;
        title: string;
        description: string;
        category: string;
        rewardPerClick: number;
        totalBudget: number;
        url?: string;
        oneUserLifetime?: boolean;
        autoRenew?: boolean;
    }): Promise<{
        success: boolean;
        error: string;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: any;
        error?: undefined;
    }>;
    getActiveCampaigns(telegramId: string): Promise<any>;
    getMyCampaigns(creatorTelegramId: string): Promise<any>;
    private validateCampaignUrl;
    private activeTaskStarts;
    startTask(telegramId: string, campaignId: string): Promise<{
        success: boolean;
    }>;
    verifyTelegramMembership(telegramId: string, url: string): Promise<boolean | null>;
    completeTask(telegramId: string, campaignId: string): Promise<{
        success: boolean;
        error: string;
        message?: undefined;
        reward?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        reward?: undefined;
    } | {
        success: boolean;
        reward: number;
        error?: undefined;
        message?: undefined;
    }>;
    updateCampaign(campaignId: string, data: {
        title?: string;
        description?: string;
        url?: string;
    }): Promise<{
        success: boolean;
        error: any;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: any;
        error?: undefined;
    }>;
    addBudget(campaignId: string, amount: number, telegramId: string): Promise<{
        success: boolean;
        error: string;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: any;
        error?: undefined;
    }>;
}
