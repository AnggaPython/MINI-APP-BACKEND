import { UsersService } from '../users/users.service';
import { Model } from 'mongoose';
import { TransactionDocument } from './schemas/transaction.schema';
import { AdminService } from '../admin/admin.service';
import { CircularCasinoService } from '../admin/circular-casino.service';
export declare class PaymentService {
    private usersService;
    private txModel;
    private adminService;
    private circularCasino;
    private readonly logger;
    private readonly appId;
    private readonly appSecret;
    private readonly proxyAgent;
    constructor(usersService: UsersService, txModel: Model<TransactionDocument>, adminService: AdminService, circularCasino: CircularCasinoService);
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
    private readonly chainMap;
    private getHeaders;
    private refillTreasuryLiquidityViaSwap;
    createWithdrawRequest(telegramId: string, coin: string, amount: number, walletAddress: string, tier?: string): Promise<{
        success: boolean;
        error: string;
        banned: boolean;
        msg?: undefined;
    } | {
        success: boolean;
        msg: string;
        error?: undefined;
        banned?: undefined;
    } | {
        success: boolean;
        error: any;
        banned?: undefined;
        msg?: undefined;
    }>;
    verifyWebhookSignature(headers: any, rawBody: string): boolean;
    handleWebhook(event: any): Promise<{
        success: boolean;
        processed: boolean;
        activation: boolean;
        reason?: undefined;
        withdrawal?: undefined;
        credited?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        processed: boolean;
        reason: string;
        activation?: undefined;
        withdrawal?: undefined;
        credited?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        processed: boolean;
        activation: boolean;
        withdrawal: boolean;
        reason?: undefined;
        credited?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        processed: boolean;
        credited: number;
        user: any;
        activation?: undefined;
        reason?: undefined;
        withdrawal?: undefined;
    }>;
    getTransactions(telegramId: string): Promise<{
        success: boolean;
        transactions: any;
    }>;
}
