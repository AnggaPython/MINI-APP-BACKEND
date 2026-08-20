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
        campaign: import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
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
        campaign: import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    }>;
    addBudget(id: string, telegramId: string, amount: number): Promise<{
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
