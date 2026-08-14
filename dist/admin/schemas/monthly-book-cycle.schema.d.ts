import { Document } from 'mongoose';
export type MonthlyBookCycleDocument = MonthlyBookCycle & Document;
export declare class MonthlyBookCycle {
    cycleId: string;
    startDate: Date;
    endDate?: Date | null;
    isActive: boolean;
    startAdminTreasury: number;
    endAdminTreasury?: number | null;
    totalTaxCollected: number;
    totalBurned: number;
    totalWithdrawalFees: number;
    totalAdsRevenueElixirEquivalent: number;
    totalBets: number;
    totalBetsVolume: number;
    refillModeTriggeredCount: number;
    dailySeries: Array<{
        dayIndex: number;
        dateKey: string;
        adminTreasury: number;
        taxCollected: number;
        betsVolume: number;
    }>;
    netProfitPercent?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const MonthlyBookCycleSchema: import("mongoose").Schema<MonthlyBookCycle, import("mongoose").Model<MonthlyBookCycle, any, any, any, any, any, MonthlyBookCycle>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    cycleId?: import("mongoose").SchemaDefinitionProperty<string, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    startDate?: import("mongoose").SchemaDefinitionProperty<Date, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<Date | null | undefined, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    startAdminTreasury?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    endAdminTreasury?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalTaxCollected?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalBurned?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalWithdrawalFees?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalAdsRevenueElixirEquivalent?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalBets?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalBetsVolume?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    refillModeTriggeredCount?: import("mongoose").SchemaDefinitionProperty<number, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    dailySeries?: import("mongoose").SchemaDefinitionProperty<{
        dayIndex: number;
        dateKey: string;
        adminTreasury: number;
        taxCollected: number;
        betsVolume: number;
    }[], MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    netProfitPercent?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, MonthlyBookCycle, Document<unknown, {}, MonthlyBookCycle, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MonthlyBookCycle & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, MonthlyBookCycle>;
