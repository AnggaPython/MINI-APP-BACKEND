import { Document } from "mongoose";
export type AssetRegistryDocument = AssetRegistry & Document;
export declare class AssetRegistry {
    asset: string;
    virtualReserve: number;
    usdPrice: number;
    anchorUsdPrice: number;
    priceMin: number;
    priceMax: number;
    totalSupply: number;
}
export declare const AssetRegistrySchema: import("mongoose").Schema<AssetRegistry, import("mongoose").Model<AssetRegistry, any, any, any, any, any, AssetRegistry>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AssetRegistry, Document<unknown, {}, AssetRegistry, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    asset?: import("mongoose").SchemaDefinitionProperty<string, AssetRegistry, Document<unknown, {}, AssetRegistry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    virtualReserve?: import("mongoose").SchemaDefinitionProperty<number, AssetRegistry, Document<unknown, {}, AssetRegistry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    usdPrice?: import("mongoose").SchemaDefinitionProperty<number, AssetRegistry, Document<unknown, {}, AssetRegistry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    anchorUsdPrice?: import("mongoose").SchemaDefinitionProperty<number, AssetRegistry, Document<unknown, {}, AssetRegistry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    priceMin?: import("mongoose").SchemaDefinitionProperty<number, AssetRegistry, Document<unknown, {}, AssetRegistry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    priceMax?: import("mongoose").SchemaDefinitionProperty<number, AssetRegistry, Document<unknown, {}, AssetRegistry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalSupply?: import("mongoose").SchemaDefinitionProperty<number, AssetRegistry, Document<unknown, {}, AssetRegistry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AssetRegistry & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, AssetRegistry>;
