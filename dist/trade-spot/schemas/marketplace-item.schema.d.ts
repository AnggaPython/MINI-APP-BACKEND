import { Document } from "mongoose";
export type MarketplaceItemDocument = MarketplaceItem & Document;
export declare class MarketplaceItem {
    itemId: string;
    itemType: "buff" | "material";
    name: string;
    rarity: string;
    buffType: string | null;
    buffValue: number;
    buyPrice: number;
    sellPrice: number;
    liquidity: number;
    maxLiquidity: number;
    icon: string;
    active: boolean;
}
export declare const MarketplaceItemSchema: import("mongoose").Schema<MarketplaceItem, import("mongoose").Model<MarketplaceItem, any, any, any, any, any, MarketplaceItem>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    itemId?: import("mongoose").SchemaDefinitionProperty<string, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    itemType?: import("mongoose").SchemaDefinitionProperty<"buff" | "material", MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rarity?: import("mongoose").SchemaDefinitionProperty<string, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buffType?: import("mongoose").SchemaDefinitionProperty<string | null, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buffValue?: import("mongoose").SchemaDefinitionProperty<number, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    buyPrice?: import("mongoose").SchemaDefinitionProperty<number, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    sellPrice?: import("mongoose").SchemaDefinitionProperty<number, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    liquidity?: import("mongoose").SchemaDefinitionProperty<number, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    maxLiquidity?: import("mongoose").SchemaDefinitionProperty<number, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    icon?: import("mongoose").SchemaDefinitionProperty<string, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    active?: import("mongoose").SchemaDefinitionProperty<boolean, MarketplaceItem, Document<unknown, {}, MarketplaceItem, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MarketplaceItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, MarketplaceItem>;
