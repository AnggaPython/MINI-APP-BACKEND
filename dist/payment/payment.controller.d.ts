import { PaymentService } from "./payment.service";
import type { Request, Response } from "express";
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    depositToken(body: {
        amount: number;
        telegramId?: string;
    }, telegramId: string): Promise<{
        success: boolean;
        paymentUrl: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        paymentUrl?: undefined;
    }>;
    withdrawToken(body: {
        amount: number;
        coin: string;
        wallet: string;
        telegramId?: string;
        tier?: string;
    }, telegramId: string): Promise<{
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
    getTransactions(id: string): Promise<{
        success: boolean;
        transactions: (import("mongoose").Document<unknown, {}, import("./schemas/transaction.schema").TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/transaction.schema").Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
    }>;
    syncDeposit(body: {
        orderId: string;
        telegramId?: string;
    }, telegramId: string): Promise<{
        success: boolean;
        msg: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    handleWebhook(req: Request, res: Response, headers: any): Promise<Response<any, Record<string, any>>>;
}
