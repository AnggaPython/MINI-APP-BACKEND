import { HydratedDocument } from 'mongoose';
export type AdminDocument = HydratedDocument<Admin>;
export declare class Admin {
    username: string;
    passwordHash: string;
    role: string;
    lastLogin: Date | null;
    lastIp: string | null;
    profitBalances: Record<string, number>;
    withdrawLimits: Record<string, number>;
    sessionToken: string | null;
    tokenExpiresAt: Date | null;
}
export declare const AdminSchema: import("mongoose").Schema<Admin, import("mongoose").Model<Admin, any, any, any, any, any, Admin>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Admin, import("mongoose").Document<unknown, {}, Admin, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    username?: import("mongoose").SchemaDefinitionProperty<string, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    passwordHash?: import("mongoose").SchemaDefinitionProperty<string, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    role?: import("mongoose").SchemaDefinitionProperty<string, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastLogin?: import("mongoose").SchemaDefinitionProperty<Date | null, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastIp?: import("mongoose").SchemaDefinitionProperty<string | null, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    profitBalances?: import("mongoose").SchemaDefinitionProperty<Record<string, number>, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    withdrawLimits?: import("mongoose").SchemaDefinitionProperty<Record<string, number>, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    sessionToken?: import("mongoose").SchemaDefinitionProperty<string | null, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    tokenExpiresAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Admin, import("mongoose").Document<unknown, {}, Admin, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Admin & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Admin>;
