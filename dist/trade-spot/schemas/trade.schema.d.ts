import { Document } from "mongoose";
export type TradeDocument = Trade & Document;
export declare class Trade {
    pair: string;
    side: "BUY" | "SELL";
    price: number;
    amount: number;
    total: number;
    fee: number;
    feeCurrency: string;
    source: "BOT" | "USER";
    telegramId?: string;
}
export declare const TradeSchema: import("mongoose").Schema<Trade, import("mongoose").Model<Trade, any, any, any, any, any, Trade>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Trade, Document<unknown, {}, Trade, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    pair?: import("mongoose").SchemaDefinitionProperty<string, Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    side?: import("mongoose").SchemaDefinitionProperty<"BUY" | "SELL", Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    total?: import("mongoose").SchemaDefinitionProperty<number, Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    fee?: import("mongoose").SchemaDefinitionProperty<number, Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    feeCurrency?: import("mongoose").SchemaDefinitionProperty<string, Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    source?: import("mongoose").SchemaDefinitionProperty<"USER" | "BOT", Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    telegramId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Trade, Document<unknown, {}, Trade, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Trade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Trade>;
