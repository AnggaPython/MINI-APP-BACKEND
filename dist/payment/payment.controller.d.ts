import { PaymentService } from './payment.service';
import type { Request, Response } from 'express';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    depositToken(body: {
        telegramId: string;
        amount: number;
    }): Promise<{
        success: boolean;
        paymentUrl: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        paymentUrl?: undefined;
    }>;
    withdrawToken(body: {
        telegramId: string;
        amount: number;
        coin: string;
        wallet: string;
        tier?: string;
    }): Promise<{
        success: boolean;
        msg: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
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
    handleWebhook(req: Request, res: Response, headers: any): Promise<Response<any, Record<string, any>>>;
}
