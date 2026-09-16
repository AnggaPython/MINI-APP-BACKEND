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
            activeStakes: {
                id: import("mongoose").Types.ObjectId;
                amount: number;
                aprLabel: string;
                rate: number;
                stakeDate: Date;
                maturityDate: Date;
                pendingYield: number;
                autoClaim: boolean;
                autoReinvest: boolean;
            }[];
            history: (import("mongoose").Document<unknown, {}, import("./schemas/bank-log.schema").BankLogDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/bank-log.schema").BankLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            } & {
                id: string;
            })[];
            totalUnclaimedEarning: number;
            totalLiquidityPool: number;
            networkStaked: number;
            personalStaked: number;
        };
        error?: undefined;
    }>;
    stake(telegramId: string, body: {
        amount: number;
        durationDays: number;
        rate?: number;
        autoClaim?: boolean;
    }): Promise<{
        success: boolean;
        stake: import("mongoose").Document<unknown, {}, import("./schemas/stake.schema").StakeDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/stake.schema").Stake & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
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
        stake: import("mongoose").Document<unknown, {}, import("./schemas/stake.schema").StakeDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/stake.schema").Stake & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
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
