"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const campaign_schema_1 = require("./schemas/campaign.schema");
const users_service_1 = require("../users/users.service");
const achievements_service_1 = require("../achievements/achievements.service");
const admin_service_1 = require("../admin/admin.service");
let CampaignsService = class CampaignsService {
    campaignModel;
    usersService;
    achievementsService;
    adminService;
    constructor(campaignModel, usersService, achievementsService, adminService) {
        this.campaignModel = campaignModel;
        this.usersService = usersService;
        this.achievementsService = achievementsService;
        this.adminService = adminService;
    }
    async createCampaign(data) {
        if (data.totalBudget < 10000) {
            throw new common_1.BadRequestException('Minimum budget is 10,000 ELIXIR');
        }
        const isWeb = data.category.toUpperCase().includes('WEB');
        let minReward = isWeb ? 30 : 50;
        if (data.oneUserLifetime) {
            minReward = Math.ceil(minReward * 1.5);
        }
        if (data.rewardPerClick < minReward) {
            throw new common_1.BadRequestException(`Minimum Cost Per Action for this category is ${minReward} ELIXIR`);
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
    async getActiveCampaigns(telegramId) {
        const user = await this.usersService.findByTelegramId(telegramId);
        let completed = [];
        if (user && user.completedTasks) {
            completed = user.completedTasks.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
        }
        return this.campaignModel.find({
            status: 'active',
            _id: { $nin: completed }
        }).sort({ rewardPerClick: -1, createdAt: -1 }).limit(50).exec();
    }
    async getMyCampaigns(creatorTelegramId) {
        return this.campaignModel.find({ creatorTelegramId }).sort({ createdAt: -1 }).exec();
    }
    activeTaskStarts = new Map();
    async startTask(telegramId, campaignId) {
        const key = `${telegramId}_${campaignId}`;
        this.activeTaskStarts.set(key, Date.now());
        return { success: true };
    }
    async verifyTelegramMembership(telegramId, url) {
        if (!url)
            return null;
        const match = url.match(/t\.me\/([a-zA-Z0-9_]+)/i);
        if (!match)
            return null;
        const username = match[1];
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken)
            return null;
        try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=@${username}&user_id=${telegramId}`);
            const data = await res.json();
            if (data.ok) {
                const status = data.result.status;
                if (['member', 'administrator', 'creator'].includes(status))
                    return true;
                return false;
            }
            if (data.error_code === 400 && data.description.includes('chat not found')) {
                return null;
            }
            return false;
        }
        catch (e) {
            return null;
        }
    }
    async completeTask(telegramId, campaignId) {
        const campaign = await this.campaignModel.findOne({ _id: campaignId, status: 'active' });
        if (!campaign)
            return { success: false, error: 'Campaign not found or inactive' };
        let requires20sFallback = true;
        if (['CHANNEL', 'GROUP'].includes(campaign.category.toUpperCase())) {
            const isMember = await this.verifyTelegramMembership(telegramId, campaign.url);
            if (isMember === false) {
                return { success: false, error: 'NOT_VERIFIED', message: 'Telegram verification failed. Please ensure you joined the correct group/channel!' };
            }
            if (isMember === true) {
                requires20sFallback = false;
            }
        }
        if (requires20sFallback) {
            const key = `${telegramId}_${campaignId}`;
            const startTime = this.activeTaskStarts.get(key);
            if (!startTime || (Date.now() - startTime) < 20000) {
                return { success: false, error: 'COOLDOWN_ACTIVE', message: 'You must wait 20 seconds after interacting with the target before claiming the reward.' };
            }
            this.activeTaskStarts.delete(key);
        }
        if (campaign.remainingBudget < campaign.rewardPerClick) {
            if (campaign.autoRenew) {
                const topUpDeducted = await this.usersService.debitElixir(campaign.creatorTelegramId, 10000);
                if (topUpDeducted) {
                    await this.campaignModel.updateOne({ _id: campaignId }, { $inc: { totalBudget: 10000, remainingBudget: 10000 } });
                    campaign.remainingBudget += 10000;
                }
                else {
                    await this.campaignModel.updateOne({ _id: campaignId }, { $set: { status: 'exhausted', autoRenew: false } });
                    return { success: false, error: 'Campaign exhausted and auto-renew failed (insufficient balance)' };
                }
            }
            else {
                await this.campaignModel.updateOne({ _id: campaignId }, { $set: { status: 'exhausted' } });
                return { success: false, error: 'Campaign exhausted' };
            }
        }
        const deductRes = await this.campaignModel.findOneAndUpdate({ _id: campaignId, remainingBudget: { $gte: campaign.rewardPerClick } }, { $inc: { remainingBudget: -campaign.rewardPerClick } }, { returnDocument: 'after' });
        if (!deductRes) {
            return { success: false, error: 'Failed to process campaign budget' };
        }
        if (deductRes.remainingBudget < deductRes.rewardPerClick) {
            await this.campaignModel.updateOne({ _id: campaignId }, { $set: { status: 'exhausted' } });
        }
        const userCut = deductRes.rewardPerClick * 0.35;
        const credited = await this.usersService.creditRewardAndLogTask(telegramId, userCut, campaignId);
        if (!credited) {
            await this.campaignModel.updateOne({ _id: campaignId }, { $inc: { remainingBudget: deductRes.rewardPerClick } });
            return { success: false, error: 'Reward already claimed or user invalid' };
        }
        const user = await this.usersService.findByTelegramId(telegramId);
        if (user && user.referredBy) {
            const uplineCut = userCut * 0.10;
            await this.usersService.creditReferralBonus(user.referredBy, uplineCut, user.username || `USER_${user.telegramId.substring(0, 5)}...`, 'Airdrop Ad');
        }
        const adminMargin = deductRes.rewardPerClick * (user && user.referredBy ? 0.615 : 0.65);
        await this.adminService.addProfit('ELIXIR', adminMargin, 'CAMPAIGN_FEE', telegramId);
        await this.achievementsService.incrementProgress(telegramId, [2, 3, 4], 1);
        return { success: true, reward: userCut };
    }
    async updateCampaign(campaignId, data) {
        const updated = await this.campaignModel.findByIdAndUpdate(campaignId, { $set: data }, { returnDocument: 'after' });
        if (!updated)
            return { success: false, error: 'Campaign not found' };
        return { success: true, campaign: updated };
    }
    async addBudget(campaignId, amount, telegramId) {
        if (amount < 10000)
            return { success: false, error: 'Minimum top-up is 10,000 ELIXIR' };
        const deducted = await this.usersService.debitElixir(telegramId, amount);
        if (!deducted)
            return { success: false, error: 'Insufficient Elixir balance' };
        const campaign = await this.campaignModel.findOneAndUpdate({ _id: campaignId }, { $inc: { totalBudget: amount, remainingBudget: amount } }, { returnDocument: 'after' });
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
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(campaign_schema_1.Campaign.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => achievements_service_1.AchievementsService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => admin_service_1.AdminService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService,
        achievements_service_1.AchievementsService,
        admin_service_1.AdminService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map