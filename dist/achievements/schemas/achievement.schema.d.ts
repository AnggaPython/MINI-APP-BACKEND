import { Document } from 'mongoose';
export type AchievementDocument = Achievement & Document;
export declare class Achievement {
    telegramId: string;
    achievementId: number;
    progress: number;
    claimed: boolean;
}
export declare const AchievementSchema: import("mongoose").Schema<Achievement, import("mongoose").Model<Achievement, any, any, any, any, any, Achievement>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Achievement, Document<unknown, {}, Achievement, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Achievement & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, Achievement, Document<unknown, {}, Achievement, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Achievement & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    achievementId?: import("mongoose").SchemaDefinitionProperty<number, Achievement, Document<unknown, {}, Achievement, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Achievement & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    progress?: import("mongoose").SchemaDefinitionProperty<number, Achievement, Document<unknown, {}, Achievement, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Achievement & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    claimed?: import("mongoose").SchemaDefinitionProperty<boolean, Achievement, Document<unknown, {}, Achievement, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Achievement & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Achievement>;
