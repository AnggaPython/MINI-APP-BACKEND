import { Document } from "mongoose";
export type MineSwipeSessionDocument = MineSwipeSession & Document;
export declare class MineSwipeSession {
    telegramId: string;
    boardSize: number;
    mineCount: number;
    mines: string[];
    revealed: string[];
    status: string;
    accumulatedReward: number;
    finalReward: number | null;
    rewardPerTile: number;
    expireAt: Date;
}
export declare const MineSwipeSessionSchema: import("mongoose").Schema<MineSwipeSession, import("mongoose").Model<MineSwipeSession, any, any, any, any, any, MineSwipeSession>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    boardSize?: import("mongoose").SchemaDefinitionProperty<number, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    mineCount?: import("mongoose").SchemaDefinitionProperty<number, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    mines?: import("mongoose").SchemaDefinitionProperty<string[], MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    revealed?: import("mongoose").SchemaDefinitionProperty<string[], MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    accumulatedReward?: import("mongoose").SchemaDefinitionProperty<number, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    finalReward?: import("mongoose").SchemaDefinitionProperty<number | null, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rewardPerTile?: import("mongoose").SchemaDefinitionProperty<number, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    expireAt?: import("mongoose").SchemaDefinitionProperty<Date, MineSwipeSession, Document<unknown, {}, MineSwipeSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MineSwipeSession & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, MineSwipeSession>;
