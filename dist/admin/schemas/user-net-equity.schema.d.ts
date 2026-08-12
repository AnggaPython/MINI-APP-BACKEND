import { Document } from 'mongoose';
export type UserNetEquityDocument = UserNetEquity & Document;
export declare class UserNetEquity {
    telegramId: string;
    firstName?: string | null;
    username?: string | null;
    totalDepositedElixir: number;
    totalWithdrawnElixir: number;
    totalHiLoGrossWinsElixir: number;
    totalHiLoGrossLossesElixir: number;
    lockedVestingElixir: number;
    lockedVestingTurnoverRequired: number;
    lockedVestingTurnoverDone: number;
    lastBigWinAt?: Date | null;
    totalBetsLifetime: number;
    adsViewedLifetime: number;
    withdrawnTodayElixir: number;
    withdrawnDayKey?: string | null;
    circulationTaxAccumulated: number;
    lastActiveAt?: Date | null;
    whalePatternQueue?: number[];
    whalePatternIndex?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const UserNetEquitySchema: import("mongoose").Schema<UserNetEquity, import("mongoose").Model<UserNetEquity, any, any, any, any, any, UserNetEquity>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserNetEquity, Document<unknown, {}, UserNetEquity, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    telegramId?: import("mongoose").SchemaDefinitionProperty<string, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    firstName?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    username?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalDepositedElixir?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalWithdrawnElixir?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalHiLoGrossWinsElixir?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalHiLoGrossLossesElixir?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lockedVestingElixir?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lockedVestingTurnoverRequired?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lockedVestingTurnoverDone?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastBigWinAt?: import("mongoose").SchemaDefinitionProperty<Date | null | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalBetsLifetime?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    adsViewedLifetime?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    withdrawnTodayElixir?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    withdrawnDayKey?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    circulationTaxAccumulated?: import("mongoose").SchemaDefinitionProperty<number, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastActiveAt?: import("mongoose").SchemaDefinitionProperty<Date | null | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    whalePatternQueue?: import("mongoose").SchemaDefinitionProperty<number[] | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    whalePatternIndex?: import("mongoose").SchemaDefinitionProperty<number | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, UserNetEquity, Document<unknown, {}, UserNetEquity, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserNetEquity & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, UserNetEquity>;
