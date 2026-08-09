import { Document } from 'mongoose';
export type BankLogDocument = BankLog & Document;
export declare class BankLog {
    telegramId: string;
    actionType: string;
    amount: number;
}
export declare const BankLogSchema: import("mongoose").Schema<BankLog, import("mongoose").Model<BankLog, any, any, any, any, any, BankLog>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BankLog, Document<unknown, {}, BankLog, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<BankLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, BankLog, Document<unknown, {}, BankLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BankLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    actionType?: import("mongoose").SchemaDefinitionProperty<string, BankLog, Document<unknown, {}, BankLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BankLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, BankLog, Document<unknown, {}, BankLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BankLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, BankLog>;
