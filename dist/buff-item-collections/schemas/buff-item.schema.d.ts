import { Document } from "mongoose";
export type BuffItemDocument = BuffItem & Document;
export type BuffType = "ATK" | "ECONOMY" | "DURABILITY" | "DROPRATE";
export type BuffRarity = "COMMON" | "MEDIUM" | "RARE" | "ULTRA_RARE";
export declare class BuffItem {
    buffId: string;
    collectionItemId: string;
    buffType: BuffType;
    rarity: BuffRarity;
    buffValue: number;
    buffUnit: "flat" | "percent";
    name: string;
    description: string;
    icon: string;
}
export declare const BuffItemSchema: import("mongoose").Schema<BuffItem, import("mongoose").Model<BuffItem, any, any, any, any, any, BuffItem>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BuffItem, Document<unknown, {}, BuffItem, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    buffId?: import("mongoose").SchemaDefinitionProperty<string, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    collectionItemId?: import("mongoose").SchemaDefinitionProperty<string, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buffType?: import("mongoose").SchemaDefinitionProperty<BuffType, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rarity?: import("mongoose").SchemaDefinitionProperty<BuffRarity, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buffValue?: import("mongoose").SchemaDefinitionProperty<number, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buffUnit?: import("mongoose").SchemaDefinitionProperty<"flat" | "percent", BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    icon?: import("mongoose").SchemaDefinitionProperty<string, BuffItem, Document<unknown, {}, BuffItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<BuffItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, BuffItem>;
