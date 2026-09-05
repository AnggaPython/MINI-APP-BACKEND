import { Document } from "mongoose";
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
export declare const UserNetEquitySchema: any;
