import { Document } from 'mongoose';
export type TransactionDocument = Transaction & Document;
export declare class Transaction {
    telegramId: string;
    type: string;
    coin: string;
    amount: number;
    tier: string;
    status: string;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, any, any, Transaction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, Transaction, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    coin?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    tier?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Transaction>;
