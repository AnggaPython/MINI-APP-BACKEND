import { Document } from "mongoose";
export type UserBuffCollectionDocument = UserBuffCollection & Document;
export declare class UserBuffCollection {
    telegramId: string;
    ownedBuffIds: string[];
    activeBuffIds: string[];
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
    ownedBuffIds?: import("mongoose").SchemaDefinitionProperty<string[], UserBuffCollection, Document<unknown, {}, UserBuffCollection, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserBuffCollection & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    activeBuffIds?: import("mongoose").SchemaDefinitionProperty<string[], UserBuffCollection, Document<unknown, {}, UserBuffCollection, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserBuffCollection & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, UserBuffCollection>;
