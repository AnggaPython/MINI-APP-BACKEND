import { Document } from "mongoose";
export type MiningStoneDocument = MiningStone & Document;
export type StoneTier = "Common" | "Medium" | "Rare";
export declare class MiningStone {
    telegramId: string;
    tier: StoneTier;
    maxHp: number;
    zonk: boolean;
    status: string;
    rewards: Record<string, number> | null;
    claimAction: string | null;
    claimedAt: Date | null;
    finalizedAt: Date | null;
    expireAt: Date;
}
export declare const MiningStoneSchema: import("mongoose").Schema<MiningStone, import("mongoose").Model<MiningStone, any, any, any, any, any, MiningStone>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MiningStone, Document<unknown, {}, MiningStone, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    tier?: import("mongoose").SchemaDefinitionProperty<StoneTier, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    maxHp?: import("mongoose").SchemaDefinitionProperty<number, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    zonk?: import("mongoose").SchemaDefinitionProperty<boolean, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rewards?: import("mongoose").SchemaDefinitionProperty<Record<string, number> | null, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    claimAction?: import("mongoose").SchemaDefinitionProperty<string | null, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    claimedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    finalizedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    expireAt?: import("mongoose").SchemaDefinitionProperty<Date, MiningStone, Document<unknown, {}, MiningStone, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MiningStone & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, MiningStone>;
