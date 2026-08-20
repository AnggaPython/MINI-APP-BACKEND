import { Model } from "mongoose";
import { Transaction } from "../payment/schemas/transaction.schema";
import { BankLog } from "../bank/schemas/bank-log.schema";
import { HiLoBet } from "../users/schemas/hilo-bet.schema";
export declare class HistoryService {
    private txModel;
    private bankLogModel;
    private hiloBetModel;
    constructor(txModel: Model<Transaction>, bankLogModel: Model<BankLog>, hiloBetModel: Model<HiLoBet>);
    getAggregatedHistory(telegramId: string, page: number, limit: number, filter: string): Promise<{
        success: boolean;
        filter: string;
        data: any[];
        hasMore: boolean;
        totalItems: number;
    }>;
}
