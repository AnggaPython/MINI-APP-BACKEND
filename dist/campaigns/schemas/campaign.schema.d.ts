import { Document } from "mongoose";
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
export declare const CampaignSchema: import("mongoose").Schema<Campaign, import("mongoose").Model<Campaign, any, any, any, any, any, Campaign>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Campaign, Document<unknown, {}, Campaign, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    creatorTelegramId?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    url?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rewardPerClick?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalBudget?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    remainingBudget?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    oneUserLifetime?: import("mongoose").SchemaDefinitionProperty<boolean, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    autoRenew?: import("mongoose").SchemaDefinitionProperty<boolean, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Campaign>;
