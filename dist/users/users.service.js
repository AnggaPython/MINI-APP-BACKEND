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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const user_schema_1 = require("./schemas/user.schema");
const referral_log_schema_1 = require("./schemas/referral-log.schema");
const hilo_bet_schema_1 = require("./schemas/hilo-bet.schema");
const achievements_service_1 = require("../achievements/achievements.service");
const admin_service_1 = require("../admin/admin.service");
let UsersService = class UsersService {
    userModel;
    referralLogModel;
    hiloBetModel;
    achievementsService;
    adminService;
    constructor(userModel, referralLogModel, hiloBetModel, achievementsService, adminService) {
        this.userModel = userModel;
        this.referralLogModel = referralLogModel;
        this.hiloBetModel = hiloBetModel;
        this.achievementsService = achievementsService;
        this.adminService = adminService;
    }
    async syncTelegramUser(userData, referredBy) {
        const { id, first_name, last_name, username, photo_url, is_premium } = userData;
        const updateData = {
            firstName: first_name,
            lastName: last_name,
            username: username,
            photoUrl: photo_url,
            isPremium: is_premium === true,
        };
        const setOnInsert = { elixirBalance: 0 };
        if (referredBy)
            setOnInsert.referredBy = referredBy;
        let isNewUser = false;
        const existingUser = await this.userModel.findOne({ telegramId: id.toString() }).exec();
        if (!existingUser)
            isNewUser = true;
        const user = await this.userModel.findOneAndUpdate({ telegramId: id.toString() }, {
            $set: updateData,
            $setOnInsert: setOnInsert,
        }, { returnDocument: 'after', upsert: true }).exec();
        if (isNewUser && referredBy) {
            await this.achievementsService.incrementProgress(referredBy, [12, 13, 14, 15, 16, 17], 1);
        }
        return user;
    }
    async startMining(telegramId) {
        return this.userModel.findOneAndUpdate({ telegramId }, { $set: { miningStartDate: new Date() } }, { returnDocument: 'after' }).exec();
    }
    async claimMining(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { user: null, claimedAmount: 0, error: 'User not found' };
        if (!user.miningStartDate)
            return { user, claimedAmount: 0, error: 'Mining not started' };
        const now = new Date();
        const diffSec = (now.getTime() - user.miningStartDate.getTime()) / 1000;
        let secondsToClaim = diffSec > 7200 ? 7200 : diffSec;
        if (secondsToClaim < 0)
            secondsToClaim = 0;
        const reward = (15 / 7200) * secondsToClaim;
        if (reward <= 0.0001)
            return { user, claimedAmount: 0, error: 'Reward too small to claim yet' };
        const updatedUser = await this.userModel.findOneAndUpdate({ telegramId }, {
            $inc: { elixirBalance: reward },
            $set: { miningStartDate: null }
        }, { returnDocument: 'after' }).exec();
        if (updatedUser) {
            await this.achievementsService.incrementProgress(telegramId, [1, 8, 9, 10], 1);
        }
        return { user: updatedUser, claimedAmount: reward };
    }
    async findByTelegramId(telegramId) {
        return this.userModel.findOne({ telegramId }).exec();
    }
    async debitElixir(telegramId, amount) {
        const result = await this.userModel.findOneAndUpdate({ telegramId, elixirBalance: { $gte: amount } }, { $inc: { elixirBalance: -amount } }).exec();
        return !!result;
    }
    async debitCrypto(telegramId, coin, amount) {
        if (amount <= 0 || !coin)
            return false;
        const result = await this.userModel.findOneAndUpdate({
            telegramId,
            [`cryptoBalances.${coin}`]: { $gte: amount }
        }, {
            $inc: { [`cryptoBalances.${coin}`]: -amount }
        }).exec();
        return !!result;
    }
    async creditCrypto(telegramId, coin, amount) {
        if (amount <= 0 || !coin)
            return false;
        const result = await this.userModel.findOneAndUpdate({ telegramId }, { $inc: { [`cryptoBalances.${coin}`]: amount } }).exec();
        return !!result;
    }
    async creditRewardAndLogTask(telegramId, reward, campaignId) {
        const result = await this.userModel.findOneAndUpdate({ telegramId, completedTasks: { $ne: campaignId } }, {
            $inc: { elixirBalance: reward },
            $push: { completedTasks: campaignId }
        }).exec();
        return !!result;
    }
    async creditReferralBonus(uplineTelegramId, margin, downlineUsername, actionHash) {
        if (!uplineTelegramId)
            return false;
        const result = await this.userModel.findOneAndUpdate({ telegramId: uplineTelegramId }, { $inc: { referralBalance: margin } }).exec();
        if (result) {
            await new this.referralLogModel({
                uplineTelegramId, downlineUsername, amount: margin, actionHash
            }).save();
        }
        return !!result;
    }
    async getReferralStats(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        const totalReferrals = await this.userModel.countDocuments({ referredBy: telegramId }).exec();
        const history = await this.referralLogModel.find({ uplineTelegramId: telegramId }).sort({ createdAt: -1 }).limit(10).exec();
        return {
            referralBalance: user ? (user.referralBalance || 0) : 0,
            totalReferrals,
            history
        };
    }
    async claimReferralVault(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user || (user.referralBalance || 0) < 1000)
            return { error: 'Minimum 1000 ELIXIR required to claim vault' };
        const claimAmount = user.referralBalance;
        const updated = await this.userModel.findOneAndUpdate({ telegramId, referralBalance: { $gte: 1000 } }, {
            $inc: { elixirBalance: claimAmount },
            $set: { referralBalance: 0 }
        }, { returnDocument: 'after' }).exec();
        if (!updated)
            return { error: 'Failed to process claim' };
        return { success: true, user: updated, claimedAmount: claimAmount };
    }
    async claimDailyLogin(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { error: 'User not found' };
        const now = new Date();
        if (user.lastDailyLogin) {
            const msSinceLast = now.getTime() - user.lastDailyLogin.getTime();
            if (msSinceLast < 86400000) {
                return { error: 'Come back in 24 hours to claim again!' };
            }
        }
        user.lastDailyLogin = now;
        user.elixirBalance += 5;
        await user.save();
        return { success: true, reward: 5, user };
    }
    async verifyTelegramChannel(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { error: 'User not found' };
        if (user.joinedTelegram)
            return { error: 'Already claimed' };
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            user.joinedTelegram = true;
            user.elixirBalance += 100;
            await user.save();
            return { success: true, reward: 100, user, mock: true };
        }
        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=@ElixirNetwork&user_id=${telegramId}`);
            const data = await response.json();
            if (data.ok && ['member', 'administrator', 'creator'].includes(data.result.status)) {
                user.joinedTelegram = true;
                user.elixirBalance += 100;
                await user.save();
                return { success: true, reward: 100, user };
            }
            else {
                return { error: 'Please join the channel first!' };
            }
        }
        catch (e) {
            return { error: 'Verification failed' };
        }
    }
    async getBalance(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        return {
            elixirBalance: user?.elixirBalance || 0,
            cryptoBalances: user?.cryptoBalances || {},
            cwalletUid: user?.cwalletUid || null,
            solanaAddress: user?.solanaAddress || null
        };
    }
    async bindCwalletUid(telegramId, uid) {
        if (!uid || uid.trim() === '')
            return { error: 'Invalid UID' };
        const user = await this.userModel.findOneAndUpdate({ telegramId }, { $set: { cwalletUid: uid } }, { returnDocument: 'after' }).exec();
        return { success: true, user };
    }
    async bindSolanaAddress(telegramId, address) {
        if (!address || address.trim() === '')
            return { error: 'Invalid Address' };
        const user = await this.userModel.findOneAndUpdate({ telegramId }, { $set: { solanaAddress: address } }, { returnDocument: 'after' }).exec();
        return { success: true, user };
    }
    async swapTokens(telegramId, fromAmount, targetCoin) {
        if (fromAmount <= 0)
            return { error: 'Invalid exchange amount' };
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user || user.elixirBalance < fromAmount) {
            return { error: 'Insufficient ELIXIR balance for this swap' };
        }
        const coinGeckoMap = {
            'ETH': 'ethereum',
            'MATIC': 'matic-network',
            'PEPE': 'pepe',
            'SOL': 'solana',
            'TIA': 'celestia',
            'LINK': 'chainlink',
            'INJ': 'injective-protocol',
            'DYM': 'dymension',
            'DOT': 'polkadot',
            'CRO': 'crypto-com-chain',
            'ARB': 'arbitrum'
        };
        const geckoId = coinGeckoMap[targetCoin.toUpperCase()];
        if (!geckoId && !['USDT', 'USDC'].includes(targetCoin.toUpperCase())) {
            return { error: 'Unsupported destination token selected' };
        }
        let cryptoPrice = 1.0;
        if (geckoId) {
            try {
                const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
                const data = await res.json();
                cryptoPrice = data[geckoId]?.usd || 1;
            }
            catch (e) {
                cryptoPrice = targetCoin === 'ETH' ? 3000 : (targetCoin === 'PEPE' ? 0.0000045 : 0.5);
            }
        }
        const usdValue = (fromAmount / 10000);
        const grossCryptoAmount = usdValue / cryptoPrice;
        const netCryptoAmount = grossCryptoAmount * 0.92;
        if (!user.cryptoBalances)
            user.cryptoBalances = {};
        const currentTargetBalance = user.cryptoBalances[targetCoin] || 0;
        user.cryptoBalances[targetCoin] = currentTargetBalance + netCryptoAmount;
        user.elixirBalance -= fromAmount;
        user.markModified('cryptoBalances');
        await user.save();
        const spread = grossCryptoAmount * 0.08;
        await this.adminService.addProfit(targetCoin, spread, 'SWAP_SPREAD', telegramId);
        return {
            success: true,
            user,
            received: netCryptoAmount,
            gross: grossCryptoAmount,
            spread: (grossCryptoAmount * 0.08)
        };
    }
    async convertDustToElixir(telegramId, coinsToConvert) {
        if (!coinsToConvert || coinsToConvert.length === 0)
            return { error: 'No coins selected' };
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { error: 'User not found' };
        if (!user.cryptoBalances)
            return { error: 'No balances to convert' };
        const coinGeckoMap = {
            'ETH': 'ethereum',
            'MATIC': 'matic-network',
            'PEPE': 'pepe',
            'SOL': 'solana',
            'TIA': 'celestia',
            'LINK': 'chainlink',
            'INJ': 'injective-protocol',
            'DYM': 'dymension',
            'DOT': 'polkadot',
            'CRO': 'crypto-com-chain',
            'ARB': 'arbitrum'
        };
        let totalUsdValue = 0;
        for (const coin of coinsToConvert) {
            const sym = coin.toUpperCase();
            const balance = user.cryptoBalances[sym] || 0;
            if (balance <= 0)
                continue;
            let cryptoPrice = 1.0;
            const geckoId = coinGeckoMap[sym];
            if (geckoId) {
                try {
                    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
                    const data = await res.json();
                    cryptoPrice = data[geckoId]?.usd || 1;
                }
                catch (e) {
                    cryptoPrice = sym === 'ETH' ? 3000 : (sym === 'PEPE' ? 0.0000045 : 0.5);
                }
            }
            const grossUsdValue = balance * cryptoPrice;
            const feeUsd = grossUsdValue * 0.003;
            const netUsdValue = grossUsdValue - feeUsd;
            totalUsdValue += netUsdValue;
            const feeInNativeToken = balance * 0.003;
            if (feeInNativeToken > 0) {
                await this.adminService.addProfit(sym, feeInNativeToken, 'DUST_CONVERT', telegramId);
            }
            user.cryptoBalances[sym] = 0;
        }
        if (totalUsdValue <= 0) {
            return { error: 'Selected balances have zero value.' };
        }
        const elixirGained = totalUsdValue * 10000;
        user.elixirBalance = (user.elixirBalance || 0) + elixirGained;
        user.markModified('cryptoBalances');
        await user.save();
        return {
            success: true,
            elixirGained,
            newElixirBalance: user.elixirBalance,
            cryptoBalances: user.cryptoBalances
        };
    }
    async executeHiLoBet(telegramId, betAmount, multiplier, type) {
        if (betAmount < 10 || betAmount > 1000000) {
            return { error: 'Bet amount must be between 10 and 1000000 ELIXIR' };
        }
        if (multiplier < 1.01 || multiplier > 100) {
            return { error: 'Invalid multiplier constraint' };
        }
        const user = await this.userModel.findOneAndUpdate({ telegramId, elixirBalance: { $gte: betAmount } }, { $inc: { elixirBalance: -betAmount } }, { new: true }).exec();
        if (!user) {
            return { error: 'Insufficient balance or invalid bet amount' };
        }
        let edge = 0.95;
        const recentBets = await this.hiloBetModel.find({ telegramId }).sort({ createdAt: -1 }).limit(5).exec();
        const lastBet = recentBets.length > 0 ? recentBets[0] : null;
        if (lastBet && !lastBet.isWin && betAmount >= (lastBet.betAmount * 1.8)) {
            edge = Math.min(edge, 0.40);
        }
        if (recentBets.length >= 3) {
            const totalRecentBet = recentBets.reduce((sum, b) => sum + b.betAmount, 0);
            const avgBet = totalRecentBet / recentBets.length;
            if (betAmount >= (avgBet * 5) && betAmount >= 500) {
                edge = Math.min(edge, 0.30);
            }
        }
        const totalWealthBeforeBet = user.elixirBalance + betAmount;
        if (betAmount > (totalWealthBeforeBet * 0.10)) {
            edge = Math.min(edge, 0.45);
        }
        if (multiplier >= 10)
            edge = Math.min(edge, 0.75);
        if (multiplier >= 50)
            edge = Math.min(edge, 0.50);
        const winChance = (100 * edge) / multiplier;
        const thresholdHI = 10000 - (winChance * 100);
        const thresholdLO = winChance * 100;
        const serverSeed = crypto.randomBytes(16).toString('hex');
        const clientSeed = `${telegramId}-${Date.now()}`;
        const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
        const hexSub = hash.substring(0, 5);
        const parsedHex = parseInt(hexSub, 16);
        const rolledNumber = parsedHex % 10001;
        let isWin = false;
        if (type === 'hi' && rolledNumber > thresholdHI)
            isWin = true;
        if (type === 'lo' && rolledNumber < thresholdLO)
            isWin = true;
        const reward = isWin ? (betAmount * multiplier) : 0;
        const profit = isWin ? (reward - betAmount) : -betAmount;
        let finalBalance = user.elixirBalance;
        if (isWin) {
            const winUser = await this.userModel.findOneAndUpdate({ telegramId }, { $inc: { elixirBalance: reward } }, { new: true }).exec();
            finalBalance = winUser ? winUser.elixirBalance : user.elixirBalance;
        }
        await new this.hiloBetModel({
            telegramId, betAmount, multiplier, targetType: type, rolledNumber, isWin, profit,
            newBalance: finalBalance, serverSeed, clientSeed, hash
        }).save();
        return {
            success: true,
            rolledNumber,
            isWin,
            profit,
            newBalance: finalBalance
        };
    }
    async getHiLoHistory(telegramId) {
        const history = await this.hiloBetModel.find({ telegramId })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();
        return history;
    }
    async searchUserForAdmin(query) {
        return this.userModel.findOne({
            $or: [
                { telegramId: query },
                { username: { $regex: new RegExp(`^${query}$`, 'i') } }
            ]
        }).exec();
    }
    async updateUserBalanceAdmin(telegramId, elixirBalance, cryptoBalances) {
        const update = {};
        if (elixirBalance !== undefined)
            update.elixirBalance = elixirBalance;
        if (cryptoBalances !== undefined)
            update.cryptoBalances = cryptoBalances;
        return this.userModel.findOneAndUpdate({ telegramId }, { $set: update }, { returnDocument: 'after' }).exec();
    }
    async setUserBanStatus(telegramId, isBanned) {
        return this.userModel.findOneAndUpdate({ telegramId }, { $set: { isBanned } }, { returnDocument: 'after' }).exec();
    }
    async getDashboardStatsAdmin() {
        const totalUsers = await this.userModel.countDocuments().exec();
        const users = await this.userModel.find({}, { elixirBalance: 1 }).exec();
        const totalElixir = users.reduce((sum, u) => sum + (u.elixirBalance || 0), 0);
        const recentUsers = await this.userModel.find()
            .sort({ elixirBalance: -1 })
            .limit(20)
            .select('telegramId firstName lastName username isBanned createdAt elixirBalance cryptoBalances')
            .exec();
        return {
            totalUsers,
            totalElixir,
            recentUsers
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(referral_log_schema_1.ReferralLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(hilo_bet_schema_1.HiLoBet.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => achievements_service_1.AchievementsService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => admin_service_1.AdminService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        achievements_service_1.AchievementsService,
        admin_service_1.AdminService])
], UsersService);
//# sourceMappingURL=users.service.js.map