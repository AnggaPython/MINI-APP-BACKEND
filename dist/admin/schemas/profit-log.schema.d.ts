import { Document } from 'mongoose';
export type ProfitLogDocument = ProfitLog & Document;
export declare class ProfitLog {
    coin: string;
    amount: number;
    source: string;
    telegramId: string;
}
export declare const ProfitLogSchema: import("mongoose").Schema<ProfitLog, import("mongoose").Model<ProfitLog, any, any, any, any, any, ProfitLog>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProfitLog, Document<unknown, {}, ProfitLog, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ProfitLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    coin?: import("mongoose").SchemaDefinitionProperty<string, ProfitLog, Document<unknown, {}, ProfitLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProfitLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, ProfitLog, Document<unknown, {}, ProfitLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProfitLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    source?: import("mongoose").SchemaDefinitionProperty<string, ProfitLog, Document<unknown, {}, ProfitLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProfitLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, ProfitLog, Document<unknown, {}, ProfitLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProfitLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, ProfitLog>;
