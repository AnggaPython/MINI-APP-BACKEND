import { Document } from "mongoose";
export type OpenOrderDocument = OpenOrder & Document;
export declare class OpenOrder {
    telegramId: string;
    pair: string;
    side: "BUY" | "SELL";
    price: number;
    amount: number;
    filledAmount: number;
    status: "OPEN" | "FILLED" | "CANCELLED";
}
export declare const OpenOrderSchema: import("mongoose").Schema<OpenOrder, import("mongoose").Model<OpenOrder, any, any, any, any, any, OpenOrder>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OpenOrder, Document<unknown, {}, OpenOrder, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, OpenOrder, Document<unknown, {}, OpenOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    pair?: import("mongoose").SchemaDefinitionProperty<string, OpenOrder, Document<unknown, {}, OpenOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    side?: import("mongoose").SchemaDefinitionProperty<"BUY" | "SELL", OpenOrder, Document<unknown, {}, OpenOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, OpenOrder, Document<unknown, {}, OpenOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, OpenOrder, Document<unknown, {}, OpenOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    filledAmount?: import("mongoose").SchemaDefinitionProperty<number, OpenOrder, Document<unknown, {}, OpenOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"OPEN" | "FILLED" | "CANCELLED", OpenOrder, Document<unknown, {}, OpenOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OpenOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, OpenOrder>;
