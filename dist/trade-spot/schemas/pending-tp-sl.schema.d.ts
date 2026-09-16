import { Document } from "mongoose";
export type PendingTpSlDocument = PendingTpSl & Document;
export declare class PendingTpSl {
    telegramId: string;
    pair: string;
    originalSide: string;
    tpPrice: number;
    slPrice: number;
    amount: number;
    triggered: boolean;
    cancelled: boolean;
    triggeredAt: Date;
}
export declare const PendingTpSlSchema: import("mongoose").Schema<PendingTpSl, import("mongoose").Model<PendingTpSl, any, any, any, any, any, PendingTpSl>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PendingTpSl, Document<unknown, {}, PendingTpSl, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    pair?: import("mongoose").SchemaDefinitionProperty<string, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    originalSide?: import("mongoose").SchemaDefinitionProperty<string, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    tpPrice?: import("mongoose").SchemaDefinitionProperty<number, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    slPrice?: import("mongoose").SchemaDefinitionProperty<number, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    triggered?: import("mongoose").SchemaDefinitionProperty<boolean, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    cancelled?: import("mongoose").SchemaDefinitionProperty<boolean, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    triggeredAt?: import("mongoose").SchemaDefinitionProperty<Date, PendingTpSl, Document<unknown, {}, PendingTpSl, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PendingTpSl & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, PendingTpSl>;
