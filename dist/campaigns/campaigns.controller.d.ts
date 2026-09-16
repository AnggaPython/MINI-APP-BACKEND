import { CampaignsService } from "./campaigns.service";
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    createCampaign(data: {
        title: string;
        description: string;
        category: string;
        rewardPerClick: number;
        totalBudget: number;
        url?: string;
        oneUserLifetime?: boolean;
        autoRenew?: boolean;
        creatorTelegramId?: string;
    }, telegramId: string): Promise<{
        success: boolean;
        campaign: import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    getActiveCampaigns(telegramId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[] | {
        error: string;
    }>;
    getMyCampaigns(telegramId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    startTask(campaignId: string, telegramId: string): Promise<{
        success: boolean;
    } | {
        success: boolean;
        error: string;
    }>;
    completeTask(campaignId: string, telegramId: string): Promise<{
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
    updateCampaign(id: string, data: {
        title?: string;
        description?: string;
        url?: string;
    }, telegramId: string): Promise<{
        success: boolean;
        error: any;
        campaign?: undefined;
    } | {
        success: boolean;
        campaign: import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    }>;
    addBudget(id: string, amount: number, telegramId: string): Promise<{
        success: boolean;
        campaign: import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
}
