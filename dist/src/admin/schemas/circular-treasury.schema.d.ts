import { Document } from "mongoose";
export type CircularTreasuryDocument = CircularTreasury & Document;
export declare class CircularTreasury {
    key: string;
    adminTreasuryElixir: number;
    circularLossPoolElixir: number;
    burnedTotalElixir: number;
    adminTreasuryStartCycle: number;
    totalTaxCollectedThisCycle: number;
    isRefillMode: boolean;
    refillTriggerCountThisCycle: number;
    paramAdminTreasuryStart: number;
    paramRefillTriggerBelow: number;
    paramRefillStopAbove: number;
    paramAdminTaxNormal: number;
    paramAdminTaxRefill: number;
    paramCircularShareNormal: number;
    paramCircularShareRefill: number;
    paramBurnRate: number;
    paramMaxAdminPayoutPercentPerBet: number;
    paramWhaleBetThresholdElixir: number;
    paramWhalePatternNormalTargetLoss: number;
    paramWhalePatternRefillTargetLoss: number;
    liveImpactLog: Array<{
        betId: string;
        telegramId: string;
        betAmount: number;
        isWhale: boolean;
        isWin: boolean;
        circularPoolDelta: number;
        adminTreasuryDelta: number;
        burnedDelta: number;
        timestamp: number;
    }>;
    dailySnapshots30D: Array<{
        dateYYYYMMDD: string;
        adminTreasuryElixir: number;
        circularLossPool: number;
        burnedToday: number;
        taxCollectedToday: number;
        betsToday: number;
    }>;
    lastDailySnapshot?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const CircularTreasurySchema: import("mongoose").Schema<CircularTreasury, import("mongoose").Model<CircularTreasury, any, any, any, any, any, CircularTreasury>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CircularTreasury, Document<unknown, {}, CircularTreasury, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    key?: import("mongoose").SchemaDefinitionProperty<string, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    adminTreasuryElixir?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    circularLossPoolElixir?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    burnedTotalElixir?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    adminTreasuryStartCycle?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalTaxCollectedThisCycle?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isRefillMode?: import("mongoose").SchemaDefinitionProperty<boolean, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    refillTriggerCountThisCycle?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramAdminTreasuryStart?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramRefillTriggerBelow?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramRefillStopAbove?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramAdminTaxNormal?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramAdminTaxRefill?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramCircularShareNormal?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramCircularShareRefill?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramBurnRate?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramMaxAdminPayoutPercentPerBet?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramWhaleBetThresholdElixir?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramWhalePatternNormalTargetLoss?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paramWhalePatternRefillTargetLoss?: import("mongoose").SchemaDefinitionProperty<number, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    liveImpactLog?: import("mongoose").SchemaDefinitionProperty<{
        betId: string;
        telegramId: string;
        betAmount: number;
        isWhale: boolean;
        isWin: boolean;
        circularPoolDelta: number;
        adminTreasuryDelta: number;
        burnedDelta: number;
        timestamp: number;
    }[], CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    dailySnapshots30D?: import("mongoose").SchemaDefinitionProperty<{
        dateYYYYMMDD: string;
        adminTreasuryElixir: number;
        circularLossPool: number;
        burnedToday: number;
        taxCollectedToday: number;
        betsToday: number;
    }[], CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastDailySnapshot?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CircularTreasury, Document<unknown, {}, CircularTreasury, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CircularTreasury & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, CircularTreasury>;
