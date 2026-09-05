import { CampaignsService } from "./campaigns.service";
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    createCampaign(data: any): Promise<{
        success: boolean;
        error: string;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: any;
        error?: undefined;
    }>;
    getActiveCampaigns(telegramId: string): Promise<any>;
    getMyCampaigns(telegramId: string): Promise<any>;
    startTask(telegramId: string, campaignId: string): Promise<{
        success: boolean;
    } | {
        success: boolean;
        error: string;
    }>;
    completeTask(telegramId: string, campaignId: string): Promise<{
        success: boolean;
        error: string;
        message: string;
        reward?: undefined;
    } | {
        success: boolean;
        reward: number;
        error?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    updateCampaign(id: string, data: any): Promise<{
        success: boolean;
        error: any;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: any;
        error?: undefined;
    }>;
    addBudget(id: string, telegramId: string, amount: number): Promise<{
        success: boolean;
        campaign: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
}
