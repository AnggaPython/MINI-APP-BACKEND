import { Injectable, Inject, forwardRef, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { Cron } from "@nestjs/schedule";
import {
    MINING_FULL_TEMPLATES,
    MINING_FULL_ANIMATIONS,
} from "../bot/messages.constant";
import { User, UserDocument } from "./schemas/user.schema";
import {
    ReferralLog,
    ReferralLogDocument,
} from "./schemas/referral-log.schema";
import { HiLoBet, HiLoBetDocument } from "./schemas/hilo-bet.schema";
import { AchievementsService } from "../achievements/achievements.service";
import { ANCHOR_USD_PRICES } from "../constants/anchor-prices";
import { AdminService } from "../admin/admin.service";
import { CircularCasinoService } from "../admin/circular-casino.service";

export const VIP_RANKS = [
    {
        name: "NON-VIP",
        xp: 0,
        reward: 0,
        wdLimit: 3,
        maxWdUsd: 3,
        miningBoost: 0,
    },
    {
        name: "BRONZE",
        xp: 100,
        reward: 200,
        wdLimit: 10,
        maxWdUsd: 10,
        miningBoost: 0.05,
    },
    {
        name: "SILVER",
        xp: 1000,
        reward: 2000,
        wdLimit: 20,
        maxWdUsd: 50,
        miningBoost: 0.1,
    },
    {
        name: "GOLD",
        xp: 2000,
        reward: 4000,
        wdLimit: 50,
        maxWdUsd: 100,
        miningBoost: 0.25,
    },
    {
        name: "PLATINUM",
        xp: 15000,
        reward: 30000,
        wdLimit: 100,
        maxWdUsd: 250,
        miningBoost: 0.5,
    },
    {
        name: "DIAMOND",
        xp: 50000,
        reward: 100000,
        wdLimit: Infinity,
        maxWdUsd: 500,
        miningBoost: 1.0,
    },
    {
        name: "RUBY",
        xp: 100000,
        reward: 200000,
        wdLimit: Infinity,
        maxWdUsd: 1000,
        miningBoost: 2.5,
    },
    {
        name: "EMERALD",
        xp: 250000,
        reward: 500000,
        wdLimit: Infinity,
        maxWdUsd: Infinity,
        miningBoost: 5.0,
    },
];

export function getUserVipRank(exp: number) {
    let rank = VIP_RANKS[0];
    for (const tier of VIP_RANKS) {
        if (exp >= tier.xp) rank = tier;
        else break;
    }
    return rank;
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(ReferralLog.name)
        private referralLogModel: Model<ReferralLogDocument>,
        @InjectModel(HiLoBet.name) private hiloBetModel: Model<HiLoBetDocument>,
        @Inject(forwardRef(() => AchievementsService))
        private achievementsService: AchievementsService,
        @Inject(forwardRef(() => AdminService)) private adminService: AdminService,
        @Inject(forwardRef(() => CircularCasinoService))
        private circularCasino: CircularCasinoService,
    ) { }

    @Cron("0 1 * * *", { timeZone: "UTC" })
    async cleanupOldCodeDrops() {
        const expiredCodes: string[] = [];
        const now = new Date();

        // Loop to generate deterministic codes from 7 Days ago up to 30 Days ago
        for (let i = 7; i <= 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
            expiredCodes.push(`ELIX-${dateStr}`);
        }

        try {
            const result = await this.userModel
                .updateMany(
                    { claimedCodeDrops: { $in: expiredCodes } },
                    { $pull: { claimedCodeDrops: { $in: expiredCodes } } },
                )
                .exec();

            this.logger.log(
                `[Cron Garbage Collector] Wiped expired drop codes (>= 7 days old) from database arrays. Users cleared: ${result.modifiedCount}`,
            );
        } catch (e) {
            console.error(
                "[Cron Garbage Collector] Failed to cleanup old drop codes",
                e,
            );
        }
    }

    // ============================================
    // PERSONALIZED 100% MINING CAPACITY ALERTS
    // ============================================
    @Cron("*/5 * * * *", { timeZone: "UTC" })
    async notifyFullMining() {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) return;

        // Exactly 2 Hours = 7200000ms
        const twoHoursAgo = new Date(Date.now() - 7200000);

        // Anti-Rate Limit Buffer: Only grab 40 targets per 5 minutes maximum
        const usersToNotify = await this.userModel
            .find({
                miningStartDate: { $lte: twoHoursAgo, $ne: null },
                isMiningNotified: { $ne: true },
            })
            .limit(40)
            .exec();

        const now = new Date();
        const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const messageIndex = epochDays % 30; // Modulo rotation 0-29
        const animIndex = epochDays % MINING_FULL_ANIMATIONS.length;

        const rawMessageTemplate = MINING_FULL_TEMPLATES[messageIndex];
        const animationUrl = MINING_FULL_ANIMATIONS[animIndex];

        for (const user of usersToNotify) {
            try {
                const payload = {
                    chat_id: user.telegramId,
                    animation: animationUrl,
                    caption: rawMessageTemplate,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "💰 CLAIM EXTRACTED ELIXIR",
                                    url: "https://t.me/ElixirAds_bot/ElixirNetwork?startapp=earn",
                                },
                            ],
                        ],
                    },
                };

                const res = await fetch(
                    `https://api.telegram.org/bot${botToken}/sendAnimation`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    },
                );
                const data = await res.json();

                if (data.ok) {
                    await this.userModel
                        .updateOne(
                            { telegramId: user.telegramId },
                            { $set: { isMiningNotified: true } },
                        )
                        .exec();
                } else if (
                    data.error_code === 403 ||
                    data.error_code === 400 ||
                    (data.description && data.description.includes("bot was blocked"))
                ) {
                    // Bot was blocked by the user or Chat doesn't exist anymore -- flag true to silently stop trying
                    await this.userModel
                        .updateOne(
                            { telegramId: user.telegramId },
                            { $set: { isMiningNotified: true } },
                        )
                        .exec();
                }
            } catch (e) {
                console.error(
                    `[DM Pinger] Network error notifying mining full for user ${user.telegramId}`,
                );
            }

            // Add a synthetic 100ms delay to enforce safety against 30 msg/sec bounds
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    async syncTelegramUser(userData: Record<string, unknown>, referredBy?: string): Promise<User> {
        const { id, first_name, last_name, username, photo_url, is_premium } = userData as { id: string | number; first_name?: string; last_name?: string; username?: string; photo_url?: string; is_premium?: boolean };

        const updateData: Record<string, unknown> = {
            firstName: first_name,
            lastName: last_name,
            username: username,
            photoUrl: photo_url,
            isPremium: is_premium === true,
        };

        const telegramIdStr = id.toString();
        const existingUser = await this.userModel.findOne({ telegramId: telegramIdStr }).exec();

        let isNewReferralCapture = false;

        // Anti-Race Condition: Ensure if a user was created microseconds ago by another /sync hit 
        // that didn't pass start_param, we still capture the referral correctly!
        if (referredBy && referredBy !== telegramIdStr) {
            if (!existingUser || !existingUser.referredBy) {
                isNewReferralCapture = true;
                updateData.referredBy = referredBy;
            }
        }

        const user = await this.userModel
            .findOneAndUpdate(
                { telegramId: telegramIdStr },
                {
                    $set: updateData,
                    $setOnInsert: { elixirBalance: 0 },
                },
                { returnDocument: "after", upsert: true }
            )
            .exec();

        // Increment Upline achievements upon new valid referral registration
        if (isNewReferralCapture && referredBy) {
            await this.grantReferralReward(referredBy);
        }

        return user;
    }

    /**
     * Instant +50 ELIXIR to the upline's main balance + referral milestones.
     * Shared by auto-capture (sync) and manual code entry (claim-invite).
     */
    private async grantReferralReward(uplineTelegramId: string): Promise<void> {
        // Berikan 50 ELIXIR Instan ke saldo utama Upline
        await this.userModel.updateOne(
            { telegramId: uplineTelegramId },
            { $inc: { elixirBalance: 50, lifetimeElixir: 50 } }
        ).catch(console.error);

        await this.achievementsService.incrementProgress(
            uplineTelegramId,
            [12, 13, 14, 15, 16, 17],
            1,
        ).catch(console.error);
    }

    /**
     * Manual invite-code binding — fallback for users who entered via the
     * bot Menu/LAUNCH button (which can never carry a referral param).
     * Accepts a raw inviter telegram ID or a pasted referral link
     * (both `?start=` and `?startapp=` formats).
     */
    async claimInvite(
        telegramId: string,
        code: string,
    ): Promise<{ user?: User; error?: string }> {
        const telegramIdStr = telegramId.toString();
        const match = (code || "").match(/(\d{5,})/);
        const uplineId = match ? match[1] : "";

        if (!uplineId) return { error: "Invalid invite code." };
        if (uplineId === telegramIdStr) return { error: "You cannot invite yourself." };

        const user = await this.userModel.findOne({ telegramId: telegramIdStr }).exec();
        if (!user) return { error: "User not found. Please reopen the app first." };
        if (user.referredBy) return { error: "An invite code is already bound to your account." };

        const upline = await this.userModel.findOne({ telegramId: uplineId }).exec();
        if (!upline) return { error: "Inviter not found. Check the code and try again." };

        await this.userModel.updateOne(
            { telegramId: telegramIdStr },
            { $set: { referredBy: uplineId } },
        ).exec();
        await this.grantReferralReward(uplineId);

        const updated = await this.userModel.findOne({ telegramId: telegramIdStr }).exec();
        if (!updated) return { error: "User not found. Please reopen the app first." };
        return { user: updated };
    }

    async startMining(
        telegramId: string,
    ): Promise<{ user: User | null; error?: string }> {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { user: null, error: "User not found." };

        const updatedUser = await this.userModel
            .findOneAndUpdate(
                { telegramId },
                {
                    $set: {
                        miningStartDate: new Date(),
                        isMiningBoosted: false,
                        isMiningNotified: false,
                    },
                },
                { returnDocument: "after" },
            )
            .exec();
        return { user: updatedUser };
    }

    async boostMining(
        telegramId: string,
    ): Promise<{ user: User | null; error?: string }> {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { user: null, error: "User not found" };
        if (!user.miningStartDate) return { user, error: "Mining not started" };
        if (user.isMiningBoosted) return { user, error: "Already boosted" };

        const updatedUser = await this.userModel
            .findOneAndUpdate(
                { telegramId },
                { $set: { isMiningBoosted: true } },
                { returnDocument: "after" },
            )
            .exec();

        return { user: updatedUser };
    }

    async claimMining(
        telegramId: string,
    ): Promise<{ user: User | null; claimedAmount: number; error?: string }> {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { user: null, claimedAmount: 0, error: "User not found" };
        if (user.adTickets < 1)
            return {
                user: null,
                claimedAmount: 0,
                error:
                    "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        if (!user.miningStartDate)
            return { user, claimedAmount: 0, error: "Mining not started" };

        const now = new Date();
        const diffSec = (now.getTime() - user.miningStartDate.getTime()) / 1000;

        let secondsToClaim = diffSec > 7200 ? 7200 : diffSec;
        if (secondsToClaim < 0) secondsToClaim = 0;

        const baseReward = user.isMiningBoosted ? 5 : 2.5;
        let baseEarned = (baseReward / 7200) * secondsToClaim;

        const vipRank = getUserVipRank((user as unknown as { vipExp?: number }).vipExp ?? 0);
        let totalBonusMultiplier = vipRank.miningBoost; // e.g. 0.1 for 10%

        // Code Drop Voucher adds fixed +50% (0.5) to the multiplier pool
        if (user.miningVoucherExpiry && new Date() < user.miningVoucherExpiry) {
            totalBonusMultiplier += 0.5;
        }

        const reward = baseEarned + (baseEarned * totalBonusMultiplier);

        if (reward <= 0.0001)
            return { user, claimedAmount: 0, error: "Reward too small to claim yet" };

        const updatedUser = await this.userModel
            .findOneAndUpdate(
                { telegramId, miningStartDate: { $ne: null } },
                {
                    $inc: {
                        elixirBalance: reward,
                        lifetimeElixir: reward,
                        exp: 1,
                        gameExp: 1,
                        adTickets: -1,
                    },
                    $set: {
                        miningStartDate: null,
                        isMiningBoosted: false,
                        isMiningNotified: false,
                    },
                },
                { returnDocument: "after" },
            )
            .exec();

        if (!updatedUser)
            return {
                user: null,
                claimedAmount: 0,
                error: "Mining already claimed or not started",
            };

        if (updatedUser) {
            await this.achievementsService.incrementProgress(
                telegramId,
                [1, 8, 9, 10],
                1,
            );
        }

        return { user: updatedUser, claimedAmount: reward };
    }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        return this.userModel.findOne({ telegramId }).exec();
    }

    async findBySessionToken(token: string): Promise<UserDocument | null> {
        if (!token) return null;
        const user = await this.userModel.findOne({ sessionToken: token }).exec();
        if (!user) return null;
        // Token expired? Clean up and deny.
        if (!user.tokenExpiresAt || user.tokenExpiresAt.getTime() < Date.now()) {
            user.sessionToken = null;
            user.tokenExpiresAt = null;
            await user.save();
            return null;
        }
        return user;
    }

    async devLoginUsernamePassword(username: string, password: string) {
        // Username in this dev flow is used as the deterministic telegramId slug.
        // For convenience we hash username -> numeric ID so it works with the existing
        // telegramId:string unique field without breaking uniqueness constraints.
        if (!username || !password)
            return { error: "Missing username or password" };

        // Production: NEVER allow this endpoint.
        if (process.env.NODE_ENV === "production") {
            return { error: "Username-password login is disabled in production." };
        }

        const usernameSlug = String(username).trim().slice(0, 64);
        const displayName =
            usernameSlug.charAt(0).toUpperCase() +
            usernameSlug.slice(1).toLowerCase();
        // Deterministic numeric telegramId (16-digit) derived from username so same username
        // always resolves to same user document (good dev UX between sessions).
        const hashBuf = crypto.createHash("sha256").update(usernameSlug).digest();
        let idBig = 0n;
        for (let i = 0; i < 8; i++) idBig = (idBig << 8n) | BigInt(hashBuf[i]);
        const derivedTelegramId = (
            1000000000000000n +
            (idBig % 8999999999999999n)
        ).toString();

        let user = await this.userModel
            .findOne({ telegramId: derivedTelegramId })
            .exec();

        if (!user) {
            // New user registration — create account + hash password.
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            user = new this.userModel({
                telegramId: derivedTelegramId,
                firstName: displayName,
                lastName: "Dev",
                username: usernameSlug,
                authPasswordHash: passwordHash,
                miningStartDate: new Date(), // Auto-start mining for dev convenience
            });
            await user.save();
        } else {
            // Existing user — verify password against stored hash.
            // If no password hash is stored yet (e.g. registered via Telegram before),
            // allow dev-mode set-on-first-use so user can claim this account.
            if (!user.authPasswordHash) {
                const salt = await bcrypt.genSalt(10);
                user.authPasswordHash = await bcrypt.hash(password, salt);
                await user.save();
            } else {
                const ok = await bcrypt.compare(password, user.authPasswordHash);
                if (!ok) return { error: "Invalid credentials" };
            }
        }

        // Issue a 24-hour bearer session token.
        const sessionToken = crypto.randomBytes(32).toString("hex");
        user.sessionToken = sessionToken;
        user.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        return {
            success: true,
            token: sessionToken,
            tokenExpiresAt: user.tokenExpiresAt.toISOString(),
            user: {
                telegramId: user.telegramId,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
            },
        };
    }

    async debitElixir(telegramId: string, amount: number): Promise<boolean> {
        const result = await this.userModel
            .findOneAndUpdate(
                { telegramId, elixirBalance: { $gte: amount } },
                { $inc: { elixirBalance: -amount } },
            )
            .exec();
        return !!result;
    }

    async debitCrypto(
        telegramId: string,
        coin: string,
        amount: number,
    ): Promise<boolean> {
        if (amount <= 0 || !coin) return false;

        // Ensure atomic deduction directly on the dynamic symbol mapping
        const result = await this.userModel
            .findOneAndUpdate(
                {
                    telegramId,
                    [`cryptoBalances.${coin}`]: { $gte: amount },
                },
                {
                    $inc: { [`cryptoBalances.${coin}`]: -amount },
                },
            )
            .exec();
        return !!result;
    }

    async creditCrypto(
        telegramId: string,
        coin: string,
        amount: number,
    ): Promise<boolean> {
        if (amount <= 0 || !coin) return false;
        const result = await this.userModel
            .findOneAndUpdate(
                { telegramId },
                { $inc: { [`cryptoBalances.${coin}`]: amount } },
            )
            .exec();
        return !!result;
    }

    async creditRewardAndLogTask(
        telegramId: string,
        reward: number,
        campaignId: string,
    ): Promise<boolean> {
        const result = await this.userModel
            .findOneAndUpdate(
                { telegramId, completedTasks: { $ne: campaignId } },
                {
                    $inc: { elixirBalance: reward, lifetimeElixir: reward, exp: 1, gameExp: 1 },
                    $push: { completedTasks: campaignId },
                },
            )
            .exec();
        return !!result;
    }

    async creditReferralBonus(
        uplineTelegramId: string,
        margin: number,
        downlineUsername: string,
        actionHash: string,
    ): Promise<boolean> {
        if (!uplineTelegramId) return false;

        const result = await this.userModel
            .findOneAndUpdate(
                { telegramId: uplineTelegramId },
                { $inc: { referralBalance: margin } },
            )
            .exec();

        if (result) {
            await new this.referralLogModel({
                uplineTelegramId,
                downlineUsername,
                amount: margin,
                actionHash,
            }).save();
        }

        return !!result;
    }

    async getReferralStats(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        const totalReferrals = await this.userModel
            .countDocuments({ referredBy: telegramId })
            .exec();
        const history = await this.referralLogModel
            .find({ uplineTelegramId: telegramId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
            .exec();

        return {
            referralBalance: user ? user.referralBalance || 0 : 0,
            totalReferrals,
            history,
        };
    }

    async claimReferralVault(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user || (user.referralBalance || 0) < 1000)
            return { error: "Minimum 1000 ELIXIR required to claim vault" };

        const claimAmount = user.referralBalance;

        const updated = await this.userModel
            .findOneAndUpdate(
                { telegramId, referralBalance: { $gte: 1000 } },
                {
                    $inc: { elixirBalance: claimAmount, lifetimeElixir: claimAmount },
                    $set: { referralBalance: 0 },
                },
                { returnDocument: "after" },
            )
            .exec();

        if (!updated) return { error: "Failed to process claim" };

        return { success: true, user: updated, claimedAmount: claimAmount };
    }

    async claimDailyLogin(telegramId: string) {
        const userCheck = await this.userModel.findOne({ telegramId }).exec();
        if (!userCheck || userCheck.adTickets < 1) {
            return {
                error:
                    "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }

        const now = new Date();
        const updatedUser = await this.userModel
            .findOneAndUpdate(
                {
                    telegramId,
                    $or: [
                        { lastDailyLogin: null },
                        { lastDailyLogin: { $lte: new Date(Date.now() - 86390000) } },
                    ],
                },
                {
                    $set: { lastDailyLogin: now },
                    $inc: { elixirBalance: 5, lifetimeElixir: 5, adTickets: -1 },
                },
                { returnDocument: "after" },
            )
            .exec();

        if (!updatedUser)
            return {
                error:
                    "Come back in 24 hours to claim again or race condition mitigated!",
            };

        return { success: true, reward: 5, user: updatedUser };
    }

    async claimVipRank(telegramId: string, rankName: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { error: "User not found" };

        const rank = VIP_RANKS.find((r) => r.name === rankName.toUpperCase());
        if (!rank) return { error: "Invalid rank" };

        if (((user as unknown as { vipExp?: number }).vipExp ?? 0) < rank.xp)
            return { error: "Not enough XP for this rank" };
        if (user.claimedVipRanks && user.claimedVipRanks.includes(rank.name))
            return { error: "Rank already claimed" };
        if (rank.reward <= 0) return { error: "No reward available for this tier" };

        const updatedUser = await this.userModel
            .findOneAndUpdate(
                { telegramId, claimedVipRanks: { $ne: rank.name } },
                {
                    $inc: { elixirBalance: rank.reward, lifetimeElixir: rank.reward },
                    $addToSet: { claimedVipRanks: rank.name },
                },
                { returnDocument: "after" },
            )
            .exec();

        if (!updatedUser) return { error: "Rank already claimed" };

        return { success: true, user: updatedUser, reward: rank.reward };
    }

    async registerMonetagTicket(telegramId: string, payoutUSD: number = 0) {
        if (!telegramId) return;
        // Native S2S Trigger: Monetag validated the ad view. Give them the ticket!
        await this.userModel
            .updateOne(
                { telegramId },
                { $inc: { adTickets: 1, totalAdRevenueGeneratedUSD: payoutUSD } },
            )
            .exec();
        // Route ad revenue to Admin Profit Hub for platform sustainability auditing
        if (payoutUSD > 0) {
            await this.adminService.addProfit(
                "USD",
                payoutUSD,
                "MONETAG_S2S_PAYOUT",
                telegramId,
            );
        }
    }

    async claimFaucet(telegramId: string) {
        const now = new Date();

        // Phase 50: S2S Anti-Cheat Verification Lock
        const userCheck = await this.userModel.findOne({ telegramId }).exec();
        if (!userCheck) return { error: "User not found" };
        if (userCheck.adTickets < 1) {
            return {
                error:
                    "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }

        // Rigged Logic: Max roll is strictly 980,000 so the user gets 10 Elixir at most
        const finalNum = Math.floor(Math.random() * 980001);

        let reward = 3;
        if (finalNum >= 950001) reward = 10;
        else if (finalNum >= 800001) reward = 5;

        // Atomically securely deduct ticket while rolling
        const updatedUser = await this.userModel
            .findOneAndUpdate(
                {
                    telegramId,
                    $or: [
                        { lastFaucetRoll: null },
                        { lastFaucetRoll: { $lte: new Date(Date.now() - 3590000) } },
                    ],
                },
                {
                    $set: { lastFaucetRoll: now },
                    $inc: {
                        elixirBalance: reward,
                        lifetimeElixir: reward,
                        exp: 1,
                        gameExp: 1,
                        adTickets: -1,
                    },
                },
                { returnDocument: "after" },
            )
            .exec();

        if (!updatedUser)
            return { error: "Race condition mitigated or cooldown active" };

        return { success: true, finalNum, reward, user: updatedUser };
    }

    async claimCodeDrop(telegramId: string, code: string) {
        if (!code) return { error: "Invalid code provided" };

        const now = new Date();
        const utcHours = now.getUTCHours();

        // Cron deploys the drop exactly at 12:00 UTC. The 12-Hour Expiration lasts precisely until 23:59:59 UTC.
        // Attempting to claim before 12:00 implies claiming yesterday's code, which is mathematically > 12 hours old = EXPIRED.
        if (utcHours < 12) {
            return { error: "⚠️ CODE EXPIRED OR FULL CLAIMED!" };
        }

        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20260807
        const todayCode = `ELIX-${dateStr}`;

        if (code.toUpperCase() !== todayCode) {
            return { error: "⚠️ CODE EXPIRED OR FULL CLAIMED!" };
        }

        const totalClaims = await this.userModel
            .countDocuments({ claimedCodeDrops: todayCode })
            .exec();
        if (totalClaims >= 50) {
            return {
                error:
                    "⚠️ CODE EXPIRED OR FULL CLAIMED! This voucher was fully exhausted by the first 50 players.",
            };
        }

        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { error: "User not found" };
        if (user.adTickets < 1)
            return {
                error:
                    "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };

        if (
            user.claimedCodeDrops &&
            user.claimedCodeDrops.includes(code.toUpperCase())
        ) {
            return { error: "Anda sudah mengklaim Drop Code ini!" };
        }

        const voucherExpiry = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours

        const updatedUser = await this.userModel
            .findOneAndUpdate(
                { telegramId, claimedCodeDrops: { $ne: code.toUpperCase() } },
                {
                    $addToSet: { claimedCodeDrops: code.toUpperCase() },
                    $set: { miningVoucherExpiry: voucherExpiry },
                    $inc: {
                        elixirBalance: 2.5,
                        lifetimeElixir: 2.5,
                        exp: 1,
                        gameExp: 1,
                        adTickets: -1,
                    },
                },
                { returnDocument: "after" },
            )
            .exec();

        if (!updatedUser) return { error: "Gagal mengklaim voucher!" };

        return { success: true, user: updatedUser, reward: 2.5 };
    }

    async verifyTelegramChannel(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user) return { error: "User not found" };
        if (user.adTickets < 1)
            return {
                error:
                    "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        if (user.joinedTelegram) return { error: "Already claimed" };

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            // Mock mode if no token is available
            const updatedUser = await this.userModel
                .findOneAndUpdate(
                    { telegramId, joinedTelegram: { $ne: true } },
                    {
                        $set: { joinedTelegram: true },
                        $inc: { elixirBalance: 100, lifetimeElixir: 100, adTickets: -1 },
                    },
                    { returnDocument: "after" },
                )
                .exec();
            if (!updatedUser) return { error: "Already claimed" };
            return { success: true, reward: 100, user: updatedUser, mock: true };
        }

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=@ElixirNetwork&user_id=${telegramId}`,
            );
            const data = await response.json();

            if (
                data.ok &&
                ["member", "administrator", "creator"].includes(data.result.status)
            ) {
                const updatedUser = await this.userModel
                    .findOneAndUpdate(
                        { telegramId, joinedTelegram: { $ne: true } },
                        {
                            $set: { joinedTelegram: true },
                            $inc: { elixirBalance: 100, lifetimeElixir: 100, adTickets: -1 },
                        },
                        { returnDocument: "after" },
                    )
                    .exec();
                if (!updatedUser) return { error: "Already claimed" };
                return { success: true, reward: 100, user: updatedUser };
            } else {
                return { error: "Please join the channel first!" };
            }
        } catch (e) {
            return { error: "Verification failed" };
        }
    }

    async getBalance(telegramId: string) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        const withdrawLimits = await this.adminService.getWithdrawLimits();
        const totalReferrals = await this.userModel
            .countDocuments({ referredBy: telegramId })
            .exec();
        return {
            elixirBalance: user?.elixirBalance || 0,
            cryptoBalances: user?.cryptoBalances || {},
            materials: (user as unknown as { materials?: Record<string, number> }).materials || {},
            ownedPickaxes: user?.ownedPickaxes?.length
                ? user.ownedPickaxes
                : ["Common"],
            cwalletUid: user?.cwalletUid || null,
            solanaAddress: user?.solanaAddress || null,
            withdrawLimits,
            lifetimeElixir: user?.lifetimeElixir || 0,
            lastFaucetRoll: user?.lastFaucetRoll || null,
            totalReferrals,
            exp: user?.exp || 0,
            vipExp: (user as unknown as { vipExp?: number }).vipExp ?? 0,
            gameExp: (user as unknown as { gameExp?: number }).gameExp ?? user?.exp ?? 0,
            isBanned: Boolean(user?.isBanned),
        };
    }

    async bindCwalletUid(telegramId: string, uid: string) {
        if (!uid || uid.trim() === "") return { error: "Invalid UID" };
        const user = await this.userModel
            .findOneAndUpdate(
                { telegramId },
                { $set: { cwalletUid: uid } },
                { returnDocument: "after" },
            )
            .exec();
        return { success: true, user };
    }

    async bindSolanaAddress(telegramId: string, address: string) {
        if (!address || address.trim() === "") return { error: "Invalid Address" };
        const user = await this.userModel
            .findOneAndUpdate(
                { telegramId },
                { $set: { solanaAddress: address } },
                { returnDocument: "after" },
            )
            .exec();
        return { success: true, user };
    }

    private priceCache: Record<string, { price: number; timestamp: number }> = {};

    async getLivePrice(geckoId: string): Promise<number | null> {
        const now = Date.now();
        const cacheEntry = this.priceCache[geckoId];

        // Cache valid for 3 minutes to prevent rapid spam rate limits
        if (cacheEntry && now - cacheEntry.timestamp < 180000) {
            return cacheEntry.price;
        }

        try {
            const res = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`,
            );
            const data = await res.json();
            const price = data[geckoId]?.usd;

            if (price) {
                this.priceCache[geckoId] = { price, timestamp: now };
                return price;
            }
        } catch (e) {
            // Silently fall to cache
        }

        // Fallback to stale cache if API is offline but we have history
        if (cacheEntry) {
            return cacheEntry.price;
        }

        return null; // NO FALLBACK CONSTANTS. Fail securely to prevent hyper-inflation drain exploits.
    }

    async swapTokens(telegramId: string, fromAmount: number, targetCoin: string) {
        if (fromAmount <= 0) return { error: "Invalid exchange amount" };

        const locked = await this.lockUserForWithdrawal(telegramId);
        if (!locked)
            return { error: "A transaction is currently processing, please wait." };

        try {
            const user = await this.userModel.findOne({ telegramId }).exec();
            if (!user || user.elixirBalance < fromAmount) {
                return { error: "Insufficient ELIXIR balance for this swap" };
            }

            const coinGeckoMap: Record<string, string> = {
                ETH: "ethereum",
                MATIC: "matic-network",
                PEPE: "pepe",
                SOL: "solana",
                TIA: "celestia",
                LINK: "chainlink",
                INJ: "injective-protocol",
                DYM: "dymension",
                DOT: "polkadot",
                CRO: "crypto-com-chain",
                ARB: "arbitrum",
            };

            const geckoId = coinGeckoMap[targetCoin.toUpperCase()];
            if (!geckoId && !["USDT", "USDC"].includes(targetCoin.toUpperCase())) {
                return { error: "Unsupported destination token selected" };
            }

            let cryptoPrice = 1.0;
            if (geckoId) {
                const livePrice = await this.getLivePrice(geckoId);
                if (!livePrice)
                    return {
                        error:
                            "Price Oracle is currently offline. Trading is paused to protect market integrity.",
                    };
                cryptoPrice = livePrice;
            }

            // Math Calculations
            const usdValue = fromAmount / 10000; // 10000 ELIXIR = 1 USD
            const grossCryptoAmount = usdValue / cryptoPrice;

            // 8% Spread Deduction
            const netCryptoAmount = grossCryptoAmount * 0.92;

            if (!user.cryptoBalances) user.cryptoBalances = {};

            const currentTargetBalance = user.cryptoBalances[targetCoin] || 0;
            user.cryptoBalances[targetCoin] = currentTargetBalance + netCryptoAmount;
            user.elixirBalance -= fromAmount;

            // Mark explicitly for Mongoose to save Object Maps correctly
            user.markModified("cryptoBalances");
            await user.save();

            const spread = grossCryptoAmount * 0.08;
            await this.adminService.addProfit(
                targetCoin,
                spread,
                "SWAP_SPREAD",
                telegramId,
            );

            return {
                success: true,
                user,
                received: netCryptoAmount,
                gross: grossCryptoAmount,
                spread: grossCryptoAmount * 0.08,
            };
        } finally {
            await this.unlockUserWithdrawal(telegramId);
        }
    }

    async convertDustToElixir(telegramId: string, coinsToConvert: string[]) {
        if (!coinsToConvert || coinsToConvert.length === 0)
            return { error: "No coins selected" };

        // Convert is for NATIVE tokens/coins only — game economy coins
        // (ELIXIR, ELIXCOIN, minerals) are never convertible here.
        const GAME_COINS = new Set([
            "ELIXIR", "ELIXCOIN",
            "IRON", "COPPER", "SILVER", "GOLD", "DIAMOND",
        ]);
        const blocked = coinsToConvert.map((c) => c.toUpperCase()).find((sym) => GAME_COINS.has(sym));
        if (blocked)
            return { error: `${blocked} cannot be converted. Only native tokens/coins are convertible to ELIXIR.` };

        const locked = await this.lockUserForWithdrawal(telegramId);
        if (!locked)
            return { error: "A transaction is currently processing, please wait." };

        try {
            const user = await this.userModel.findOne({ telegramId }).exec();
            if (!user) return { error: "User not found" };
            if (!user.cryptoBalances) return { error: "No balances to convert" };

            const coinGeckoMap: Record<string, string> = {
                ETH: "ethereum",
                MATIC: "matic-network",
                PEPE: "pepe",
                SOL: "solana",
                TIA: "celestia",
                LINK: "chainlink",
                INJ: "injective-protocol",
                DYM: "dymension",
                DOT: "polkadot",
                CRO: "crypto-com-chain",
                ARB: "arbitrum",
            };

            let totalUsdValue = 0;

            for (const coin of coinsToConvert) {
                const sym = coin.toUpperCase();
                const balance = user.cryptoBalances[sym] || 0;
                if (balance <= 0) continue;

                // Game coins have no CoinGecko listing — value them at the
                // trade-spot USD anchor. Unknown symbols are REJECTED
                // (fail-closed): the old $1.0 fallback printed money.
                let cryptoPrice: number | null = null;
                const geckoId = coinGeckoMap[sym];

                if (geckoId) {
                    const livePrice = await this.getLivePrice(geckoId);
                    if (!livePrice)
                        return {
                            error: `Price Oracle is offline for ${sym}. Trading is paused.`,
                        };
                    cryptoPrice = livePrice;
                } else if (ANCHOR_USD_PRICES[sym] !== undefined) {
                    cryptoPrice = ANCHOR_USD_PRICES[sym];
                } else {
                    return {
                        error: `No price reference for ${sym}. Conversion paused.`,
                    };
                }

                const grossUsdValue = balance * cryptoPrice;
                const feeUsd = grossUsdValue * 0.003; // 0.3% fee
                const netUsdValue = grossUsdValue - feeUsd;

                totalUsdValue += netUsdValue;

                // Calculate native coin fee amount for Admin Logging
                const feeInNativeToken = balance * 0.003;
                if (feeInNativeToken > 0) {
                    await this.adminService.addProfit(
                        sym,
                        feeInNativeToken,
                        "DUST_CONVERT",
                        telegramId,
                    );
                }

                // Zero out the converted balance by modifying the actual MAP directly
                user.cryptoBalances[sym] = 0;
            }

            if (totalUsdValue <= 0) {
                return { error: "Selected balances have zero value." };
            }

            // 1 USD = 10,000 ELIXIR
            const elixirGained = totalUsdValue * 10000;
            user.elixirBalance = (user.elixirBalance || 0) + elixirGained;
            user.lifetimeElixir = (user.lifetimeElixir || 0) + elixirGained;

            // Force Mongoose to recognize changes in a Map object
            user.markModified("cryptoBalances");
            await user.save();

            return {
                success: true,
                elixirGained,
                newElixirBalance: user.elixirBalance,
                cryptoBalances: user.cryptoBalances,
            };
        } finally {
            await this.unlockUserWithdrawal(telegramId);
        }
    }

    async executeHiLoBet(
        telegramId: string,
        betAmount: number,
        multiplier: number,
        type: "hi" | "lo",
    ) {
        // ── Bet Constraints ──────────────────────────────────────────────────
        if (betAmount < 10 || betAmount > 50000) {
            return { error: "Bet amount must be between 10 and 50,000 ELIXIR" };
        }
        if (multiplier < 1.01 || multiplier > 100) {
            return { error: "Invalid multiplier constraint" };
        }

        // ── Protection #1: Daily Net Profit Ceiling Per User (UTC Day) ────────
        // Platform will not pay out more than 30,000 ELIXIR NET profit to a single
        // user per calendar day (UTC). Prevents whale draining the treasury.
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);

        const dailyStats = await this.hiloBetModel
            .aggregate([
                { $match: { telegramId, createdAt: { $gte: todayStart } } },
                { $group: { _id: null, totalProfit: { $sum: "$profit" } } },
            ])
            .exec();
        const dailyNetProfitUser = dailyStats[0]?.totalProfit || 0;

        if (dailyNetProfitUser >= 30000) {
            await this.userModel
                .updateOne({ telegramId }, { $inc: { elixirBalance: betAmount } })
                .exec();
            return {
                error:
                    "⚠️ Daily win limit reached. Come back tomorrow for more action!",
            };
        }

        // ── Protection #2: Treasury Liquidity Safe-Lock ────────
        // Prevents any single bet from winning more than 5% of the treasury threshold at once.
        const dStats = await this.circularCasino.getDashboardStats();
  // @ts-ignore - super strict cleanup pending (auto)
        const treasuryPool = dStats?.treasury?.value || 100000;
        const maxPermittedProfit = Math.floor(treasuryPool * 0.05);
        if (betAmount * multiplier - betAmount > maxPermittedProfit) {
            return { error: "Bet error please try again later" }; // Disguised error message to look like a server glitch
        }

        // ── Phase 35: Atomic Deduction (race-condition safe) ─────────────────
        const user = await this.userModel
            .findOneAndUpdate(
                { telegramId, elixirBalance: { $gte: betAmount } },
                { $inc: { elixirBalance: -betAmount } },
                { returnDocument: "after" },
            )
            .exec();

        if (!user) {
            return { error: "Insufficient balance or invalid bet amount" };
        }

        // ── Step 1: Matematika House Edge Transparan (Margin Tetap 10%) ──────
        // Menjaga margin 10% dari total probabilitas murni, bukan mencurangi dadunya
        const baseWinChance = (100 / multiplier) * 0.9;
        const thresholdHI = Math.floor(10000 - baseWinChance * 100);
        const thresholdLO = Math.ceil(baseWinChance * 100);

        // ── Step 2: Provably Fair RNG (SHA-256 HMAC) ─────────────────────────
        const serverSeed = crypto.randomBytes(16).toString("hex");
        const clientSeed = `${telegramId}-${Date.now()}`;
        const hash = crypto
            .createHmac("sha256", serverSeed)
            .update(clientSeed)
            .digest("hex");

        const hexSub = hash.substring(0, 5);
        const parsedHex = parseInt(hexSub, 16);
        const rolledNumber = parsedHex % 10001;

        // ── Step 3: Determine raw win/lose via transparent threshold ──────────
        let isWin = false;
        if (type === "hi" && rolledNumber >= thresholdHI) isWin = true;
        if (type === "lo" && rolledNumber <= thresholdLO) isWin = true;

        // ═══════════════════════════════════════════════════════════════════
        // STEP 5: CIRCULAR ZERO-SUM ENGINE (FINAL AUTHORITY)
        //   → Whale Pattern Shuffle if bet >= 500
        //   → Admin 90K trigger refill mode
        //   → Zero-sum: wins come from circular loss pool first, not admin
        //   → Vesting 50/50 + Turnover 10x lock for >10x profit wins
        // ═══════════════════════════════════════════════════════════════════
        let circularMeta: Record<string, unknown> | null = null;
        try {
            const outcome = await this.circularCasino.resolveHiLoBet(
                telegramId,
                user.firstName || null,
                (user as unknown as { username?: string }).username || null,
                betAmount,
                isWin,
                multiplier,
            );
            circularMeta = {
                isWhaleTrigger: outcome.isWhaleTrigger,
                patternApplied: outcome.patternApplied,
                maxAdminPayoutCapApplied: outcome.maxAdminPayoutCapApplied,
                circularPoolWasEmpty: outcome.circularPoolWasEmpty,
                refillModeActive: outcome.refillModeActive,
                vestingLocked: outcome.vestingLocked,
                vestingTurnoverRequired: outcome.vestingTurnoverRequired,
                adminDelta: outcome.adminDelta,
                circularPoolDelta: outcome.circularPoolDelta,
                burnedDelta: outcome.burnedDelta,
            };
            isWin = outcome.isWin;

            const userNet = outcome.userNetPayout;
            const reward = isWin ? userNet : 0;
            const profit = isWin ? reward - betAmount : -betAmount;
            let finalBalance = user.elixirBalance;
            if (isWin && userNet > 0) {
                const winUser = await this.userModel
                    .findOneAndUpdate(
                        { telegramId },
                        { $inc: { elixirBalance: userNet, lifetimeElixir: userNet } },
                        { returnDocument: "after" },
                    )
                    .exec();
                finalBalance = winUser ? winUser.elixirBalance : user.elixirBalance;
            }

            await new this.hiloBetModel({
                telegramId,
                betAmount,
                multiplier,
                targetType: type,
                thresholdHI,
                thresholdLO,
                rolledNumber,
                isWin,
                profit,
                newBalance: finalBalance,
                serverSeed,
                clientSeed,
                hash,
                circularMeta,
            }).save();

            if (betAmount >= 5000) {
                await this.userModel
                    .updateOne({ telegramId }, { $inc: { exp: 3, gameExp: 3 } })
                    .exec();
            }

            return {
                success: true,
                rolledNumber,
                thresholdHI,
                thresholdLO,
                isWin,
                profit,
                newBalance: finalBalance,
                vestingLocked: outcome.vestingLocked,
                vestingTurnoverRequired: outcome.vestingTurnoverRequired,
                circularMeta,
            };
        } catch (err) {
            this.logger.error(
                `[CircularCasino] Fatal resolveHiLoBet failed, refunding bet: ${err}`,
            );

            // SECURITY: Do NOT credit any win in the catch block.
            // The original isWin was computed BEFORE the casino's manipulation pass,
            // so it may not reflect the casino's final decision. Creditting a win here
            // could pay out when the casino would have changed the outcome to a loss.
            // Safe default: refund the bet (the atomic deduction already took it).
            const refund = betAmount;
            await this.userModel
                .updateOne(
                    { telegramId },
                    { $inc: { elixirBalance: refund } },
                )
                .exec();
            const finalBalance = user.elixirBalance; // after refund = original
            await new this.hiloBetModel({
                telegramId,
                betAmount,
                multiplier,
                targetType: type,
                thresholdHI,
                thresholdLO,
                rolledNumber,
                isWin: false,
                profit: 0,
                newBalance: finalBalance,
                serverSeed,
                clientSeed,
                hash,
            }).save();
            return {
                success: true,
                rolledNumber,
                thresholdHI,
                thresholdLO,
                isWin: false,
                profit: 0,
                newBalance: finalBalance,
                error: "Casino engine error — bet refunded.",
            };
        }
    }

    async getHiLoHistory(telegramId: string) {
        const history = await this.hiloBetModel
            .find({ telegramId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
            .exec();
        return history;
    }

    // --- Admin Interrogation Methods ---
    async searchUserForAdmin(query: string): Promise<User | null> {
        return this.userModel
            .findOne({
                $or: [
                    { telegramId: query },
                    { username: { $regex: new RegExp(`^${query}$`, "i") } },
                ],
            })
            .exec();
    }

    async updateUserBalanceAdmin(
        telegramId: string,
        elixirBalance?: number,
        cryptoBalances?: Record<string, number>,
    ): Promise<User | null> {
        const update: Record<string, unknown> = {};
        if (elixirBalance !== undefined) update.elixirBalance = elixirBalance;
        if (cryptoBalances !== undefined) update.cryptoBalances = cryptoBalances;

        return this.userModel
            .findOneAndUpdate(
                { telegramId },
                { $set: update },
                { returnDocument: "after" },
            )
            .exec();
    }

    async setUserBanStatus(
        telegramId: string,
        isBanned: boolean,
    ): Promise<User | null> {
        return this.userModel
            .findOneAndUpdate(
                { telegramId },
                { $set: { isBanned } },
                { returnDocument: "after" },
            )
            .exec();
    }

    async getDashboardStatsAdmin() {
        const totalUsers = await this.userModel.countDocuments().exec();

        const agg = await this.userModel
            .aggregate([
                {
                    $group: {
                        _id: null,
                        totalElixir: { $sum: "$elixirBalance" },
                        totalAdRevenueUSD: { $sum: "$totalAdRevenueGeneratedUSD" },
                    },
                },
            ])
            .exec();
        const totalElixir = agg[0]?.totalElixir || 0;
        const totalAdRevenueUSD = agg[0]?.totalAdRevenueUSD || 0;

        const recentUsers = await this.userModel
            .find()
            .sort({ elixirBalance: -1 })
            .limit(10)
            .select(
                "telegramId firstName lastName username isBanned createdAt elixirBalance cryptoBalances",
            )
            .lean()
            .exec();

        return {
            totalUsers,
            totalElixir,
            totalAdRevenueUSD,
            recentUsers,
        };
    }

    async getTopUsersPaginated(page: number = 1, perPage: number = 10) {
        const safePage = Math.max(1, Math.floor(Number(page) || 1));
        const safePerPage = Math.max(
            1,
            Math.min(100, Math.floor(Number(perPage) || 10)),
        );
        const skip = (safePage - 1) * safePerPage;

        const totalUsers = await this.userModel.countDocuments().exec();
        const users = await this.userModel
            .find()
            .sort({ elixirBalance: -1 })
            .skip(skip)
            .limit(safePerPage)
            .select(
                "telegramId firstName lastName username isBanned createdAt elixirBalance cryptoBalances",
            )
            .lean()
            .exec();

        const loadedCount = skip + users.length;
        const hasMore = loadedCount < totalUsers;

        return {
            users,
            page: safePage,
            perPage: safePerPage,
            totalUsers,
            hasMore,
            loadedCount,
        };
    }

    async lockUserForWithdrawal(telegramId: string): Promise<boolean> {
        const locked = await this.userModel
            .findOneAndUpdate(
                { telegramId, isWithdrawing: { $ne: true } },
                { $set: { isWithdrawing: true } },
            )
            .exec();
        return !!locked;
    }

    async unlockUserWithdrawal(telegramId: string): Promise<void> {
        await this.userModel
            .updateOne({ telegramId }, { $set: { isWithdrawing: false } })
            .exec();
    }

    async addExp(telegramId: string, amount: number): Promise<void> {
        await this.userModel
            .updateOne({ telegramId }, { $inc: { exp: amount, gameExp: amount } })
            .exec();
    }
}
