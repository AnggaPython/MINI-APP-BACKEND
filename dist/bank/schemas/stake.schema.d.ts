import { Document } from 'mongoose';
export type StakeDocument = Stake & Document;
export declare class Stake {
    telegramId: string;
    amount: number;
    durationDays: number;
    rate: number;
    stakeDate: Date;
    maturityDate: Date;
    lastClaimDate: Date;
    status: string;
    autoClaim: boolean;
}
export declare const StakeSchema: import("mongoose").Schema<Stake, import("mongoose").Model<Stake, any, any, any, any, any, Stake>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Stake, Document<unknown, {}, Stake, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    durationDays?: import("mongoose").SchemaDefinitionProperty<number, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rate?: import("mongoose").SchemaDefinitionProperty<number, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    stakeDate?: import("mongoose").SchemaDefinitionProperty<Date, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    maturityDate?: import("mongoose").SchemaDefinitionProperty<Date, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastClaimDate?: import("mongoose").SchemaDefinitionProperty<Date, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    autoClaim?: import("mongoose").SchemaDefinitionProperty<boolean, Stake, Document<unknown, {}, Stake, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Stake & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Stake>;
