import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { AdminDocument } from './schemas/admin.schema';
import { ProfitLogDocument } from './schemas/profit-log.schema';
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
        token: any;
        role: any;
        error?: undefined;
    }>;
    addProfit(coin: string, amount: number, source: string, telegramId: string): Promise<void>;
    getProfitBalances(): Promise<any>;
    getProfitLogs(coin?: string): Promise<any>;
    getWithdrawLimits(): Promise<Record<string, number>>;
    updateWithdrawLimit(coin: string, limit: number): Promise<Record<string, number>>;
}
