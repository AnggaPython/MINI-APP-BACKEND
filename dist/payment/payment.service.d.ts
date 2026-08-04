import { UsersService } from '../users/users.service';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
export declare class PaymentService {
    private usersService;
    private txModel;
    private readonly logger;
    private readonly appId;
    private readonly appSecret;
    constructor(usersService: UsersService, txModel: Model<TransactionDocument>);
    createDepositCharge(telegramId: string, amountElixir: number): Promise<{
        success: boolean;
        paymentUrl: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        paymentUrl?: undefined;
    }>;
    private readonly coinMap;
    private getHeaders;
    private refillTreasuryLiquidityViaSwap;
    createWithdrawRequest(telegramId: string, coin: string, amount: number, walletAddress: string, tier?: string): Promise<{
        success: boolean;
        msg: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        msg?: undefined;
    }>;
    verifyWebhookSignature(headers: any, rawBody: string): boolean;
    handleWebhook(event: any): Promise<{
        success: boolean;
        processed: boolean;
        reason: string;
        credited?: undefined;
    } | {
        success: boolean;
        processed: boolean;
        credited: number;
        reason?: undefined;
    }>;
    getTransactions(telegramId: string): Promise<{
        success: boolean;
        transactions: (import("mongoose").Document<unknown, {}, TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
    }>;
}
