import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as crypto from 'crypto';
import { UsersService, getUserVipRank } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { AdminService } from '../admin/admin.service';
import { CircularCasinoService } from '../admin/circular-casino.service';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    // User Provided CCPayment Secrets
    private readonly appId = 'I7YTwbXVHbXGiSEb';
    private readonly appSecret = '68e3e1e7db332c9f79a0843919619781';

    // Fixie Static Proxy for CCPayment Merchant IP Whitelisting
    private readonly proxyAgent = new HttpsProxyAgent('http://fixie:1DUZEWZyTCkL8HB@criterium.usefixie.com:80');

    constructor(
        @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
        @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
        @Inject(forwardRef(() => AdminService)) private adminService: AdminService,
        @Inject(forwardRef(() => CircularCasinoService)) private circularCasino: CircularCasinoService
    ) { }

    // Creates an invoice URL for Elixir top-up
    async createDepositCharge(telegramId: string, amountElixir: number) {
        // Valuation mapping: 10,000 ELIXIR = $1 USD.
        const usdAmount = amountElixir / 10000;

        const payload = {
            orderId: `DEP_${telegramId}_${Date.now()}`,
            price: usdAmount.toFixed(2), // V2 strictly expects max 2 decimals for FIAT
            product: `${amountElixir} ELIXIR Deposit`,
            priceFiatId: 1033, // CCPayment V2 explicit uint64 identifier for USD (pass either priceFiatId XOR priceCoinId, NOT both)
            returnUrl: "https://mini-app-nine-mu.vercel.app/add-elixir", // Redirects user back to Mini-App Interface
            notifyUrl: "https://mini-app-backend-production-30ea.up.railway.app/payment/webhook" // CCPayment Server-to-Server hit
        };

        const rawBody = JSON.stringify(payload);
        const timestamp = Math.floor(Date.now() / 1000).toString();

        // Official CCPayment HMAC-SHA256 signature sequence: Appid + Timestamp + JSON Body
        try {
            const res = await fetch('https://ccpayment.com/ccpayment/v2/createInvoiceUrl', {
                method: 'POST',
                headers: this.getHeaders(rawBody, timestamp),
                body: rawBody,
                agent: this.proxyAgent
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

    // CCPayment V2 Explicit Coin IDs + Matching default On-Chain Withdraw Chain Symbols
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

    // Default primary network for On-Chain withdrawals (per coin) — keep aligned with merchant token list
    private readonly chainMap: Record<string, string> = {
        'USDT': 'SOL',
        'PEPE': 'ETH',
        'ETH': 'ETH',
        'SOL': 'SOL',
        'MATIC': 'POL',
        'ARB': 'ARB',
        'USDC': 'SOL',
        'LINK': 'ETH',
        'TIA': 'CELESTIA',
        'INJ': 'INJECTIVE',
        'DYM': 'ROLLUX',
        'DOT': 'POLKADOT',
        'CRO': 'CRONOS'
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

            if (priceData.code !== 10000 || !priceData.data.prices[targetCoinId.toString()]) {
                this.logger.error(`[SWAP ERROR] Failed to fetch price for coin ${targetCoinId}: ${JSON.stringify(priceData)}`);
                return false;
            }

            // USDC is ~ 1:1 with USDT, we can safely use the USDT price index
            const coinUsdtPrice = parseFloat(priceData.data.prices[targetCoinId.toString()]);
            let neededUsdc = requiredAmount * coinUsdtPrice;
            let inputUsdc = (neededUsdc * 1.02) + 0.2; // 2% buffer + flat fee boundary margin

            // EXTREMELY CRITICAL: CCPayment V2 Swap API rejects any swap under ~$0.3 USD.
            if (inputUsdc < 0.35) {
                inputUsdc = 0.35;
            }

            this.logger.log(`[SWAP INFO] Attempting to swap ${inputUsdc} USDC for coinId ${targetCoinId}`);

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
            if (estData.code !== 10000) {
                this.logger.error(`[SWAP ERROR] Estimate API Failed: ${JSON.stringify(estData)}`);
                return false;
            }

            const netAmountOut = parseFloat(estData.data.netAmountOut);
            if (netAmountOut < requiredAmount) {
                this.logger.error(`[SWAP ERROR] Net Amount Out (${netAmountOut}) is less than required (${requiredAmount})`);
                return false; // Failsafe abort
            }

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
            if (swapData.code !== 10000) {
                this.logger.error(`[SWAP ERROR] Execute API Failed: ${JSON.stringify(swapData)}`);
                return false;
            }

            const recordId = swapData.data.recordId;
            this.logger.log(`[SWAP INFO] Swap order ${orderId} submitted successfully. Record ID: ${recordId}. Awaiting completion...`);

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
                    if (pollData.data.record.status === 'Success') {
                        this.logger.log(`[SWAP INFO] Swap Completed Successfully!`);
                        return true;
                    }
                    if (pollData.data.record.status === 'Failed') {
                        this.logger.error(`[SWAP ERROR] Swap Record marked as Failed: ${JSON.stringify(pollData.data.record)}`);
                        return false;
                    }
                }
            }
            this.logger.error(`[SWAP ERROR] Poll timeout exceeded for swap ${recordId}`);
            return false;
        } catch (error) {
            this.logger.error("[SWAP ERROR] Unknown Auto Swap Crash:", error);
            return false;
        }
    }

    // Creates a withdrawal request from Merchant -> User
    async createWithdrawRequest(telegramId: string, coin: string, amount: number, walletAddress: string, tier: string = 'standard') {
        if (amount <= 0) return { success: false, error: 'Invalid amount' };
        if (coin.toUpperCase() === 'PEPE' && amount < 1500) return { success: false, error: 'Minimum withdrawal for PEPE is 1500' };

        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user) return { success: false, error: 'User not found' };
        if (user.isBanned) {
            return { success: false, error: 'Your account has been blocked. Please contact support to appeal.', banned: true };
        }

        // Fetch live USD value strictly to authenticate subsidiary eligibility
        let liveUsdPrice = coin.toUpperCase() === 'PEPE' ? 0.0000045 : 1;
        const geckoIds: Record<string, string> = { 'PEPE': 'pepe', 'MATIC': 'matic-network', 'ETH': 'ethereum', 'USDT': 'tether', 'USDC': 'usd-coin', 'SOL': 'solana' };
        const geckoId = geckoIds[coin.toUpperCase()];
        if (geckoId) {
            try {
                const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
                const priceData = await priceRes.json();
                if (priceData[geckoId]?.usd) {
                    liveUsdPrice = priceData[geckoId].usd;
                }
            } catch (e) {
                // Fallback to static baseline if Coingecko is completely offline
            }
        }
        const usdValue = amount * liveUsdPrice;
        const isBonusEligible = usdValue >= 0.3;

        // --- NET EQUITY TRACKING + STANDARD FEE (Anti Whale Pattern di ZERO-SUM ENGINE LAYER 1, friction withdraw longgar disini) ---
        let whaleFeePct = 0;
        let whaleFeeReason = 'normal';
        try {
            const eq = await this.circularCasino.getUserEquity(
                telegramId,
                user.firstName || null,
                (user as any).username || null
            );
            const fee = this.circularCasino.computeWithdrawFeePercent(eq);
            whaleFeePct = fee.feePct;
            whaleFeeReason = fee.reason;
            eq.totalDepositedElixir = (eq.totalDepositedElixir || 0);
            eq.lastActiveAt = new Date();
            await eq.save();
        } catch (_e) { /* ignore circular if unavailable */ }

        // --- VIP ENFORCEMENT WITH MUTEX LOCK ---
        const locked = await this.usersService.lockUserForWithdrawal(telegramId);
        if (!locked) {
            return { success: false, error: 'A withdrawal is currently processing, please wait.' };
        }

        try {
            const vipRank = getUserVipRank(user.exp || 0);

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const todaysTxs = await this.txModel.find({
                telegramId, type: 'WITHDRAW', createdAt: { $gte: startOfDay }
            }).exec();

            // 1. Check Count Limit
            if (todaysTxs.length >= vipRank.wdLimit) {
                return { success: false, error: `Daily withdrawal limit of ${vipRank.wdLimit} reached for ${vipRank.name} tier.` };
            }

            // 2. Check USD Volume Limit
            let pastUsdVolume = 0;
            for (const tx of todaysTxs) {
                const p = tx.coin === 'PEPE' ? 0.0000045 : (tx.coin === 'SOL' ? 150 : (tx.coin === 'ETH' ? 3000 : 1));
                pastUsdVolume += (tx.amount * p);
            }

            if ((pastUsdVolume + usdValue) > vipRank.maxWdUsd) {
                return { success: false, error: `Daily limit of $${vipRank.maxWdUsd} USD reached for ${vipRank.name} tier.` };
            }
            // ------------------------

            // Process Advance / On-chain split fees
            let executionAmount = amount;
            if (tier === 'advance') {
                executionAmount = amount * 0.985; // 1.5% Cut
            } else if (tier === 'onchain') {
                const cryptoFee = 0.5 / liveUsdPrice;
                executionAmount = amount - cryptoFee;
                if (executionAmount <= 0) {
                    return { success: false, error: 'Withdrawal size too small to cover the $0.5 flat network fee' };
                }
            } else if (tier === 'standard' && isBonusEligible) {
                executionAmount = amount * 1.03; // 3% Bonus Subsidy
            }

            // Apply Anti-Whale Gradient Withdraw Tax (stacked on top of tier fees)
            let whaleTaxCrypto = 0;
            if (whaleFeePct > 0 && executionAmount > 0) {
                whaleTaxCrypto = Math.floor(executionAmount * whaleFeePct * 1e8) / 1e8;
                executionAmount = Math.max(0, executionAmount - whaleTaxCrypto);
            }

            // 1. Debit exact Crypto immediately from user DB (we still debit the theoretical gross `amount` from their balance)
            const debited = await this.usersService.debitCrypto(telegramId, coin, amount);
            if (!debited) return { success: false, error: 'Insufficient crypto balance' };

            // Route profit margin (Tier Cut or Subsidy Deduct) to Admin Profit Pool
            let withdrawalMarginToAdmin = amount - executionAmount;

            // CCPayment strictly slices $0.25 as network toll for On-Chain, so Admin receives only the remaining margin
            if (tier === 'onchain') {
                const ccPaymentToll = 0.25 / liveUsdPrice;
                withdrawalMarginToAdmin = withdrawalMarginToAdmin - ccPaymentToll;
            }

            if (withdrawalMarginToAdmin !== 0) {
                const marginSource = withdrawalMarginToAdmin < 0 ? 'WITHDRAW_FEE_SUBSIDY' : 'WITHDRAW_FEE';
                await this.adminService.addProfit(coin.toUpperCase(), withdrawalMarginToAdmin, marginSource, telegramId);
            }

            // Also register margin to CIRCULAR treasury for dashboard stats
            try {
                if (withdrawalMarginToAdmin > 0) {
                    const marginUsdValue = withdrawalMarginToAdmin * liveUsdPrice;
                    const elixirEquivalentFee = Math.floor(marginUsdValue * 10000);
                    if (elixirEquivalentFee > 0) await this.circularCasino.addWithdrawalFee(elixirEquivalentFee);
                }
                // Also record whale tax separately to circular admin pool + equity
                if (whaleTaxCrypto > 0) {
                    const whaleTaxUsdValue = whaleTaxCrypto * liveUsdPrice;
                    const elixirTax = Math.floor(whaleTaxUsdValue * 10000);
                    if (elixirTax > 0) await this.circularCasino.addWithdrawalFee(elixirTax);
                    const eq2 = await this.circularCasino.getUserEquity(telegramId);
                    this.circularCasino.onUserWithdrawSuccess(eq2,
                        Math.floor((executionAmount * liveUsdPrice) * 10000),
                        Math.floor(withdrawalMarginToAdmin * liveUsdPrice * 10000) + elixirTax
                    );
                    await eq2.save();
                } else {
                    const eq2 = await this.circularCasino.getUserEquity(telegramId);
                    this.circularCasino.onUserWithdrawSuccess(eq2,
                        Math.floor((executionAmount * liveUsdPrice) * 10000),
                        Math.floor(withdrawalMarginToAdmin * liveUsdPrice * 10000)
                    );
                    await eq2.save();
                }
            } catch (_e2) { /* ignore circular secondary */ }

            // 2. Identify the Coin ID for CCPayment V2
            const coinId = this.coinMap[coin.toUpperCase()];
            if (!coinId) {
                await this.usersService.creditCrypto(telegramId, coin, amount);
                return { success: false, error: 'Unsupported withdrawal token' };
            }

            const triggerWithdraw = async () => {
                const timestamp = Math.floor(Date.now() / 1000).toString();

                if (tier === 'onchain') {
                    const withdrawChain = this.chainMap[coin.toUpperCase()] || 'SOL';
                    const payload = {
                        orderId: `WD_ON_${telegramId}_${Date.now()}`,
                        address: walletAddress,
                        amount: executionAmount.toFixed(8),
                        coinId: coinId,
                        chain: withdrawChain,
                        merchantPayNetworkFee: false, // User pays network fee from their withdrawal amount
                        notifyUrl: "https://mini-app-backend-production-30ea.up.railway.app/payment/webhook"
                    };
                    const rawBody = JSON.stringify(payload);
                    const res = await fetch('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToNetwork', {
                        method: 'POST',
                        headers: this.getHeaders(rawBody, timestamp),
                        body: rawBody,
                        agent: this.proxyAgent
                    });
                    return await res.json();
                } else {
                    const payload = {
                        orderId: `WD_${telegramId}_${Date.now()}`,
                        cwalletUser: walletAddress,
                        amount: executionAmount.toFixed(8),
                        coinId: coinId
                    };
                    const rawBody = JSON.stringify(payload);
                    const res = await fetch('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToCwallet', {
                        method: 'POST',
                        headers: this.getHeaders(rawBody, timestamp),
                        body: rawBody,
                        agent: this.proxyAgent
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
                    await this.txModel.create({
                        telegramId,
                        type: 'WITHDRAW',
                        coin: coin.toUpperCase(),
                        amount: executionAmount,
                        tier: tier.toUpperCase(),
                        status: 'complete'
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
        } finally {
            await this.usersService.unlockUserWithdrawal(telegramId);
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
        this.logger.log('Receiving Webhook Event from CCPayment: ', JSON.stringify(event));

        // Required by CCPayment setup tester
        if (event.type === 'ActivateWebhookURL') {
            this.logger.log('CCPayment Webhook Activated successfully');
            return { success: true, processed: true, activation: true };
        }

        // Unwrap nested V2 webhook payload: { type, msg: {...} } or flat { status, orderId, ... }
        const payload = event.msg ? event.msg : event;
        const eventType = event.type || '';

        // Official V2 statuses: WaitingApproval / Rejected / Processing / Success / Failed — plus legacy 2 = Success
        const status = payload.status;
        if (status !== 'Success' && status !== 2 && status !== 'Successful') {
            this.logger.log(`CCPayment Webhook skipped (not success): status=${status}, type=${eventType}`);
            return { success: true, processed: false, reason: `Status ${status} is not paid/success` };
        }

        // Resolve telegramId: V2 customValue MAY not exist — always fallback to orderId pattern DEP_<telegramId>_<timestamp>
        let telegramId = event.customValue || payload.customValue;
        const orderId = payload.orderId || event.orderId || '';
        if (!telegramId) {
            const depMatch = orderId.match(/^DEP_(\d+?)_/);
            if (depMatch && depMatch[1]) {
                telegramId = depMatch[1];
                this.logger.log(`[Webhook] Resolved telegramId ${telegramId} from orderId pattern: ${orderId}`);
            } else if (eventType === 'ApiWithdrawal' || orderId.startsWith('WD_')) {
                this.logger.log(`[Webhook] Withdrawal status update ${orderId} = ${status}, no credit needed.`);
                return { success: true, processed: true, activation: false, withdrawal: true };
            }
        }

        if (!telegramId) {
            this.logger.warn(`[Webhook] No telegramId could be resolved from orderId=${orderId}, customValue=${event.customValue || payload.customValue || 'N/A'}`);
            return { success: true, processed: false, reason: 'No identifier attached' };
        }

        // If ApiDeposit, it's missing amount data! We MUST query ccpayment API (section 7.5).
        let elixirAmount = 0;
        let usdAmt = 0;
        let cryptoSymbol = payload.coinSymbol || event.coinSymbol || payload.crypto || event.crypto || 'USDT';
        let cryptoAmountStr = payload.amount || event.amount || payload.cryptoAmount || event.cryptoAmount || '0';

        if (eventType === 'ApiDeposit' && orderId.startsWith('DEP_')) {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const rawBodyFn = JSON.stringify({ orderId });
            try {
                const resInfo = await fetch('https://ccpayment.com/ccpayment/v2/getInvoiceOrderInfo', {
                    method: 'POST',
                    headers: this.getHeaders(rawBodyFn, timestamp),
                    body: rawBodyFn,
                    agent: this.proxyAgent
                });
                const infoData = await resInfo.json();
                if (infoData.code === 10000 && infoData.data && infoData.data.paidList) {
                    const paidItem = infoData.data.paidList.find((p: any) => p.recordId === payload.recordId);
                    if (paidItem && paidItem.status === 'Success') {
                        usdAmt = parseFloat(paidItem.paidValue); // paidValue = fiat normalized
                        cryptoAmountStr = paidItem.paidAmount.toString();
                        cryptoSymbol = paidItem.coinSymbol;
                        if (usdAmt > 0) {
                            elixirAmount = Math.floor(usdAmt * 10000);
                            this.logger.log(`[Webhook] Fetched getInvoiceOrderInfo. Extracted ${elixirAmount} ELIXIR from $${usdAmt}`);
                        }
                    }
                }
            } catch (error) {
                this.logger.error("Failed to query getInvoiceOrderInfo", error);
            }
        }

        // Fallback or Legacy check
        if (elixirAmount <= 0) {
            const productField = payload.product || payload.productName || event.product || event.productName || '';
            if (productField) {
                const match = productField.match(/^([0-9\.]+)\s+ELIXIR/);
                if (match && match[1]) {
                    elixirAmount = parseFloat(match[1]);
                }
            }

            if (elixirAmount <= 0 && orderId.startsWith('DEP_')) {
                const priceFiat = parseFloat(payload.price || event.price || '0');
                if (priceFiat > 0) {
                    elixirAmount = Math.round(priceFiat * 10000);
                    this.logger.log(`[Webhook] Fallback: Derived ${elixirAmount} ELIXIR from USD price ${priceFiat}`);
                }
            }
        }

        if (elixirAmount <= 0) {
            this.logger.warn(`[Webhook] Invalid/zero ELIXIR payload for user ${telegramId}. orderId=${orderId}`);
            return { success: true, processed: false, reason: 'Invalid or zero ELIXIR payload' };
        }

        // Top up user's Elixir Balance
        // We MUST use recordId to guarantee idempotency across multiple partial payments on the same order!
        const logId = `DEP_CCPAYMENT_${payload.recordId || event.recordId || orderId || Date.now()}`;
        await this.usersService.creditRewardAndLogTask(telegramId.toString(), elixirAmount, logId);

        await this.txModel.create({
            telegramId: telegramId.toString(),
            type: 'DEPOSIT',
            coin: (cryptoSymbol as string).toUpperCase(),
            amount: parseFloat(cryptoAmountStr as string) || elixirAmount,
            tier: 'STANDARD',
            status: 'complete'
        });

        this.logger.log(`[Webhook] SUCCESS: Credited ${elixirAmount} ELIXIR to user ${telegramId} (orderId=${orderId}, recordId=${payload.recordId || ''})`);
        return { success: true, processed: true, credited: elixirAmount, user: telegramId };
    }

    async getTransactions(telegramId: string) {
        const txs = await this.txModel.find({ telegramId }).sort({ createdAt: -1 }).limit(100).exec();
        return { success: true, transactions: txs };
    }
}
