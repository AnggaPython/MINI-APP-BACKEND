import { Document } from "mongoose";
export type ReferralLogDocument = ReferralLog & Document;
export declare class ReferralLog {
    uplineTelegramId: string;
    downlineUsername: string;
    amount: number;
    actionHash: string;
}
export declare const ReferralLogSchema: import("mongoose").Schema<ReferralLog, import("mongoose").Model<ReferralLog, any, any, any, any, any, ReferralLog>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ReferralLog, Document<unknown, {}, ReferralLog, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ReferralLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    uplineTelegramId?: import("mongoose").SchemaDefinitionProperty<string, ReferralLog, Document<unknown, {}, ReferralLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    downlineUsername?: import("mongoose").SchemaDefinitionProperty<string, ReferralLog, Document<unknown, {}, ReferralLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, ReferralLog, Document<unknown, {}, ReferralLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    actionHash?: import("mongoose").SchemaDefinitionProperty<string, ReferralLog, Document<unknown, {}, ReferralLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, ReferralLog>;
