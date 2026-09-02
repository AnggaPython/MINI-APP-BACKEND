import { Document } from "mongoose";
export type LiquidityPoolDocument = LiquidityPool & Document;
export declare class LiquidityPool {
    pair: string;
    elixcoinReserve: number;
    elixirReserve: number;
    baseReserve: number;
    quoteReserve: number;
    midMin: number;
    midMax: number;
    lastMid: number;
    spreadPct: number;
    feePct: number;
    platformFeesAccumulated: number;
    spreadProfitAccumulated: number;
    botRunCount: number;
    lastBotRunAt: Date;
    lifetimeVolume: number;
    botEnabled: boolean;
    botTradesPerCycle: number;
    botIntervalMinutes: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    open24h: number;
    dayResetAt: Date;
    cosmeticChangePct: number;
    cosmeticPctUpdatedAt: Date;
    adminAskCeiling: number;
    adminBidFloor: number;
    adminSellWalls: {
        price: number;
        amount: number;
    }[];
    adminBuyWalls: {
        price: number;
        amount: number;
    }[];
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
    elixcoinReserve?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
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
    baseReserve?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    quoteReserve?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    midMin?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    midMax?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
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
    botTradesPerCycle?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
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
    high24h?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    low24h?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    volume24h?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    quoteVolume24h?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    open24h?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    dayResetAt?: import("mongoose").SchemaDefinitionProperty<Date, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    cosmeticChangePct?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    cosmeticPctUpdatedAt?: import("mongoose").SchemaDefinitionProperty<Date, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    adminAskCeiling?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    adminBidFloor?: import("mongoose").SchemaDefinitionProperty<number, LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    adminSellWalls?: import("mongoose").SchemaDefinitionProperty<{
        price: number;
        amount: number;
    }[], LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    adminBuyWalls?: import("mongoose").SchemaDefinitionProperty<{
        price: number;
        amount: number;
    }[], LiquidityPool, Document<unknown, {}, LiquidityPool, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiquidityPool & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, LiquidityPool>;
