import { Model } from "mongoose";
import { MinerStoneService } from "../miner-stone/miner-stone.service";
import { CaseBoxService } from "../case-box/case-box.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
import { UserDocument } from "../users/schemas/user.schema";
import { MiningStoneDocument } from "../miner-stone/schemas/mining-stone.schema";
import { CaseBoxDocument } from "../case-box/schemas/case-box.schema";
import { AutoMiningSubDocument, AutoMiningDayDocument } from "./schemas/auto-mining.schema";
export declare const AUTO_PLAN_FEE_ELIXIR = 250000;
export declare const AUTO_PLAN_DAYS = 30;
export declare const AUTO_DAILY_QUOTA = 500;
export type AutoTarget = "stone" | "casebox" | "split";
export declare class AutoMiningService {
    private subModel;
    private dayModel;
    private userModel;
    private stoneModel;
    private caseModel;
    private minerStoneService;
    private caseBoxService;
    private buffService;
    private readonly logger;
    constructor(subModel: Model<AutoMiningSubDocument>, dayModel: Model<AutoMiningDayDocument>, userModel: Model<UserDocument>, stoneModel: Model<MiningStoneDocument>, caseModel: Model<CaseBoxDocument>, minerStoneService: MinerStoneService, caseBoxService: CaseBoxService, buffService: BuffItemCollectionsService);
    subscribe(telegramId: string, opts: {
        target?: string;
        splitStonePct?: number;
        startDate?: string;
        stopDate?: string;
        claimMode?: string;
        favPickaxe?: string;
        buffIds?: string[];
    }): Promise<{
        success: boolean;
        error: string | undefined;
        sub?: undefined;
    } | {
        success: boolean;
        sub: {
            status: unknown;
            planDays: unknown;
            feePaid: unknown;
            claimMode: unknown;
            target: unknown;
            splitStonePct: unknown;
            startDate: unknown;
            endDate: unknown;
            dailyQuota: unknown;
            autopilotOn: unknown;
            lastRunAt: unknown;
            totalRuns: unknown;
            totalElixirValue: unknown;
            favPickaxe: {} | null;
            planBuffs: {};
        };
        error?: undefined;
    }>;
    private setPlanBuffs;
    private clearPlanBuffs;
    status(telegramId: string): Promise<{
        success: boolean;
        sub: null;
        today?: undefined;
        daysLeft?: undefined;
        inWindow?: undefined;
    } | {
        success: boolean;
        sub: {
            status: unknown;
            planDays: unknown;
            feePaid: unknown;
            claimMode: unknown;
            target: unknown;
            splitStonePct: unknown;
            startDate: unknown;
            endDate: unknown;
            dailyQuota: unknown;
            autopilotOn: unknown;
            lastRunAt: unknown;
            totalRuns: unknown;
            totalElixirValue: unknown;
            favPickaxe: {} | null;
            planBuffs: {};
        };
        today: {
            date: string;
            usedStone: any;
            usedCase: any;
            used: any;
            left: number;
            quota: number;
        };
        daysLeft: number;
        inWindow: boolean;
    }>;
    toggle(telegramId: string, on: boolean): Promise<{
        success: boolean;
        error: string;
        sub?: undefined;
    } | {
        success: boolean;
        sub: {
            status: unknown;
            planDays: unknown;
            feePaid: unknown;
            claimMode: unknown;
            target: unknown;
            splitStonePct: unknown;
            startDate: unknown;
            endDate: unknown;
            dailyQuota: unknown;
            autopilotOn: unknown;
            lastRunAt: unknown;
            totalRuns: unknown;
            totalElixirValue: unknown;
            favPickaxe: {} | null;
            planBuffs: {};
        };
        error?: undefined;
    }>;
    cancel(telegramId: string): Promise<{
        success: boolean;
        error: string;
        sub?: undefined;
    } | {
        success: boolean;
        sub: {
            status: unknown;
            planDays: unknown;
            feePaid: unknown;
            claimMode: unknown;
            target: unknown;
            splitStonePct: unknown;
            startDate: unknown;
            endDate: unknown;
            dailyQuota: unknown;
            autopilotOn: unknown;
            lastRunAt: unknown;
            totalRuns: unknown;
            totalElixirValue: unknown;
            favPickaxe: {} | null;
            planBuffs: {};
        };
        error?: undefined;
    }>;
    stats(telegramId: string, days: number): Promise<{
        success: boolean;
        days: number;
        rows: {
            date: string;
            stone: {
                runs: number;
                elixirValue: number;
            };
            casebox: {
                runs: number;
                elixirValue: number;
            };
            earned: Record<string, number>;
        }[];
        totals: {
            runs: number;
            elixirValue: number;
            feeShare: number;
            roiPct: number;
        };
    }>;
    runDuePlans(): Promise<void>;
    private runDuePlan;
    private runStone;
    private runCase;
    private elixirValueOf;
    private recordRun;
    private bumpSkipped;
    private touchRun;
    private publicSub;
}
