import { Document, Schema as MongooseSchema } from "mongoose";
export type AuctionDocument = Auction & Document;
export type AuctionStatus = "active" | "settling" | "sold" | "cancelled";
export declare class Auction {
    sellerId: string;
    sellerName: string;
    itemCategory: string;
    instanceId?: string;
    baseItemId: string;
    amount: number;
    buffType: string;
    rarity: string;
    price: number;
    tax: number;
    netAmount: number;
    status: AuctionStatus;
    listedAt: Date;
    expiresAt: Date;
    collateralDeposit: number;
    collateralReturned: boolean;
    claimExpiresAt: Date | null;
    resolvedAt: Date;
    buyerId: string;
}
export declare const AuctionSchema: MongooseSchema<Auction, import("mongoose").Model<Auction, any, any, any, any, any, Auction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Auction, Document<unknown, {}, Auction, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    sellerId?: import("mongoose").SchemaDefinitionProperty<string, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    sellerName?: import("mongoose").SchemaDefinitionProperty<string, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    itemCategory?: import("mongoose").SchemaDefinitionProperty<string, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    instanceId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    baseItemId?: import("mongoose").SchemaDefinitionProperty<string, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buffType?: import("mongoose").SchemaDefinitionProperty<string, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rarity?: import("mongoose").SchemaDefinitionProperty<string, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    tax?: import("mongoose").SchemaDefinitionProperty<number, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    netAmount?: import("mongoose").SchemaDefinitionProperty<number, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<AuctionStatus, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    listedAt?: import("mongoose").SchemaDefinitionProperty<Date, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    collateralDeposit?: import("mongoose").SchemaDefinitionProperty<number, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    collateralReturned?: import("mongoose").SchemaDefinitionProperty<boolean, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    claimExpiresAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    resolvedAt?: import("mongoose").SchemaDefinitionProperty<Date, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buyerId?: import("mongoose").SchemaDefinitionProperty<string, Auction, Document<unknown, {}, Auction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Auction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Auction>;
