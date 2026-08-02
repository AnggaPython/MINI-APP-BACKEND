import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { UsersService } from '../users/users.service';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class CampaignsService {
    constructor(
        @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
        @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
        @Inject(forwardRef(() => AchievementsService)) private achievementsService: AchievementsService
    ) { }

    async createCampaign(data: {
        creatorTelegramId: string, title: string, description: string,
        category: string, rewardPerClick: number, totalBudget: number, url?: string
    }) {
        if (data.totalBudget < 10000) {
            throw new BadRequestException('Minimum budget is 10,000 ELIXIR');
        }

        const isWeb = data.category.toUpperCase().includes('WEB');
        const minReward = isWeb ? 30 : 50;

        if (data.rewardPerClick < minReward) {
            throw new BadRequestException(`Minimum Cost Per Action for this category is ${minReward} ELIXIR`);
        }

        const deducted = await this.usersService.debitElixir(data.creatorTelegramId, data.totalBudget);
        if (!deducted) {
            return { success: false, error: 'Insufficient Elixir balance to launch campaign' };
        }

        const campaign = new this.campaignModel({
            ...data,
            remainingBudget: data.totalBudget,
            status: 'active'
        });

        await campaign.save();

        await this.achievementsService.setProgressMax(data.creatorTelegramId, [6]);

        return { success: true, campaign };
    }

    async getActiveCampaigns(telegramId: string) {
        const user = await this.usersService.findByTelegramId(telegramId);
        let completed: string[] = [];
        if (user && user.completedTasks) {
            completed = user.completedTasks.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
        }

        // Return active campaigns that the user HAS NOT completed
        return this.campaignModel.find({
            status: 'active',
            _id: { $nin: completed }
        }).sort({ rewardPerClick: -1, createdAt: -1 }).limit(50).exec();
    }

    async getMyCampaigns(creatorTelegramId: string) {
        return this.campaignModel.find({ creatorTelegramId }).sort({ createdAt: -1 }).exec();
    }

    async completeTask(telegramId: string, campaignId: string) {
        // 1. Find the campaign and deduct its remaining budget atomically
        const campaign = await this.campaignModel.findOne({ _id: campaignId, status: 'active' });
        if (!campaign) return { success: false, error: 'Campaign not found or inactive' };

        if (campaign.remainingBudget < campaign.rewardPerClick) {
            // Exhausted
            await this.campaignModel.updateOne({ _id: campaignId }, { $set: { status: 'exhausted' } });
            return { success: false, error: 'Campaign exhausted' };
        }

        // Safely deduct from campaign
        const deductRes = await this.campaignModel.findOneAndUpdate(
            { _id: campaignId, remainingBudget: { $gte: campaign.rewardPerClick } },
            { $inc: { remainingBudget: -campaign.rewardPerClick } },
            { returnDocument: 'after' }
        );

        if (!deductRes) {
            return { success: false, error: 'Failed to process campaign budget' };
        }

        // Auto-exhaust logic
        if (deductRes.remainingBudget < deductRes.rewardPerClick) {
            await this.campaignModel.updateOne({ _id: campaignId }, { $set: { status: 'exhausted' } });
        }

        // 2. Add to User profile securely avoiding double clicks (Distribute 35% to User)
        const userCut = deductRes.rewardPerClick * 0.35;
        const credited = await this.usersService.creditRewardAndLogTask(telegramId, userCut, campaignId);

        if (!credited) {
            // Rollback the campaign deduction in case of cheat/duplicate to not burn advertiser funds
            await this.campaignModel.updateOne({ _id: campaignId }, { $inc: { remainingBudget: deductRes.rewardPerClick } });
            return { success: false, error: 'Reward already claimed or user invalid' };
        }

        // 3. Grant 5% margin to Upline if exists
        const user = await this.usersService.findByTelegramId(telegramId);
        if (user && user.referredBy) {
            const uplineCut = deductRes.rewardPerClick * 0.05;
            await this.usersService.creditReferralBonus(
                user.referredBy,
                uplineCut,
                user.username || `USER_${user.telegramId.substring(0, 5)}...`,
                'Airdrop Ad'
            );
        }

        // 60% Margin remaining automatically vanishes into the Ecosystem vault because it was deducted but never credited!

        await this.achievementsService.incrementProgress(telegramId, [2, 3, 4], 1);

        return { success: true, reward: userCut };
    }

    async updateCampaign(campaignId: string, data: { title?: string, description?: string, url?: string }) {
        const updated = await this.campaignModel.findByIdAndUpdate(campaignId, { $set: data }, { returnDocument: 'after' });
        if (!updated) return { success: false, error: 'Campaign not found' };
        return { success: true, campaign: updated };
    }

    async addBudget(campaignId: string, amount: number, telegramId: string) {
        if (amount < 10000) return { success: false, error: 'Minimum top-up is 10,000 ELIXIR' };

        const deducted = await this.usersService.debitElixir(telegramId, amount);
        if (!deducted) return { success: false, error: 'Insufficient Elixir balance' };

        const campaign = await this.campaignModel.findOneAndUpdate(
            { _id: campaignId },
            { $inc: { totalBudget: amount, remainingBudget: amount } },
            { returnDocument: 'after' }
        );

        if (!campaign) {
            await this.usersService.creditRewardAndLogTask(telegramId, amount, 'ROLLBACK_' + Date.now());
            return { success: false, error: 'Campaign not found' };
        }

        if (campaign.status === 'exhausted' && campaign.remainingBudget >= campaign.rewardPerClick) {
            campaign.status = 'active';
            await campaign.save();
        }

        return { success: true, campaign };
    }
}
