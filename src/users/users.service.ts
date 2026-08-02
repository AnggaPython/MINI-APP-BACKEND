import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ReferralLog, ReferralLogDocument } from './schemas/referral-log.schema';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(ReferralLog.name) private referralLogModel: Model<ReferralLogDocument>,
        @Inject(forwardRef(() => AchievementsService)) private achievementsService: AchievementsService
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
        return { elixirBalance: user?.elixirBalance || 0 };
    }
}
