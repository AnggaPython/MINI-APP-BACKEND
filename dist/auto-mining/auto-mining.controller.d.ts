import { AutoMiningService } from "./auto-mining.service";
export declare class AutoMiningController {
    private readonly autoMiningService;
    constructor(autoMiningService: AutoMiningService);
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
            usedStone: number;
            usedCase: number;
            used: number;
            left: number;
            quota: number;
        };
        daysLeft: number;
        inWindow: boolean;
    } | {
        success: boolean;
        error: string;
    }>;
    stats(telegramId: string, days?: string): Promise<{
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
    } | {
        success: boolean;
        error: string;
    }>;
    subscribe(telegramId: string, body: {
        target?: string;
        splitStonePct?: number;
        startDate?: string;
        stopDate?: string;
        claimMode?: string;
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
    toggle(telegramId: string, body: {
        on?: boolean;
    }): Promise<{
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
    } | {
        success: boolean;
        error: string;
    }>;
    cancel(telegramId: string): Promise<{
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
    } | {
        success: boolean;
        error: string;
    }>;
}
