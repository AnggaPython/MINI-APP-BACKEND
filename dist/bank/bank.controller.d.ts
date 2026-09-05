import { BankService } from "./bank.service";
export declare class BankController {
    private readonly bankService;
    constructor(bankService: BankService);
    getStats(telegramId: string): Promise<{
        error: string;
        success?: undefined;
        stats?: undefined;
    } | {
        success: boolean;
        stats: {
            activeStakes: any;
            history: any;
            totalUnclaimedEarning: number;
            totalLiquidityPool: number;
            networkStaked: number;
            personalStaked: any;
        };
        error?: undefined;
    }>;
    stake(telegramId: string, body: {
        amount: number;
        durationDays: number;
        rate: number;
        autoClaim?: boolean;
    }): Promise<{
        success: boolean;
        stake: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    claimYield(telegramId: string): Promise<{
        success: boolean;
        claimedAmount: number;
        error?: undefined;
    } | {
        error: string;
    }>;
    unstake(telegramId: string, body: {
        stakeId: string;
    }): Promise<{
        success: boolean;
        returnAmount: number;
        penaltyMatured: boolean;
        error?: undefined;
    } | {
        error: string;
    }>;
    toggleStakeConfig(telegramId: string, body: {
        stakeId: string;
        autoClaim?: boolean;
        autoReinvest?: boolean;
    }): Promise<{
        success: boolean;
        stake: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    toggleGlobalStakeConfig(telegramId: string, body: {
        field: "autoClaim" | "autoReinvest";
        state: boolean;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
}
