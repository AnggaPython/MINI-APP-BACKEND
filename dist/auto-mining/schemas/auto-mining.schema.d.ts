import { Document } from "mongoose";
export declare class AutoMiningSub {
    telegramId: string;
    status: string;
    planDays: number;
    feePaid: number;
    claimMode: string;
    target: string;
    splitStonePct: number;
    startDate: Date;
    endDate: Date;
    dailyQuota: number;
    autopilotOn: boolean;
    lastRunAt: Date | null;
    totalRuns: number;
    totalElixirValue: number;
    favPickaxe: string | null;
    planBuffs: string[];
}
export type AutoMiningSubDocument = AutoMiningSub & Document;
export declare const AutoMiningSubSchema: import("mongoose").Schema<AutoMiningSub, import("mongoose").Model<AutoMiningSub, any, any, any, any, any, AutoMiningSub>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    planDays?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    feePaid?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    claimMode?: import("mongoose").SchemaDefinitionProperty<string, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    target?: import("mongoose").SchemaDefinitionProperty<string, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    splitStonePct?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    startDate?: import("mongoose").SchemaDefinitionProperty<Date, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<Date, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    dailyQuota?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    autopilotOn?: import("mongoose").SchemaDefinitionProperty<boolean, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastRunAt?: import("mongoose").SchemaDefinitionProperty<Date | null, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalRuns?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalElixirValue?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    favPickaxe?: import("mongoose").SchemaDefinitionProperty<string | null, AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    planBuffs?: import("mongoose").SchemaDefinitionProperty<string[], AutoMiningSub, Document<unknown, {}, AutoMiningSub, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningSub & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, AutoMiningSub>;
export declare class AutoMiningDay {
    telegramId: string;
    date: string;
    target: string;
    runs: number;
    skipped: number;
    earned: Record<string, number>;
    elixirValue: number;
}
export type AutoMiningDayDocument = AutoMiningDay & Document;
export declare const AutoMiningDaySchema: import("mongoose").Schema<AutoMiningDay, import("mongoose").Model<AutoMiningDay, any, any, any, any, any, AutoMiningDay>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    date?: import("mongoose").SchemaDefinitionProperty<string, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    target?: import("mongoose").SchemaDefinitionProperty<string, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    runs?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    skipped?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    earned?: import("mongoose").SchemaDefinitionProperty<Record<string, number>, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    elixirValue?: import("mongoose").SchemaDefinitionProperty<number, AutoMiningDay, Document<unknown, {}, AutoMiningDay, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AutoMiningDay & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, AutoMiningDay>;
