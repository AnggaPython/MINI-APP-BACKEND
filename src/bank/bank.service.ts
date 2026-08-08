import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Stake, StakeDocument } from './schemas/stake.schema';
import { BankLog, BankLogDocument } from './schemas/bank-log.schema';
import { UsersService } from '../users/users.service';
import { AchievementsService } from '../achievements/achievements.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class BankService {
    private readonly logger = new Logger(BankService.name);

    constructor(
        @InjectModel(Stake.name) private stakeModel: Model<StakeDocument>,
        @InjectModel(BankLog.name) private bankLogModel: Model<BankLogDocument>,
        @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
        @Inject(forwardRef(() => AchievementsService)) private achievementsService: AchievementsService,
        private adminService: AdminService
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleAutoClaim() {
        // Runs every minute to evaluate if any autoClaim stakes exceed 24H since last claim
        const activeStakes = await this.stakeModel.find({ status: 'active', autoClaim: true }).exec();
        const now = new Date();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        for (const stake of activeStakes) {
            const msSinceClaim = now.getTime() - stake.lastClaimDate.getTime();
            if (msSinceClaim >= ONE_DAY_MS) {
                const earned = this.calculateYield(stake);
                if (earned > 0) {
                    stake.lastClaimDate = now > stake.maturityDate ? stake.maturityDate : now;
                    if (stake.autoReinvest) {
                        stake.amount += earned;
                        await stake.save();
                        await new this.bankLogModel({ telegramId: stake.telegramId, actionType: 'Claim Elixir', amount: earned }).save();
                    } else {
                        await stake.save();
                        await this.usersService.creditRewardAndLogTask(stake.telegramId, earned, 'Yield (Auto)');
                        await new this.bankLogModel({ telegramId: stake.telegramId, actionType: 'Claim Elixir', amount: earned }).save();
                    }

                    this.logger.log(`Auto-claimed ${earned} for user ${stake.telegramId}`);
                }
            }
        }
    }

    calculateYield(stake: StakeDocument): number {
        if (stake.status !== 'active') return 0;

        const now = new Date();
        const endDate = now > stake.maturityDate ? stake.maturityDate : now;
        if (endDate.getTime() <= stake.lastClaimDate.getTime()) return 0;

        const msPassed = endDate.getTime() - stake.lastClaimDate.getTime();
        const durationMs = stake.durationDays * 24 * 60 * 60 * 1000;

        const totalExpectedInterest = stake.amount * stake.rate;
        const yieldEarned = totalExpectedInterest * (msPassed / durationMs);

        return Math.max(0, yieldEarned);
    }

    async getStats(telegramId: string) {
        const stakes = await this.stakeModel.find({ telegramId, status: 'active' }).exec();
        const history = await this.bankLogModel.find({ telegramId }).sort({ createdAt: -1 }).limit(10).exec();

        // Sum Global TVL (Total active stakes across ALL users)
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
                autoClaim: s.autoClaim,
                autoReinvest: s.autoReinvest
            };
        });

        const personalStaked = stakes.reduce((acc, s) => acc + s.amount, 0);

        return { activeStakes, history, totalUnclaimedEarning, totalLiquidityPool, networkStaked, personalStaked };
    }

    async createStake(telegramId: string, amount: number, durationDays: number, rate: number, autoClaim: boolean = false) {
        if (amount < 1000) return { error: 'Minimum stake is 1,000 ELIXIR' };

        // Personal Quota limit: 20M
        const existingStakes = await this.stakeModel.find({ telegramId, status: 'active' }).exec();
        const personalStaked = existingStakes.reduce((acc, s) => acc + s.amount, 0);
        if (personalStaked + amount > 20000000) return { error: 'Personal saving quota reached. Max 20,000,000 ELIXIR per user.' };

        // Setup dates
        const now = new Date();
        const maturityDate = new Date();
        maturityDate.setDate(now.getDate() + durationDays);

        // Debit
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user || user.elixirBalance < amount) return { error: 'Insufficient balance' };

        const deducted = await this.usersService.debitElixir(telegramId, amount);
        if (!deducted) return { error: 'Transaction failed' };

        // Create stake
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

        // Create log
        await new this.bankLogModel({
            telegramId,
            actionType: 'Deposit Vault',
            amount
        }).save();

        // Increment achievement 'First staking bankroll' (ID: 7)
        await this.achievementsService.setProgressMax(telegramId, [7]);

        return { success: true, stake };
    }

    async claimEarnings(telegramId: string) {
        const stakes = await this.stakeModel.find({ telegramId, status: 'active' }).exec();
        if (stakes.length === 0) return { error: 'No active stakes found' };

        let totalClaim = 0;
        const now = new Date();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        let hasProcessedValid = false;

        for (const stake of stakes) {
            const msSinceClaim = now.getTime() - stake.lastClaimDate.getTime();
            if (msSinceClaim >= ONE_DAY_MS) {
                const earned = this.calculateYield(stake);
                if (earned > 0) {
                    const nextClaimDate = now > stake.maturityDate ? stake.maturityDate : now;
                    // Atomic Lock against parallel overlap claims by checking exact previous claim date
                    if (stake.autoReinvest) {
                        const updatedStake = await this.stakeModel.findOneAndUpdate(
                            { _id: stake._id, lastClaimDate: stake.lastClaimDate },
                            { $set: { lastClaimDate: nextClaimDate }, $inc: { amount: earned } },
                            { new: true }
                        ).exec();
                        if (updatedStake) hasProcessedValid = true;
                    } else {
                        const updatedStake = await this.stakeModel.findOneAndUpdate(
                            { _id: stake._id, lastClaimDate: stake.lastClaimDate },
                            { $set: { lastClaimDate: nextClaimDate } },
                            { new: true }
                        ).exec();
                        if (updatedStake) {
                            hasProcessedValid = true;
                            totalClaim += earned;
                        }
                    }
                }
            }
        }

        if (!hasProcessedValid) return { error: 'You can only claim yields once every 24 hours.' };
        if (totalClaim <= 0) return { error: 'No earnings to claim yet' };

        await this.usersService.creditRewardAndLogTask(telegramId, totalClaim, 'Yield'); // Adjusting to just add to balance generically

        // Create log
        await new this.bankLogModel({
            telegramId,
            actionType: 'Claim Elixir',
            amount: totalClaim
        }).save();

        return { success: true, claimedAmount: totalClaim };
    }

    async toggleGlobalConfig(telegramId: string, field: 'autoClaim' | 'autoReinvest', state: boolean) {
        try {
            const updateProps = field === 'autoClaim' ? { autoClaim: state } : { autoReinvest: state };
            await this.stakeModel.updateMany({ telegramId, status: 'active' }, { $set: updateProps }).exec();
            return { success: true };
        } catch (e: any) {
            return { success: false, error: 'Database error applying global config' };
        }
    }

    async unstake(telegramId: string, stakeId: string) {
        const stake = await this.stakeModel.findOne({ _id: stakeId, telegramId }).exec();
        if (!stake) return { error: 'Stake not found' };

        // Ensure atomic lockdown before initiating unstake sequence
        const lockedStake = await this.stakeModel.findOneAndUpdate(
            { _id: stakeId, telegramId, status: 'active' },
            { $set: { status: 'withdrawn' } },
            { new: true }
        ).exec();

        if (!lockedStake) return { error: 'Stake already withdrawn or in processing pipeline' };

        const now = new Date();
        const isMature = now >= stake.maturityDate;

        let returnAmount = 0;

        if (isMature) {
            // Only calculate yield if mature
            const uncollectedYield = this.calculateYield(stake);
            returnAmount = stake.amount + uncollectedYield;
        } else {
            // Premature Unstake => 10% penalty on principal AND forfeit all pending APR yield
            const penalty = stake.amount * 0.10;
            returnAmount = stake.amount - penalty;

            // Re-route penalty to admin ecosystem profit pool
            await this.adminService.addProfit('ELIXIR', penalty, 'UNSTAKE_PENALTY', telegramId);
        }

        // Directly add to elixir balance (debitElixir supports negative math for credits)
        await this.usersService.debitElixir(telegramId, -returnAmount);
        await new this.bankLogModel({
            telegramId,
            actionType: 'Withdraw Vault',
            amount: returnAmount
        }).save();
        return { success: true, returnAmount, penaltyMatured: !isMature };
    }

    async toggleStakeConfig(telegramId: string, stakeId: string, autoClaim: boolean, autoReinvest: boolean) {
        const updateDoc: any = {};
        if (typeof autoClaim === 'boolean') updateDoc.autoClaim = autoClaim;
        if (typeof autoReinvest === 'boolean') updateDoc.autoReinvest = autoReinvest;
        if (Object.keys(updateDoc).length === 0) return { error: 'No config provided' };

        const stake = await this.stakeModel.findOneAndUpdate({ _id: stakeId, telegramId, status: 'active' }, { $set: updateDoc }, { new: true }).exec();
        if (!stake) return { error: 'Active stake not found' };
        return { success: true, stake };
    }
}
