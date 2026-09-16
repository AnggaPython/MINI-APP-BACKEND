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
export declare const ReferralNotificationSchema: import("mongoose").Schema<ReferralNotification, import("mongoose").Model<ReferralNotification, any, any, any, any, any, ReferralNotification>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ReferralNotification, Document<unknown, {}, ReferralNotification, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ReferralNotification & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    recipientTelegramId?: import("mongoose").SchemaDefinitionProperty<string, ReferralNotification, Document<unknown, {}, ReferralNotification, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralNotification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    kind?: import("mongoose").SchemaDefinitionProperty<string, ReferralNotification, Document<unknown, {}, ReferralNotification, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralNotification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    downlineUsername?: import("mongoose").SchemaDefinitionProperty<string, ReferralNotification, Document<unknown, {}, ReferralNotification, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralNotification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, ReferralNotification, Document<unknown, {}, ReferralNotification, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralNotification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ackedAt?: import("mongoose").SchemaDefinitionProperty<Date, ReferralNotification, Document<unknown, {}, ReferralNotification, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralNotification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ackedVia?: import("mongoose").SchemaDefinitionProperty<string, ReferralNotification, Document<unknown, {}, ReferralNotification, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ReferralNotification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, ReferralNotification>;
