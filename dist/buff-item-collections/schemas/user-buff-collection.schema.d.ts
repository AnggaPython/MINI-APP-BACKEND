import { Document } from "mongoose";
export type UserBuffCollectionDocument = UserBuffCollection & Document;
export declare class ItemInstance {
    instanceId: string;
    baseItemId: string;
    acquiredAt: Date;
}
export declare const ItemInstanceSchema: import("mongoose").Schema<ItemInstance, import("mongoose").Model<ItemInstance, any, any, any, any, any, ItemInstance>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ItemInstance, Document<unknown, {}, ItemInstance, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ItemInstance & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    instanceId?: import("mongoose").SchemaDefinitionProperty<string, ItemInstance, Document<unknown, {}, ItemInstance, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ItemInstance & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    baseItemId?: import("mongoose").SchemaDefinitionProperty<string, ItemInstance, Document<unknown, {}, ItemInstance, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ItemInstance & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    acquiredAt?: import("mongoose").SchemaDefinitionProperty<Date, ItemInstance, Document<unknown, {}, ItemInstance, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ItemInstance & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, ItemInstance>;
export declare class UserBuffCollection {
    telegramId: string;
    inventory: ItemInstance[];
    activeInstanceIds: string[];
}
export declare const UserBuffCollectionSchema: import("mongoose").Schema<UserBuffCollection, import("mongoose").Model<UserBuffCollection, any, any, any, any, any, UserBuffCollection>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserBuffCollection, Document<unknown, {}, UserBuffCollection, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserBuffCollection & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, UserBuffCollection, Document<unknown, {}, UserBuffCollection, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserBuffCollection & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    inventory?: import("mongoose").SchemaDefinitionProperty<ItemInstance[], UserBuffCollection, Document<unknown, {}, UserBuffCollection, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserBuffCollection & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    activeInstanceIds?: import("mongoose").SchemaDefinitionProperty<string[], UserBuffCollection, Document<unknown, {}, UserBuffCollection, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserBuffCollection & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, UserBuffCollection>;
