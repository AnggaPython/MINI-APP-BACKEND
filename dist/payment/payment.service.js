"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("./schemas/transaction.schema");
const admin_service_1 = require("../admin/admin.service");
const circular_casino_service_1 = require("../admin/circular-casino.service");
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_proxy_agent_1 = require("https-proxy-agent");
let PaymentService = PaymentService_1 = class PaymentService {
    usersService;
    txModel;
    adminService;
    circularCasino;
    logger = new common_1.Logger(PaymentService_1.name);
    appId = 'I7YTwbXVHbXGiSEb';
    appSecret = '68e3e1e7db332c9f79a0843919619781';
    proxyAgent = new https_proxy_agent_1.HttpsProxyAgent('http://fixie:1DUZEWZyTCkL8HB@criterium.usefixie.com:80');
    constructor(usersService, txModel, adminService, circularCasino) {
        this.usersService = usersService;
        this.txModel = txModel;
        this.adminService = adminService;
        this.circularCasino = circularCasino;
    }
    async createDepositCharge(telegramId, amountElixir) {
        const usdAmount = amountElixir / 10000;
        const payload = {
            orderId: `DEP_${telegramId}_${Date.now()}`,
            price: usdAmount.toFixed(2),
            product: `${amountElixir} ELIXIR Deposit`,
            priceFiatId: 1033,
            returnUrl: "https://mini-app-nine-mu.vercel.app/add-elixir",
            notifyUrl: "https://mini-app-backend-production-30ea.up.railway.app/payment/webhook"
        };
        const rawBody = JSON.stringify(payload);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        try {
            const res = await (0, node_fetch_1.default)('https://ccpayment.com/ccpayment/v2/createInvoiceUrl', {
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
        }
        catch (e) {
            this.logger.error("Create Deposit Failed", e);
            return { success: false, error: 'Internal server error while reaching CCPayment.' };
        }
    }
    coinMap = {
        'USDT': 1280,
        'PEPE': 1877,
        'ETH': 1161,
        'SOL': 1186,
        'MATIC': 1329,
        'ARB': 1296,
        'USDC': 1282,
        'LINK': 1207
    };
    chainMap = {
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
    getHeaders(rawBody, timestamp) {
        const signatureText = this.appId + timestamp + rawBody;
        const signHeader = crypto.createHmac('sha256', this.appSecret).update(signatureText).digest('hex');
        return {
            'Content-Type': 'application/json',
            'Appid': this.appId,
            'Timestamp': timestamp,
            'Sign': signHeader
        };
    }
    async refillTreasuryLiquidityViaSwap(targetCoinId, requiredAmount) {
        const USDC_COIN_ID = 1282;
        if (targetCoinId === USDC_COIN_ID)
            return false;
        try {
            let ts = Math.floor(Date.now() / 1000).toString();
            const pricePayload = JSON.stringify({ coinIds: [targetCoinId] });
            const priceRes = await (0, node_fetch_1.default)('https://ccpayment.com/ccpayment/v2/getCoinUSDTPrice', {
                method: 'POST',
                headers: this.getHeaders(pricePayload, ts),
                body: pricePayload
            });
            const priceData = await priceRes.json();
            if (priceData.code !== 10000 || !priceData.data.prices[targetCoinId.toString()]) {
                this.logger.error(`[SWAP ERROR] Failed to fetch price for coin ${targetCoinId}: ${JSON.stringify(priceData)}`);
                return false;
            }
            const coinUsdtPrice = parseFloat(priceData.data.prices[targetCoinId.toString()]);
            let neededUsdc = requiredAmount * coinUsdtPrice;
            let inputUsdc = (neededUsdc * 1.02) + 0.2;
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
            const estRes = await (0, node_fetch_1.default)('https://ccpayment.com/ccpayment/v2/estimate', {
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
                return false;
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
            const swapRes = await (0, node_fetch_1.default)('https://ccpayment.com/ccpayment/v2/swap', {
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
                const pollRes = await (0, node_fetch_1.default)('https://ccpayment.com/ccpayment/v2/getSwapRecord', {
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
        }
        catch (error) {
            this.logger.error("[SWAP ERROR] Unknown Auto Swap Crash:", error);
            return false;
        }
    }
    async createWithdrawRequest(telegramId, coin, amount, walletAddress, tier = 'standard') {
        if (amount <= 0)
            return { success: false, error: 'Invalid amount' };
        if (coin.toUpperCase() === 'PEPE' && amount < 1500)
            return { success: false, error: 'Minimum withdrawal for PEPE is 1500' };
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user)
            return { success: false, error: 'User not found' };
        if (user.isBanned) {
            return { success: false, error: 'Your account has been blocked. Please contact support to appeal.', banned: true };
        }
        let liveUsdPrice = coin.toUpperCase() === 'PEPE' ? 0.0000045 : 1;
        const geckoIds = { 'PEPE': 'pepe', 'MATIC': 'matic-network', 'ETH': 'ethereum', 'USDT': 'tether', 'USDC': 'usd-coin', 'SOL': 'solana' };
        const geckoId = geckoIds[coin.toUpperCase()];
        if (geckoId) {
            try {
                const priceRes = await (0, node_fetch_1.default)(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
                const priceData = await priceRes.json();
                if (priceData[geckoId]?.usd) {
                    liveUsdPrice = priceData[geckoId].usd;
                }
            }
            catch (e) {
            }
        }
        const usdValue = amount * liveUsdPrice;
        const isBonusEligible = usdValue >= 0.3;
        let whaleFeePct = 0;
        let whaleFeeReason = 'normal';
        try {
            const eq = await this.circularCasino.getUserEquity(telegramId, user.firstName || null, user.username || null);
            const fee = this.circularCasino.computeWithdrawFeePercent(eq);
            whaleFeePct = fee.feePct;
            whaleFeeReason = fee.reason;
            eq.totalDepositedElixir = (eq.totalDepositedElixir || 0);
            eq.lastActiveAt = new Date();
            await eq.save();
        }
        catch (_e) { }
        const locked = await this.usersService.lockUserForWithdrawal(telegramId);
        if (!locked) {
            return { success: false, error: 'A withdrawal is currently processing, please wait.' };
        }
        try {
            const vipRank = (0, users_service_1.getUserVipRank)(user.exp || 0);
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const todaysTxs = await this.txModel.find({
                telegramId, type: 'WITHDRAW', createdAt: { $gte: startOfDay }
            }).exec();
            if (todaysTxs.length >= vipRank.wdLimit) {
                return { success: false, error: `Daily withdrawal limit of ${vipRank.wdLimit} reached for ${vipRank.name} tier.` };
            }
            let pastUsdVolume = 0;
            for (const tx of todaysTxs) {
                const p = tx.coin === 'PEPE' ? 0.0000045 : (tx.coin === 'SOL' ? 150 : (tx.coin === 'ETH' ? 3000 : 1));
                pastUsdVolume += (tx.amount * p);
            }
            if ((pastUsdVolume + usdValue) > vipRank.maxWdUsd) {
                return { success: false, error: `Daily limit of $${vipRank.maxWdUsd} USD reached for ${vipRank.name} tier.` };
            }
            let executionAmount = amount;
            if (tier === 'advance') {
                executionAmount = amount * 0.985;
            }
            else if (tier === 'onchain') {
                const cryptoFee = 0.5 / liveUsdPrice;
                executionAmount = amount - cryptoFee;
                if (executionAmount <= 0) {
                    return { success: false, error: 'Withdrawal size too small to cover the $0.5 flat network fee' };
                }
            }
            else if (tier === 'standard' && isBonusEligible) {
                executionAmount = amount * 1.03;
            }
            let whaleTaxCrypto = 0;
            if (whaleFeePct > 0 && executionAmount > 0) {
                whaleTaxCrypto = Math.floor(executionAmount * whaleFeePct * 1e8) / 1e8;
                executionAmount = Math.max(0, executionAmount - whaleTaxCrypto);
            }
            const debited = await this.usersService.debitCrypto(telegramId, coin, amount);
            if (!debited)
                return { success: false, error: 'Insufficient crypto balance' };
            let withdrawalMarginToAdmin = amount - executionAmount;
            if (tier === 'onchain') {
                const ccPaymentToll = 0.25 / liveUsdPrice;
                withdrawalMarginToAdmin = withdrawalMarginToAdmin - ccPaymentToll;
            }
            if (withdrawalMarginToAdmin !== 0) {
                const marginSource = withdrawalMarginToAdmin < 0 ? 'WITHDRAW_FEE_SUBSIDY' : 'WITHDRAW_FEE';
                await this.adminService.addProfit(coin.toUpperCase(), withdrawalMarginToAdmin, marginSource, telegramId);
            }
            try {
                if (withdrawalMarginToAdmin > 0) {
                    const marginUsdValue = withdrawalMarginToAdmin * liveUsdPrice;
                    const elixirEquivalentFee = Math.floor(marginUsdValue * 10000);
                    if (elixirEquivalentFee > 0)
                        await this.circularCasino.addWithdrawalFee(elixirEquivalentFee);
                }
                if (whaleTaxCrypto > 0) {
                    const whaleTaxUsdValue = whaleTaxCrypto * liveUsdPrice;
                    const elixirTax = Math.floor(whaleTaxUsdValue * 10000);
                    if (elixirTax > 0)
                        await this.circularCasino.addWithdrawalFee(elixirTax);
                    const eq2 = await this.circularCasino.getUserEquity(telegramId);
                    this.circularCasino.onUserWithdrawSuccess(eq2, Math.floor((executionAmount * liveUsdPrice) * 10000), Math.floor(withdrawalMarginToAdmin * liveUsdPrice * 10000) + elixirTax);
                    await eq2.save();
                }
                else {
                    const eq2 = await this.circularCasino.getUserEquity(telegramId);
                    this.circularCasino.onUserWithdrawSuccess(eq2, Math.floor((executionAmount * liveUsdPrice) * 10000), Math.floor(withdrawalMarginToAdmin * liveUsdPrice * 10000));
                    await eq2.save();
                }
            }
            catch (_e2) { }
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
                        merchantPayNetworkFee: false,
                        notifyUrl: "https://mini-app-backend-production-30ea.up.railway.app/payment/webhook"
                    };
                    const rawBody = JSON.stringify(payload);
                    const res = await (0, node_fetch_1.default)('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToNetwork', {
                        method: 'POST',
                        headers: this.getHeaders(rawBody, timestamp),
                        body: rawBody,
                        agent: this.proxyAgent
                    });
                    return await res.json();
                }
                else {
                    const payload = {
                        orderId: `WD_${telegramId}_${Date.now()}`,
                        cwalletUser: walletAddress,
                        amount: executionAmount.toFixed(8),
                        coinId: coinId
                    };
                    const rawBody = JSON.stringify(payload);
                    const res = await (0, node_fetch_1.default)('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToCwallet', {
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
                if (data.code === 14000) {
                    this.logger.warn(`Insufficient Treasury Balance (Code 14000). Triggering Auto-Swap Bridge for ${coin}...`);
                    const refilled = await this.refillTreasuryLiquidityViaSwap(coinId, executionAmount);
                    if (refilled) {
                        this.logger.log(`Auto-Swap Bridge Successful. Re-attempting Withdrawal...`);
                        data = await triggerWithdraw();
                    }
                    else {
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
            }
            catch (e) {
                this.logger.error("Create Withdrawal Failed", e);
                await this.usersService.creditCrypto(telegramId, coin, amount);
                return { success: false, error: 'Network failure. Balance refunded.' };
            }
        }
        finally {
            await this.usersService.unlockUserWithdrawal(telegramId);
        }
    }
    verifyWebhookSignature(headers, rawBody) {
        const sign = headers['sign'] || headers['x-signature'];
        const timestamp = headers['timestamp'] || '';
        if (!sign)
            return false;
        const hash1 = crypto.createHmac('sha256', this.appSecret).update(rawBody).digest('hex');
        if (hash1 === sign)
            return true;
        const text2 = this.appId + timestamp + rawBody;
        const hash2 = crypto.createHmac('sha256', this.appSecret).update(text2).digest('hex');
        if (hash2 === sign)
            return true;
        const text3 = timestamp + rawBody;
        const hash3 = crypto.createHmac('sha256', this.appSecret).update(text3).digest('hex');
        if (hash3 === sign)
            return true;
        return false;
    }
    async handleWebhook(event) {
        this.logger.log('Receiving Webhook Event from CCPayment: ', JSON.stringify(event));
        if (event.type === 'ActivateWebhookURL') {
            this.logger.log('CCPayment Webhook Activated successfully');
            return { success: true, processed: true, activation: true };
        }
        const payload = event.msg ? event.msg : event;
        const eventType = event.type || '';
        const status = payload.status;
        if (status !== 'Success' && status !== 2 && status !== 'Successful') {
            this.logger.log(`CCPayment Webhook skipped (not success): status=${status}, type=${eventType}`);
            return { success: true, processed: false, reason: `Status ${status} is not paid/success` };
        }
        let telegramId = event.customValue || payload.customValue;
        const orderId = payload.orderId || event.orderId || '';
        if (!telegramId) {
            const depMatch = orderId.match(/^DEP_(\d+?)_/);
            if (depMatch && depMatch[1]) {
                telegramId = depMatch[1];
                this.logger.log(`[Webhook] Resolved telegramId ${telegramId} from orderId pattern: ${orderId}`);
            }
            else if (eventType === 'ApiWithdrawal' || orderId.startsWith('WD_')) {
                this.logger.log(`[Webhook] Withdrawal status update ${orderId} = ${status}, no credit needed.`);
                return { success: true, processed: true, activation: false, withdrawal: true };
            }
        }
        if (!telegramId) {
            this.logger.warn(`[Webhook] No telegramId could be resolved from orderId=${orderId}, customValue=${event.customValue || payload.customValue || 'N/A'}`);
            return { success: true, processed: false, reason: 'No identifier attached' };
        }
        let elixirAmount = 0;
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
        if (elixirAmount <= 0) {
            this.logger.warn(`[Webhook] Invalid/zero ELIXIR payload for user ${telegramId}. product="${productField}", orderId=${orderId}`);
            return { success: true, processed: false, reason: 'Invalid or zero ELIXIR payload' };
        }
        await this.usersService.creditRewardAndLogTask(telegramId.toString(), elixirAmount, `DEP_CCPAYMENT_${orderId || Date.now()}`);
        const cryptoSymbol = payload.coinSymbol || event.coinSymbol || payload.crypto || event.crypto || 'USDT';
        const cryptoAmountStr = payload.amount || event.amount || payload.cryptoAmount || event.cryptoAmount || '0';
        await this.txModel.create({
            telegramId: telegramId.toString(),
            type: 'DEPOSIT',
            coin: cryptoSymbol.toUpperCase(),
            amount: parseFloat(cryptoAmountStr) || elixirAmount,
            tier: 'STANDARD',
            status: 'complete'
        });
        this.logger.log(`[Webhook] SUCCESS: Credited ${elixirAmount} ELIXIR to user ${telegramId} (orderId=${orderId})`);
        return { success: true, processed: true, credited: elixirAmount, user: telegramId };
    }
    async getTransactions(telegramId) {
        const txs = await this.txModel.find({ telegramId }).sort({ createdAt: -1 }).limit(100).exec();
        return { success: true, transactions: txs };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(1, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => admin_service_1.AdminService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => circular_casino_service_1.CircularCasinoService))),
    __metadata("design:paramtypes", [users_service_1.UsersService, typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, admin_service_1.AdminService,
        circular_casino_service_1.CircularCasinoService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map