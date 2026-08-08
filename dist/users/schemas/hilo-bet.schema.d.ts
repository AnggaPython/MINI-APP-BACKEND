import { Document } from 'mongoose';
export type HiLoBetDocument = HiLoBet & Document;
export declare class HiLoBet {
    telegramId: string;
    betAmount: number;
    multiplier: number;
    targetType: string;
    rolledNumber: number;
    isWin: boolean;
    profit: number;
    newBalance: number;
    serverSeed: string;
    clientSeed: string;
    hash: string;
}
export declare const HiLoBetSchema: import("mongoose").Schema<HiLoBet, import("mongoose").Model<HiLoBet, any, any, any, any, any, HiLoBet>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, HiLoBet, Document<unknown, {}, HiLoBet, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    betAmount?: import("mongoose").SchemaDefinitionProperty<number, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    multiplier?: import("mongoose").SchemaDefinitionProperty<number, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    targetType?: import("mongoose").SchemaDefinitionProperty<string, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rolledNumber?: import("mongoose").SchemaDefinitionProperty<number, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isWin?: import("mongoose").SchemaDefinitionProperty<boolean, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    profit?: import("mongoose").SchemaDefinitionProperty<number, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    newBalance?: import("mongoose").SchemaDefinitionProperty<number, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    serverSeed?: import("mongoose").SchemaDefinitionProperty<string, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    clientSeed?: import("mongoose").SchemaDefinitionProperty<string, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    hash?: import("mongoose").SchemaDefinitionProperty<string, HiLoBet, Document<unknown, {}, HiLoBet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HiLoBet & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, HiLoBet>;
