import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    // User Provided CCPayment Secrets
    private readonly appId = 'I7YTwbXVHbXGiSEb';
    private readonly appSecret = '68e3e1e7db332c9f79a0843919619781';

    constructor(
        @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
        @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
        @Inject(forwardRef(() => AdminService)) private adminService: AdminService
    ) { }

    // Creates an invoice URL for Elixir top-up
    async createDepositCharge(telegramId: string, amountElixir: number) {
        // Valuation mapping: 10,000 ELIXIR = $1 USD.
        const usdAmount = amountElixir / 10000;

        const payload = {
            orderId: `DEP_${Date.now()}_${telegramId}`,
            price: usdAmount.toFixed(2), // V2 strictly expects max 2 decimals for FIAT
            name: `${amountElixir} ELIXIR Deposit`,
            priceFiatId: 1033, // CCPayment V2 explicit uint64 identifier for USD
            customValue: telegramId.toString(),
            returnUrl: "https://mini-app-nine-mu.vercel.app/add-elixir", // Redirects user back to Mini-App Interface
            notifyUrl: "https://mini-app-backend-production-30ea.up.railway.app/payment/webhook" // CCPayment Server-to-Server hit
        };

        const rawBody = JSON.stringify(payload);
        const timestamp = Math.floor(Date.now() / 1000).toString();

        // Official CCPayment HMAC-SHA256 signature sequence: Appid + Timestamp + JSON Body
        const signatureText = this.appId + timestamp + rawBody;
        const signHeader = crypto.createHmac('sha256', this.appSecret).update(signatureText).digest('hex');

        try {
            const res = await fetch('https://ccpayment.com/ccpayment/v2/createInvoiceUrl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Appid': this.appId,
                    'Timestamp': timestamp,
                    'Sign': signHeader
                },
                body: rawBody
            });

            const data = await res.json();
            if (data.code === 10000 && data.data && data.data.invoiceUrl) {
                return { success: true, paymentUrl: data.data.invoiceUrl };
            }
            return { success: false, error: data.msg || 'Gateway rejected payload' };
        } catch (e) {
            this.logger.error("Create Deposit Failed", e);
            return { success: false, error: 'Internal server error while reaching CCPayment.' };
        }
    }

    // CCPayment V2 Explicit Coin IDs (Extracted via API getCoinList)
    private readonly coinMap: Record<string, number> = {
        'USDT': 1280,
        'PEPE': 1877,
        'ETH': 1161,
        'SOL': 1186,
        'MATIC': 1329, // Listed as POL natively
        'ARB': 1296,
        'USDC': 1282,
        'LINK': 1207
    };

    private getHeaders(rawBody: string, timestamp: string) {
        const signatureText = this.appId + timestamp + rawBody;
        const signHeader = crypto.createHmac('sha256', this.appSecret).update(signatureText).digest('hex');
        return {
            'Content-Type': 'application/json',
            'Appid': this.appId,
            'Timestamp': timestamp,
            'Sign': signHeader
        };
    }

    private async refillTreasuryLiquidityViaSwap(targetCoinId: number, requiredAmount: number): Promise<boolean> {
        const USDC_COIN_ID = 1282; // Shifted from USDT to USDC as Treasury Base
        if (targetCoinId === USDC_COIN_ID) return false;

        try {
            let ts = Math.floor(Date.now() / 1000).toString();
            const pricePayload = JSON.stringify({ coinIds: [targetCoinId] });
            const priceRes = await fetch('https://ccpayment.com/ccpayment/v2/getCoinUSDTPrice', {
                method: 'POST',
                headers: this.getHeaders(pricePayload, ts),
                body: pricePayload
            });
            const priceData = await priceRes.json();
            if (priceData.code !== 10000 || !priceData.data.prices[targetCoinId.toString()]) return false;

            // USDC is ~ 1:1 with USDT, we can safely use the USDT price index
            const coinUsdtPrice = parseFloat(priceData.data.prices[targetCoinId.toString()]);
            let neededUsdc = requiredAmount * coinUsdtPrice;
            let inputUsdc = (neededUsdc * 1.02) + 0.2; // 2% buffer + flat fee boundary margin

            ts = Math.floor(Date.now() / 1000).toString();
            const estPayload = JSON.stringify({
                coinIdIn: USDC_COIN_ID,
                amountIn: inputUsdc.toFixed(6),
                coinIdOut: targetCoinId
            });
            const estRes = await fetch('https://ccpayment.com/ccpayment/v2/estimate', {
                method: 'POST',
                headers: this.getHeaders(estPayload, ts),
                body: estPayload
            });
            const estData = await estRes.json();
            if (estData.code !== 10000) return false;

            const netAmountOut = parseFloat(estData.data.netAmountOut);
            if (netAmountOut < requiredAmount) return false; // Failsafe abort

            ts = Math.floor(Date.now() / 1000).toString();
            const orderId = `SWP_${Date.now()}_${targetCoinId}`;
            const swapPayload = JSON.stringify({
                orderId,
                coinIdIn: USDC_COIN_ID,
                amountIn: inputUsdc.toFixed(6),
                coinIdOut: targetCoinId,
                amountOutMinimum: requiredAmount.toFixed(8)
            });
            const swapRes = await fetch('https://ccpayment.com/ccpayment/v2/swap', {
                method: 'POST',
                headers: this.getHeaders(swapPayload, ts),
                body: swapPayload
            });
            const swapData = await swapRes.json();
            if (swapData.code !== 10000) return false;

            const recordId = swapData.data.recordId;

            for (let i = 0; i < 6; i++) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                ts = Math.floor(Date.now() / 1000).toString();
                const pollPayload = JSON.stringify({ recordId });
                const pollRes = await fetch('https://ccpayment.com/ccpayment/v2/getSwapRecord', {
                    method: 'POST',
                    headers: this.getHeaders(pollPayload, ts),
                    body: pollPayload
                });
                const pollData = await pollRes.json();

                if (pollData.code === 10000) {
                    if (pollData.data.record.status === 'Success') return true;
                    if (pollData.data.record.status === 'Failed') return false;
                }
            }
            return false;
        } catch (error) {
            console.error("Auto Swap Error:", error);
            return false;
        }
    }

    // Creates a withdrawal request from Merchant -> User
    async createWithdrawRequest(telegramId: string, coin: string, amount: number, walletAddress: string, tier: string = 'standard') {
        if (amount <= 0) return { success: false, error: 'Invalid amount' };

        // Process Advance / On-chain split fees
        let executionAmount = amount;
        if (tier === 'advance') {
            executionAmount = amount * 0.985; // 1.5% Cut
        } else if (tier === 'onchain') {
            executionAmount = amount * 0.965; // 3.5% Cut
        }

        // 1. Debit exact Crypto immediately from user DB (we still debit the theoretical gross `amount` from their balance)
        const debited = await this.usersService.debitCrypto(telegramId, coin, amount);
        if (!debited) return { success: false, error: 'Insufficient crypto balance' };

        // Route profit margin (Tier Cut) to Admin Profit Pool
        const withdrawalMargin = amount - executionAmount;
        if (withdrawalMargin > 0) {
            await this.adminService.addProfit(coin.toUpperCase(), withdrawalMargin, 'WITHDRAW_FEE', telegramId);
        }

        // 2. Identify the Coin ID for CCPayment V2
        const coinId = this.coinMap[coin.toUpperCase()];
        if (!coinId) {
            await this.usersService.creditCrypto(telegramId, coin, amount);
            return { success: false, error: 'Unsupported withdrawal token' };
        }

        const triggerWithdraw = async () => {
            const timestamp = Math.floor(Date.now() / 1000).toString();

            if (tier === 'onchain') {
                const payload = {
                    orderId: `WD_ON_${Date.now()}_${telegramId}`,
                    address: walletAddress,
                    amount: executionAmount.toFixed(8),
                    coinId: coinId,
                    chain: 'SOL' // Forcing SOL architecture due to On-chain Solana wallet bind
                };
                const rawBody = JSON.stringify(payload);
                const res = await fetch('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToNetwork', {
                    method: 'POST',
                    headers: this.getHeaders(rawBody, timestamp),
                    body: rawBody
                });
                return await res.json();
            } else {
                const payload = {
                    orderId: `WD_${Date.now()}_${telegramId}`,
                    cwalletUser: walletAddress,
                    amount: executionAmount.toFixed(8),
                    coinId: coinId
                };
                const rawBody = JSON.stringify(payload);
                const res = await fetch('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToCwallet', {
                    method: 'POST',
                    headers: this.getHeaders(rawBody, timestamp),
                    body: rawBody
                });
                return await res.json();
            }
        };

        try {
            let data = await triggerWithdraw();

            // Intercept Code 14000: Insufficient Balance. Execute automated USDC fallback
            if (data.code === 14000) {
                this.logger.warn(`Insufficient Treasury Balance (Code 14000). Triggering Auto-Swap Bridge for ${coin}...`);
                // Use executionAmount because that's what we requested from CCPayment
                const refilled = await this.refillTreasuryLiquidityViaSwap(coinId, executionAmount);
                if (refilled) {
                    this.logger.log(`Auto-Swap Bridge Successful. Re-attempting Withdrawal...`);
                    data = await triggerWithdraw();
                } else {
                    this.logger.warn(`Auto-Swap Bridge failed for ${coin}.`);
                }
            }

            if (data.code === 10000) {
                let displayStatus: string = tier === 'onchain' ? 'pending' : 'complete';
                await this.txModel.create({
                    telegramId,
                    type: 'WITHDRAW',
                    coin: coin.toUpperCase(),
                    amount: executionAmount,
                    tier: tier.toUpperCase(),
                    status: displayStatus
                });
                return { success: true, msg: `Withdrawal of ${amount} ${coin} to ${walletAddress} processed successfully` };
            }

            // Refund on failure
            await this.usersService.creditCrypto(telegramId, coin, amount);
            await this.txModel.create({
                telegramId,
                type: 'WITHDRAW',
                coin: coin.toUpperCase(),
                amount: executionAmount,
                tier: tier.toUpperCase(),
                status: 'reject'
            });
            return { success: false, error: data.msg || 'CCPayment V2 Gateway rejected payload' };
        } catch (e) {
            this.logger.error("Create Withdrawal Failed", e);
            await this.usersService.creditCrypto(telegramId, coin, amount);
            return { success: false, error: 'Network failure. Balance refunded.' };
        }
    }

    // Robust multi-vector Webhook Signature Verification 
    verifyWebhookSignature(headers: any, rawBody: string): boolean {
        const sign = headers['sign'] || headers['x-signature'];
        const timestamp = headers['timestamp'] || '';

        if (!sign) return false;

        // Try direct body hash (as documented in some older ccpayment SDKs)
        const hash1 = crypto.createHmac('sha256', this.appSecret).update(rawBody).digest('hex');
        if (hash1 === sign) return true;

        // Try modern Appid + timestamp + rawBody (Official v1/v2 schema)
        const text2 = this.appId + timestamp + rawBody;
        const hash2 = crypto.createHmac('sha256', this.appSecret).update(text2).digest('hex');
        if (hash2 === sign) return true;

        // Try timestamp + rawBody fallback
        const text3 = timestamp + rawBody;
        const hash3 = crypto.createHmac('sha256', this.appSecret).update(text3).digest('hex');
        if (hash3 === sign) return true;

        return false; // Forged or invalid request -> Reject
    }

    async handleWebhook(event: any) {
        this.logger.log('Receiving Webhook Event from CCPayment: ', event);

        // Required by CCPayment setup tester
        if (event.type === 'ActivateWebhookURL') {
            this.logger.log('CCPayment Webhook Activated successfully');
            return { success: true, processed: true, activation: true };
        }

        // Status 2 is typically "Successful Payment" in CCPayment
        if (event.status !== 'Successful' && event.status !== 2) {
            return { success: true, processed: false, reason: 'Status is not paid' };
        }

        const telegramId = event.customValue;
        if (!telegramId) return { success: true, processed: false, reason: 'No identifier attached' };

        // We deduce ELIXIR quantity logic backward from USD
        // Or if we know the order string e.g. "500 ELIXIR Deposit"
        let elixirAmount = 0;

        // Match string: "500 ELIXIR Deposit"
        if (event.productName) {
            const match = event.productName.match(/^([0-9\.]+)\s+ELIXIR/);
            if (match && match[1]) {
                elixirAmount = parseFloat(match[1]);
            }
        }

        if (elixirAmount <= 0) {
            return { success: true, processed: false, reason: 'Invalid or zero ELIXIR payload' };
        }

        // Top up user's Elixir Balance
        await this.usersService.creditRewardAndLogTask(telegramId, elixirAmount, `DEP_CCPAYMENT_${event.orderId || Date.now()}`);

        const cryptoSymbol = event.coinSymbol || event.crypto || 'USDT';
        const cryptoAmountStr = event.amount || event.cryptoAmount || '0';
        await this.txModel.create({
            telegramId,
            type: 'DEPOSIT',
            coin: cryptoSymbol.toUpperCase(),
            amount: parseFloat(cryptoAmountStr) || elixirAmount,
            tier: 'STANDARD',
            status: 'complete'
        });

        return { success: true, processed: true, credited: elixirAmount };
    }

    async getTransactions(telegramId: string) {
        const txs = await this.txModel.find({ telegramId }).sort({ createdAt: -1 }).limit(100).exec();
        return { success: true, transactions: txs };
    }
}
