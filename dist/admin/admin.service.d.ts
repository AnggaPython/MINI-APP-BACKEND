import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { AdminDocument } from './schemas/admin.schema';
import { ProfitLog, ProfitLogDocument } from './schemas/profit-log.schema';
export declare class AdminService implements OnModuleInit {
    private adminModel;
    private profitLogModel;
    constructor(adminModel: Model<AdminDocument>, profitLogModel: Model<ProfitLogDocument>);
    onModuleInit(): Promise<void>;
    authenticate(username: string, passwordString: string, ip?: string): Promise<{
        error: string;
        success?: undefined;
        token?: undefined;
        role?: undefined;
    } | {
        success: boolean;
        token: string;
        role: string;
        error?: undefined;
    }>;
    addProfit(coin: string, amount: number, source: string, telegramId: string): Promise<void>;
    getProfitBalances(): Promise<Record<string, number>>;
    getProfitLogs(coin?: string): Promise<(import("mongoose").Document<unknown, {}, ProfitLogDocument, {}, import("mongoose").DefaultSchemaOptions> & ProfitLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getWithdrawLimits(): Promise<Record<string, number>>;
    updateWithdrawLimit(coin: string, limit: number): Promise<Record<string, number>>;
}
