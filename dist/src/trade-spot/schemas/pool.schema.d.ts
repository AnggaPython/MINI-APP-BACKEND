import { Document } from "mongoose";
export type LiquidityPoolDocument = LiquidityPool & Document;
export declare class LiquidityPool {
    pair: string;
    elixirReserve: number;
    elixcoinReserve: number;
    lastMid: number;
    spreadPct: number;
    feePct: number;
    platformFeesAccumulated: number;
    spreadProfitAccumulated: number;
    botRunCount: number;
    lastBotRunAt: Date;
    lifetimeVolume: number;
    botEnabled: boolean;
    botIntervalMinutes: number;
}
export declare const LiquidityPoolSchema: import("mongoose").Schema<LiquidityPool, import("mongoose").Model<LiquidityPool, any, any, any, any, any, LiquidityPool>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LiquidityPool, Document<unknown, {}, LiquidityPool, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    pair?: import("mongoose").SchemaDefinitionProperty<string, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    elixirReserve?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    elixcoinReserve?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastMid?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    spreadPct?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    feePct?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    platformFeesAccumulated?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    spreadProfitAccumulated?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    botRunCount?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastBotRunAt?: import("mongoose").SchemaDefinitionProperty<Date, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lifetimeVolume?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    botEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    botIntervalMinutes?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, LiquidityPool>;
