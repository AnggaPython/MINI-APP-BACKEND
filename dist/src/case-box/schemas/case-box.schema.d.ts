import { Document } from "mongoose";
export type CaseBoxDocument = CaseBox & Document;
export type CaseTier = "COMMON" | "MEDIUM" | "RARE";
export type CaseOutcome = "ZONK" | "ELIXCOIN" | "MATERIAL";
export declare class CaseBox {
    telegramId: string;
    tier: CaseTier;
    maxHp: number;
    status: string;
    outcome: CaseOutcome | null;
    lootRarity: CaseTier | null;
    lootName: string | null;
    loot: Record<string, number> | null;
    openedAt: Date | null;
    expireAt: Date;
}
export declare const CaseBoxSchema: import("mongoose").Schema<CaseBox, import("mongoose").Model<CaseBox, any, any, any, any, any, CaseBox>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CaseBox, Document<unknown, {}, CaseBox, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    tier?: import("mongoose").SchemaDefinitionProperty<CaseTier, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    maxHp?: import("mongoose").SchemaDefinitionProperty<number, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    outcome?: import("mongoose").SchemaDefinitionProperty<CaseOutcome | null, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lootRarity?: import("mongoose").SchemaDefinitionProperty<CaseTier | null, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lootName?: import("mongoose").SchemaDefinitionProperty<string | null, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    loot?: import("mongoose").SchemaDefinitionProperty<Record<string, number> | null, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    openedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    expireAt?: import("mongoose").SchemaDefinitionProperty<Date, CaseBox, Document<unknown, {}, CaseBox, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CaseBox & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, CaseBox>;
