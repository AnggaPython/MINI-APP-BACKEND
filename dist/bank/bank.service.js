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
var BankService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const schedule_1 = require("@nestjs/schedule");
const mongoose_2 = require("mongoose");
const stake_schema_1 = require("./schemas/stake.schema");
const bank_log_schema_1 = require("./schemas/bank-log.schema");
const users_service_1 = require("../users/users.service");
const achievements_service_1 = require("../achievements/achievements.service");
let BankService = BankService_1 = class BankService {
    stakeModel;
    bankLogModel;
    usersService;
    achievementsService;
    logger = new common_1.Logger(BankService_1.name);
    constructor(stakeModel, bankLogModel, usersService, achievementsService) {
        this.stakeModel = stakeModel;
        this.bankLogModel = bankLogModel;
        this.usersService = usersService;
        this.achievementsService = achievementsService;
    }
    async handleAutoClaim() {
        const activeStakes = await this.stakeModel.find({ status: 'active', autoClaim: true }).exec();
        const now = new Date();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        for (const stake of activeStakes) {
            const msSinceClaim = now.getTime() - stake.lastClaimDate.getTime();
            if (msSinceClaim >= ONE_DAY_MS) {
                const earned = this.calculateYield(stake);
                if (earned > 0) {
                    stake.lastClaimDate = now > stake.maturityDate ? stake.maturityDate : now;
                    await stake.save();
                    await this.usersService.creditRewardAndLogTask(stake.telegramId, earned, 'Yield (Auto)');
                    await new this.bankLogModel({
                        telegramId: stake.telegramId,
                        actionType: 'Claim Elixir',
                        amount: earned
                    }).save();
                    this.logger.log(`Auto-claimed ${earned} for user ${stake.telegramId}`);
                }
            }
        }
    }
    calculateYield(stake) {
        if (stake.status !== 'active')
            return 0;
        const now = new Date();
        const endDate = now > stake.maturityDate ? stake.maturityDate : now;
        if (endDate.getTime() <= stake.lastClaimDate.getTime())
            return 0;
        const msPassed = endDate.getTime() - stake.lastClaimDate.getTime();
        const durationMs = stake.durationDays * 24 * 60 * 60 * 1000;
        const totalExpectedInterest = stake.amount * stake.rate;
        const yieldEarned = totalExpectedInterest * (msPassed / durationMs);
        return Math.max(0, yieldEarned);
    }
    async getStats(telegramId) {
        const stakes = await this.stakeModel.find({ telegramId, status: 'active' }).exec();
        const history = await this.bankLogModel.find({ telegramId }).sort({ createdAt: -1 }).limit(10).exec();
        const tvlAgg = await this.stakeModel.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).exec();
        const networkStaked = tvlAgg.length > 0 ? tvlAgg[0].total : 0;
        const globalTvlBase = 683983000;
        const totalLiquidityPool = globalTvlBase + networkStaked;
        let totalUnclaimedEarning = 0;
        const activeStakes = stakes.map(s => {
            const currentYield = this.calculateYield(s);
            totalUnclaimedEarning += currentYield;
            return {
                id: s._id,
                amount: s.amount,
                aprLabel: `${(s.rate * 100).toFixed(0)}% APR`,
                rate: s.rate,
                stakeDate: s.stakeDate,
                maturityDate: s.maturityDate,
                pendingYield: currentYield,
                autoClaim: s.autoClaim
            };
        });
        const personalStaked = stakes.reduce((acc, s) => acc + s.amount, 0);
        return { activeStakes, history, totalUnclaimedEarning, totalLiquidityPool, networkStaked, personalStaked };
    }
    async createStake(telegramId, amount, durationDays, rate, autoClaim = false) {
        if (amount < 1000)
            return { error: 'Minimum stake is 1,000 ELIXIR' };
        const existingStakes = await this.stakeModel.find({ telegramId, status: 'active' }).exec();
        const personalStaked = existingStakes.reduce((acc, s) => acc + s.amount, 0);
        if (personalStaked + amount > 20000000)
            return { error: 'Personal saving quota reached. Max 20,000,000 ELIXIR per user.' };
        const now = new Date();
        const maturityDate = new Date();
        maturityDate.setDate(now.getDate() + durationDays);
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user || user.elixirBalance < amount)
            return { error: 'Insufficient balance' };
        const deducted = await this.usersService.debitElixir(telegramId, amount);
        if (!deducted)
            return { error: 'Transaction failed' };
        const stake = await new this.stakeModel({
            telegramId,
            amount,
            durationDays,
            rate,
            stakeDate: now,
            maturityDate: maturityDate,
            lastClaimDate: now,
            status: 'active',
            autoClaim: autoClaim
        }).save();
        await new this.bankLogModel({
            telegramId,
            actionType: 'Deposit Vault',
            amount
        }).save();
        await this.achievementsService.setProgressMax(telegramId, [7]);
        return { success: true, stake };
    }
    async claimEarnings(telegramId) {
        const stakes = await this.stakeModel.find({ telegramId, status: 'active' }).exec();
        if (stakes.length === 0)
            return { error: 'No active stakes found' };
        let totalClaim = 0;
        const now = new Date();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        let hasProcessedValid = false;
        for (const stake of stakes) {
            const msSinceClaim = now.getTime() - stake.lastClaimDate.getTime();
            if (msSinceClaim >= ONE_DAY_MS) {
                const earned = this.calculateYield(stake);
                if (earned > 0) {
                    hasProcessedValid = true;
                    totalClaim += earned;
                    stake.lastClaimDate = now > stake.maturityDate ? stake.maturityDate : now;
                    await stake.save();
                }
            }
        }
        if (!hasProcessedValid)
            return { error: 'You can only claim yields once every 24 hours.' };
        if (totalClaim <= 0)
            return { error: 'No earnings to claim yet' };
        await this.usersService.creditRewardAndLogTask(telegramId, totalClaim, 'Yield');
        await new this.bankLogModel({
            telegramId,
            actionType: 'Claim Elixir',
            amount: totalClaim
        }).save();
        return { success: true, claimedAmount: totalClaim };
    }
    async unstake(telegramId, stakeId) {
        const stake = await this.stakeModel.findOne({ _id: stakeId, telegramId }).exec();
        if (!stake)
            return { error: 'Stake not found' };
        if (stake.status !== 'active')
            return { error: 'Stake already withdrawn' };
        const now = new Date();
        const isMature = now >= stake.maturityDate;
        let returnAmount = 0;
        if (isMature) {
            const uncollectedYield = this.calculateYield(stake);
            returnAmount = stake.amount + uncollectedYield;
        }
        else {
            const penalty = stake.amount * 0.10;
            returnAmount = stake.amount - penalty;
        }
        stake.status = 'withdrawn';
        await stake.save();
        await this.usersService.creditReferralBonus(telegramId, returnAmount, 'SYSTEM', 'UNSTAKE');
        await this.usersService.debitElixir(telegramId, -returnAmount);
        await new this.bankLogModel({
            telegramId,
            actionType: 'Withdraw Vault',
            amount: returnAmount
        }).save();
        return { success: true, returnAmount, penaltyMatured: !isMature };
    }
    async toggleAutoClaim(telegramId, autoClaim) {
        await this.stakeModel.updateMany({ telegramId, status: 'active' }, { $set: { autoClaim } }).exec();
        return { success: true, autoClaim };
    }
};
exports.BankService = BankService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BankService.prototype, "handleAutoClaim", null);
exports.BankService = BankService = BankService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(stake_schema_1.Stake.name)),
    __param(1, (0, mongoose_1.InjectModel)(bank_log_schema_1.BankLog.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => achievements_service_1.AchievementsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService,
        achievements_service_1.AchievementsService])
], BankService);
//# sourceMappingURL=bank.service.js.map