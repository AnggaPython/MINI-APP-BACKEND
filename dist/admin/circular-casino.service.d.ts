import { OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import { CircularTreasuryDocument } from "./schemas/circular-treasury.schema";
import { UserNetEquityDocument } from "./schemas/user-net-equity.schema";
import { MonthlyBookCycleDocument } from "./schemas/monthly-book-cycle.schema";
export type BetOutcome = {
    isWin: boolean;
    isWhaleTrigger: boolean;
    patternApplied: boolean;
    adminDelta: number;
    circularPoolDelta: number;
    burnedDelta: number;
    userNetPayout: number;
    vestingLocked: number;
    vestingTurnoverRequired: number;
    maxAdminPayoutCapApplied: boolean;
    circularPoolWasEmpty: boolean;
    refillModeActive: boolean;
    userNetEquityDeltaTotal: number;
};
export declare class CircularCasinoService implements OnModuleInit {
    private readonly treasuryModel;
    private readonly equityModel;
    private readonly bookCycleModel;
    private readonly _logger;
    constructor(treasuryModel: Model<CircularTreasuryDocument>, equityModel: Model<UserNetEquityDocument>, bookCycleModel: Model<MonthlyBookCycleDocument>);
    onModuleInit(): Promise<void>;
    ensureBootstrapped(): Promise<CircularTreasuryDocument>;
    getTreasury(): Promise<CircularTreasuryDocument>;
    getUserEquity(telegramId: string, firstName?: string | null, username?: string | null): Promise<UserNetEquityDocument>;
    resolveHiLoBet(telegramId: string, firstName: string | null | undefined, username: string | null | undefined, betAmount: number, rawIsWinFromEngine: boolean, multiplier: number): Promise<BetOutcome>;
    computeWithdrawFeePercent(_eq: UserNetEquityDocument): {
        feePct: number;
        reason: string;
    };
    computeDailyWithdrawCapUsd(_eq: UserNetEquityDocument): number;
    computeNetEquityUsd(eq: UserNetEquityDocument): number;
    onUserWithdrawSuccess(eq: UserNetEquityDocument, withdrawnElixir: number, feeElixir: number): void;
    getDashboardStats(): Promise<Record<string, unknown>>;
    getTop5WhalesByNetEquity(): Promise<Record<string, unknown>[]>;
    updateParams(updates: Record<string, number>): Promise<void>;
    closeCurrentCycleAndStartNew(): Promise<void>;
    addAdsRevenue(elixirEquivalent: number): Promise<void>;
    addWithdrawalFee(elixirFee: number): Promise<void>;
    private appendImpactLog;
    private updateMonthlyBookOnBet;
    private maybeTakeDailySnapshot;
    private dateKey;
}
