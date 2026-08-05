import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { ReferralLog, ReferralLogDocument } from './schemas/referral-log.schema';
import { HiLoBet, HiLoBetDocument } from './schemas/hilo-bet.schema';
import { AchievementsService } from '../achievements/achievements.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(ReferralLog.name) private referralLogModel: Model<ReferralLogDocument>,
        @InjectModel(HiLoBet.name) private hiloBetModel: Model<HiLoBetDocument>,
        @Inject(forwardRef(() => AchievementsService)) private achievementsService: AchievementsService,
        @Inject(forwardRef(() => AdminService)) private adminService: AdminService
    ) { }

    async syncTelegramUser(userData: any, referredBy?: string): Promise<User> {
        const { id, first_name, last_name, username, photo_url, is_premium } = userData;

        const updateData: any = {
            firstName: first_name,
            lastName: last_name,
            username: username,
            photoUrl: photo_url,
            isPremium: is_premium === true,
        };

        const setOnInsert: any = { elixirBalance: 0 };
        if (referredBy) setOnInsert.referredBy = referredBy;

        let isNewUser = false;
        const existingUser = await this.userModel.findOne({ telegramId: id.toString() }).exec();
        if (!existingUser) isNewUser = true;

        const user = await this.userModel.findOneAndUpdate(
            { telegramId: id.toString() },
            {
                $set: updateData,
                $setOnInsert: setOnInsert,
            },
            { returnDocument: 'after', upsert: true }
        ).exec();

        // Increment Upline achievements upon new valid referral registration
        if (isNewUser && referredBy) {
            await this.achievementsService.incrementProgress(referredBy, [12, 13, 14, 15, 16, 17], 1);
        }

        return user;
    }

    async startMining(telegramId: string): Promise<User | null> {
        return this.userModel.findOneAndUpdate(
            { telegramId },
            { $set: { miningStartDate: new Date() } },
            { returnDocument: 'after' }
        ).exec();
    }

    async claimMining(telegramId: string): Promise<{ user: User | null; claimedAmount: number; error?: string }> {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { user: null, claimedAmount: 0, error: 'User not found' };
        if (!user.miningStartDate) return { user, claimedAmount: 0, error: 'Mining not started' };

        const now = new Date();
        const diffSec = (now.getTime() - user.miningStartDate.getTime()) / 1000;

        let secondsToClaim = diffSec > 7200 ? 7200 : diffSec;
        if (secondsToClaim < 0) secondsToClaim = 0;

        const reward = (15 / 7200) * secondsToClaim;

        if (reward <= 0.0001) return { user, claimedAmount: 0, error: 'Reward too small to claim yet' };

        const updatedUser = await this.userModel.findOneAndUpdate(
            { telegramId },
            {
                $inc: { elixirBalance: reward },
                $set: { miningStartDate: null }
            },
            { returnDocument: 'after' }
        ).exec();

        if (updatedUser) {
            await this.achievementsService.incrementProgress(telegramId, [1, 8, 9, 10], 1);
        }

        return { user: updatedUser, claimedAmount: reward };
    }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        return this.userModel.findOne({ telegramId }).exec();
    }

    async debitElixir(telegramId: string, amount: number): Promise<boolean> {
        const result = await this.userModel.findOneAndUpdate(
            { telegramId, elixirBalance: { $gte: amount } },
            { $inc: { elixirBalance: -amount } }
        ).exec();
        return !!result;
    }

    async debitCrypto(telegramId: string, coin: string, amount: number): Promise<boolean> {
        if (amount <= 0 || !coin) return false;

        // Ensure atomic deduction directly on the dynamic symbol mapping
        const result = await this.userModel.findOneAndUpdate(
            {
                telegramId,
                [`cryptoBalances.${coin}`]: { $gte: amount }
            },
            {
                $inc: { [`cryptoBalances.${coin}`]: -amount }
            }
        ).exec();
        return !!result;
    }

    async creditCrypto(telegramId: string, coin: string, amount: number): Promise<boolean> {
        if (amount <= 0 || !coin) return false;
        const result = await this.userModel.findOneAndUpdate(
            { telegramId },
            { $inc: { [`cryptoBalances.${coin}`]: amount } }
        ).exec();
        return !!result;
    }

    async creditRewardAndLogTask(telegramId: string, reward: number, campaignId: string): Promise<boolean> {
        // Prevent double claiming
        const result = await this.userModel.findOneAndUpdate(
            { telegramId, completedTasks: { $ne: campaignId } },
            {
                $inc: { elixirBalance: reward },
                $push: { completedTasks: campaignId }
            }
        ).exec();
        return !!result;
    }

    async creditReferralBonus(uplineTelegramId: string, margin: number, downlineUsername: string, actionHash: string): Promise<boolean> {
        if (!uplineTelegramId) return false;

        const result = await this.userModel.findOneAndUpdate(
            { telegramId: uplineTelegramId },
            { $inc: { referralBalance: margin } }
        ).exec();

        if (result) {
            await new this.referralLogModel({
                uplineTelegramId, downlineUsername, amount: margin, actionHash
            }).save();
        }

        return !!result;
    }

    async getReferralStats(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        const totalReferrals = await this.userModel.countDocuments({ referredBy: telegramId }).exec();
        const history = await this.referralLogModel.find({ uplineTelegramId: telegramId }).sort({ createdAt: -1 }).limit(10).exec();

        return {
            referralBalance: user ? (user.referralBalance || 0) : 0,
            totalReferrals,
            history
        };
    }

    async claimReferralVault(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user || (user.referralBalance || 0) < 1000) return { error: 'Minimum 1000 ELIXIR required to claim vault' };

        const claimAmount = user.referralBalance;

        const updated = await this.userModel.findOneAndUpdate(
            { telegramId, referralBalance: { $gte: 1000 } },
            {
                $inc: { elixirBalance: claimAmount },
                $set: { referralBalance: 0 }
            },
            { returnDocument: 'after' }
        ).exec();

        if (!updated) return { error: 'Failed to process claim' };

        return { success: true, user: updated, claimedAmount: claimAmount };
    }

    async claimDailyLogin(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { error: 'User not found' };

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

    async verifyTelegramChannel(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { error: 'User not found' };
        if (user.joinedTelegram) return { error: 'Already claimed' };

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            // Mock mode if no token is available
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
            } else {
                return { error: 'Please join the channel first!' };
            }
        } catch (e) {
            return { error: 'Verification failed' };
        }
    }

    async getBalance(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        const withdrawLimits = await this.adminService.getWithdrawLimits();
        return {
            elixirBalance: user?.elixirBalance || 0,
            cryptoBalances: user?.cryptoBalances || {},
            cwalletUid: user?.cwalletUid || null,
            solanaAddress: user?.solanaAddress || null,
            withdrawLimits
        };
    }

    async bindCwalletUid(telegramId: string, uid: string) {
        if (!uid || uid.trim() === '') return { error: 'Invalid UID' };
        const user = await this.userModel.findOneAndUpdate(
            { telegramId },
            { $set: { cwalletUid: uid } },
            { returnDocument: 'after' }
        ).exec();
        return { success: true, user };
    }

    async bindSolanaAddress(telegramId: string, address: string) {
        if (!address || address.trim() === '') return { error: 'Invalid Address' };
        const user = await this.userModel.findOneAndUpdate(
            { telegramId },
            { $set: { solanaAddress: address } },
            { returnDocument: 'after' }
        ).exec();
        return { success: true, user };
    }

    async swapTokens(telegramId: string, fromAmount: number, targetCoin: string) {
        if (fromAmount <= 0) return { error: 'Invalid exchange amount' };

        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user || user.elixirBalance < fromAmount) {
            return { error: 'Insufficient ELIXIR balance for this swap' };
        }

        const coinGeckoMap: Record<string, string> = {
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
            } catch (e) {
                cryptoPrice = targetCoin === 'ETH' ? 3000 : (targetCoin === 'PEPE' ? 0.0000045 : 0.5); // Fallback
            }
        }

        // Math Calculations
        const usdValue = (fromAmount / 10000); // 10000 ELIXIR = 1 USD
        const grossCryptoAmount = usdValue / cryptoPrice;

        // 8% Spread Deduction
        const netCryptoAmount = grossCryptoAmount * 0.92;

        if (!user.cryptoBalances) user.cryptoBalances = {};

        const currentTargetBalance = user.cryptoBalances[targetCoin] || 0;
        user.cryptoBalances[targetCoin] = currentTargetBalance + netCryptoAmount;
        user.elixirBalance -= fromAmount;

        // Mark explicitly for Mongoose to save Object Maps correctly
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

    async convertDustToElixir(telegramId: string, coinsToConvert: string[]) {
        if (!coinsToConvert || coinsToConvert.length === 0) return { error: 'No coins selected' };

        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { error: 'User not found' };
        if (!user.cryptoBalances) return { error: 'No balances to convert' };

        const coinGeckoMap: Record<string, string> = {
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
            if (balance <= 0) continue;

            let cryptoPrice = 1.0;
            const geckoId = coinGeckoMap[sym];

            if (geckoId) {
                try {
                    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
                    const data = await res.json();
                    cryptoPrice = data[geckoId]?.usd || 1;
                } catch (e) {
                    cryptoPrice = sym === 'ETH' ? 3000 : (sym === 'PEPE' ? 0.0000045 : 0.5); // Fallback
                }
            }

            const grossUsdValue = balance * cryptoPrice;
            const feeUsd = grossUsdValue * 0.003; // 0.3% fee
            const netUsdValue = grossUsdValue - feeUsd;

            totalUsdValue += netUsdValue;

            // Calculate native coin fee amount for Admin Logging
            const feeInNativeToken = balance * 0.003;
            if (feeInNativeToken > 0) {
                await this.adminService.addProfit(sym, feeInNativeToken, 'DUST_CONVERT', telegramId);
            }

            // Zero out the converted balance by modifying the actual MAP directly
            user.cryptoBalances[sym] = 0;
        }

        if (totalUsdValue <= 0) {
            return { error: 'Selected balances have zero value.' };
        }

        // 1 USD = 10,000 ELIXIR
        const elixirGained = totalUsdValue * 10000;
        user.elixirBalance = (user.elixirBalance || 0) + elixirGained;

        // Force Mongoose to recognize changes in a Map object
        user.markModified('cryptoBalances');
        await user.save();

        return {
            success: true,
            elixirGained,
            newElixirBalance: user.elixirBalance,
            cryptoBalances: user.cryptoBalances
        };
    }

    async executeHiLoBet(telegramId: string, betAmount: number, multiplier: number, type: 'hi' | 'lo') {
        if (betAmount < 10 || betAmount > 1000000) {
            return { error: 'Bet amount must be between 10 and 1000000 ELIXIR' };
        }
        if (multiplier < 1.01 || multiplier > 100) {
            return { error: 'Invalid multiplier constraint' };
        }

        // Phase 35: Atomic Deduction to obliterate concurrent race condition hacks
        const user = await this.userModel.findOneAndUpdate(
            { telegramId, elixirBalance: { $gte: betAmount } },
            { $inc: { elixirBalance: -betAmount } },
            { new: true }
        ).exec();

        if (!user) {
            return { error: 'Insufficient balance or invalid bet amount' };
        }

        // RNG Engine with dynamic Psychological House Edge Algorithm
        let edge = 0.95; // Base 5% Platform Advantage

        // Extract Recent Bet History to detect Manual/Auto betting patterns
        const recentBets = await this.hiloBetModel.find({ telegramId }).sort({ createdAt: -1 }).limit(5).exec();
        const lastBet = recentBets.length > 0 ? recentBets[0] : null;

        // 1. Martingale Slasher: Triggered if user doubled up forcefully after a loss
        if (lastBet && !lastBet.isWin && betAmount >= (lastBet.betAmount * 1.8)) {
            edge = Math.min(edge, 0.40); // Drastically limit win capacity
        }

        // 4. Sudden Spike Trapper: Detects manual players "baiting" with small bets then throwing huge amounts
        if (recentBets.length >= 3) {
            const totalRecentBet = recentBets.reduce((sum, b) => sum + b.betAmount, 0);
            const avgBet = totalRecentBet / recentBets.length;

            // If they suddenly spike their bet amount > 5x their recent average (minimum baseline of 100 to avoid micro-bet flags)
            if (betAmount >= (avgBet * 5) && betAmount >= 500) {
                edge = Math.min(edge, 0.30); // Crush their win probability to an abysmal 30%
            }
        }

        // 2. Greedy Whale Penalty: Punish users risking > 10% of their net wealth on one throw
        const totalWealthBeforeBet = user.elixirBalance + betAmount;
        if (betAmount > (totalWealthBeforeBet * 0.10)) {
            edge = Math.min(edge, 0.45);
        }

        // 3. High Multiplier Tax: Suppress longshot hunters
        if (multiplier >= 10) edge = Math.min(edge, 0.75);
        if (multiplier >= 50) edge = Math.min(edge, 0.50);

        const winChance = (100 * edge) / multiplier;

        // Threshold Matrix (10,000 bounds)
        const thresholdHI = 10000 - (winChance * 100);
        const thresholdLO = winChance * 100;

        // Provider Generation: Provably Fair Hash Cryptography (SHA-256)
        const serverSeed = crypto.randomBytes(16).toString('hex');
        const clientSeed = `${telegramId}-${Date.now()}`;
        const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');

        // Extract first 5 hex chars string to dec modulo 10001
        const hexSub = hash.substring(0, 5);
        const parsedHex = parseInt(hexSub, 16);
        const rolledNumber = parsedHex % 10001;

        let isWin = false;
        if (type === 'hi' && rolledNumber > thresholdHI) isWin = true;
        if (type === 'lo' && rolledNumber < thresholdLO) isWin = true;

        const reward = isWin ? (betAmount * multiplier) : 0;
        const profit = isWin ? (reward - betAmount) : -betAmount;

        let finalBalance = user.elixirBalance;

        if (isWin) {
            // Atomic Payout
            const winUser = await this.userModel.findOneAndUpdate(
                { telegramId },
                { $inc: { elixirBalance: reward } },
                { new: true }
            ).exec();
            finalBalance = winUser ? winUser.elixirBalance : user.elixirBalance;
        }

        // Record Audit Trail
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

    async getHiLoHistory(telegramId: string) {
        const history = await this.hiloBetModel.find({ telegramId })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();
        return history;
    }

    // --- Admin Interrogation Methods ---
    async searchUserForAdmin(query: string): Promise<User | null> {
        return this.userModel.findOne({
            $or: [
                { telegramId: query },
                { username: { $regex: new RegExp(`^${query}$`, 'i') } }
            ]
        }).exec();
    }

    async updateUserBalanceAdmin(telegramId: string, elixirBalance?: number, cryptoBalances?: Record<string, number>): Promise<User | null> {
        const update: any = {};
        if (elixirBalance !== undefined) update.elixirBalance = elixirBalance;
        if (cryptoBalances !== undefined) update.cryptoBalances = cryptoBalances;

        return this.userModel.findOneAndUpdate(
            { telegramId },
            { $set: update },
            { returnDocument: 'after' }
        ).exec();
    }

    async setUserBanStatus(telegramId: string, isBanned: boolean): Promise<User | null> {
        return this.userModel.findOneAndUpdate(
            { telegramId },
            { $set: { isBanned } },
            { returnDocument: 'after' }
        ).exec();
    }

    async getDashboardStatsAdmin() {
        const totalUsers = await this.userModel.countDocuments().exec();

        // Return total raw ELIXIR across all users
        const users = await this.userModel.find({}, { elixirBalance: 1 }).exec();
        const totalElixir = users.reduce((sum, u) => sum + (u.elixirBalance || 0), 0);

        // Fetch top users by highest Elixir balance
        const recentUsers = await this.userModel.find()
            .sort({ elixirBalance: -1 })
            .limit(20)
            .select('telegramId firstName lastName username isBanned createdAt elixirBalance cryptoBalances')
            .exec();

        return {
            totalUsers,
            totalElixir, // Pass raw Total Elixir
            recentUsers
        };
    }
}
