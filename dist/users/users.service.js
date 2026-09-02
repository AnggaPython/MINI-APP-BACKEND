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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = exports.VIP_RANKS = void 0;
exports.getUserVipRank = getUserVipRank;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const schedule_1 = require("@nestjs/schedule");
const messages_constant_1 = require("../bot/messages.constant");
const user_schema_1 = require("./schemas/user.schema");
const referral_log_schema_1 = require("./schemas/referral-log.schema");
const hilo_bet_schema_1 = require("./schemas/hilo-bet.schema");
const achievements_service_1 = require("../achievements/achievements.service");
const admin_service_1 = require("../admin/admin.service");
const circular_casino_service_1 = require("../admin/circular-casino.service");
exports.VIP_RANKS = [
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
function getUserVipRank(exp) {
    let rank = exports.VIP_RANKS[0];
    for (const tier of exports.VIP_RANKS) {
        if (exp >= tier.xp)
            rank = tier;
        else
            break;
    }
    return rank;
}
let UsersService = UsersService_1 = class UsersService {
    userModel;
    referralLogModel;
    hiloBetModel;
    achievementsService;
    adminService;
    circularCasino;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(userModel, referralLogModel, hiloBetModel, achievementsService, adminService, circularCasino) {
        this.userModel = userModel;
        this.referralLogModel = referralLogModel;
        this.hiloBetModel = hiloBetModel;
        this.achievementsService = achievementsService;
        this.adminService = adminService;
        this.circularCasino = circularCasino;
    }
    async cleanupOldCodeDrops() {
        const expiredCodes = [];
        const now = new Date();
        for (let i = 7; i <= 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
            expiredCodes.push(`ELIX-${dateStr}`);
        }
        try {
            const result = await this.userModel
                .updateMany({ claimedCodeDrops: { $in: expiredCodes } }, { $pull: { claimedCodeDrops: { $in: expiredCodes } } })
                .exec();
            this.logger.log(`[Cron Garbage Collector] Wiped expired drop codes (>= 7 days old) from database arrays. Users cleared: ${result.modifiedCount}`);
        }
        catch (e) {
            console.error("[Cron Garbage Collector] Failed to cleanup old drop codes", e);
        }
    }
    async notifyFullMining() {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken)
            return;
        const twoHoursAgo = new Date(Date.now() - 7200000);
        const usersToNotify = await this.userModel
            .find({
            miningStartDate: { $lte: twoHoursAgo, $ne: null },
            isMiningNotified: { $ne: true },
        })
            .limit(40)
            .exec();
        const now = new Date();
        const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const messageIndex = epochDays % 30;
        const animIndex = epochDays % messages_constant_1.MINING_FULL_ANIMATIONS.length;
        const rawMessageTemplate = messages_constant_1.MINING_FULL_TEMPLATES[messageIndex];
        const animationUrl = messages_constant_1.MINING_FULL_ANIMATIONS[animIndex];
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
                                    url: "https://t.me/ElixirAds_bot/app?startapp=earn",
                                },
                            ],
                        ],
                    },
                };
                const res = await fetch(`https://api.telegram.org/bot${botToken}/sendAnimation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.ok) {
                    await this.userModel
                        .updateOne({ telegramId: user.telegramId }, { $set: { isMiningNotified: true } })
                        .exec();
                }
                else if (data.error_code === 403 ||
                    data.error_code === 400 ||
                    (data.description && data.description.includes("bot was blocked"))) {
                    await this.userModel
                        .updateOne({ telegramId: user.telegramId }, { $set: { isMiningNotified: true } })
                        .exec();
                }
            }
            catch (e) {
                console.error(`[DM Pinger] Network error notifying mining full for user ${user.telegramId}`);
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
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
        const telegramIdStr = id.toString();
        const existingUser = await this.userModel.findOne({ telegramId: telegramIdStr }).exec();
        let isNewReferralCapture = false;
        if (referredBy && referredBy !== telegramIdStr) {
            if (!existingUser || !existingUser.referredBy) {
                isNewReferralCapture = true;
                updateData.referredBy = referredBy;
            }
        }
        const user = await this.userModel
            .findOneAndUpdate({ telegramId: telegramIdStr }, {
            $set: updateData,
            $setOnInsert: { elixirBalance: 0 },
        }, { returnDocument: "after", upsert: true })
            .exec();
        if (isNewReferralCapture && referredBy) {
            await this.userModel.updateOne({ telegramId: referredBy }, { $inc: { elixirBalance: 50, lifetimeElixir: 50 } }).catch(console.error);
            await this.achievementsService.incrementProgress(referredBy, [12, 13, 14, 15, 16, 17], 1).catch(console.error);
        }
        return user;
    }
    async startMining(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { user: null, error: "User not found." };
        const updatedUser = await this.userModel
            .findOneAndUpdate({ telegramId }, {
            $set: {
                miningStartDate: new Date(),
                isMiningBoosted: false,
                isMiningNotified: false,
            },
        }, { returnDocument: "after" })
            .exec();
        return { user: updatedUser };
    }
    async boostMining(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { user: null, error: "User not found" };
        if (!user.miningStartDate)
            return { user, error: "Mining not started" };
        if (user.isMiningBoosted)
            return { user, error: "Already boosted" };
        const updatedUser = await this.userModel
            .findOneAndUpdate({ telegramId }, { $set: { isMiningBoosted: true } }, { returnDocument: "after" })
            .exec();
        return { user: updatedUser };
    }
    async claimMining(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { user: null, claimedAmount: 0, error: "User not found" };
        if (user.adTickets < 1)
            return {
                user: null,
                claimedAmount: 0,
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        if (!user.miningStartDate)
            return { user, claimedAmount: 0, error: "Mining not started" };
        const now = new Date();
        const diffSec = (now.getTime() - user.miningStartDate.getTime()) / 1000;
        let secondsToClaim = diffSec > 7200 ? 7200 : diffSec;
        if (secondsToClaim < 0)
            secondsToClaim = 0;
        const baseReward = user.isMiningBoosted ? 5 : 2.5;
        let baseEarned = (baseReward / 7200) * secondsToClaim;
        const vipRank = getUserVipRank(user.vipExp ?? user.exp ?? 0);
        let totalBonusMultiplier = vipRank.miningBoost;
        if (user.miningVoucherExpiry && new Date() < user.miningVoucherExpiry) {
            totalBonusMultiplier += 0.5;
        }
        const reward = baseEarned + (baseEarned * totalBonusMultiplier);
        if (reward <= 0.0001)
            return { user, claimedAmount: 0, error: "Reward too small to claim yet" };
        const updatedUser = await this.userModel
            .findOneAndUpdate({ telegramId, miningStartDate: { $ne: null } }, {
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
        }, { returnDocument: "after" })
            .exec();
        if (!updatedUser)
            return {
                user: null,
                claimedAmount: 0,
                error: "Mining already claimed or not started",
            };
        if (updatedUser) {
            await this.achievementsService.incrementProgress(telegramId, [1, 8, 9, 10], 1);
        }
        return { user: updatedUser, claimedAmount: reward };
    }
    async findByTelegramId(telegramId) {
        return this.userModel.findOne({ telegramId }).exec();
    }
    async findBySessionToken(token) {
        if (!token)
            return null;
        const user = await this.userModel.findOne({ sessionToken: token }).exec();
        if (!user)
            return null;
        if (!user.tokenExpiresAt || user.tokenExpiresAt.getTime() < Date.now()) {
            user.sessionToken = null;
            user.tokenExpiresAt = null;
            await user.save();
            return null;
        }
        return user;
    }
    async devLoginUsernamePassword(username, password) {
        if (!username || !password)
            return { error: "Missing username or password" };
        if (process.env.NODE_ENV === "production") {
            return { error: "Username-password login is disabled in production." };
        }
        const usernameSlug = String(username).trim().slice(0, 64);
        const displayName = usernameSlug.charAt(0).toUpperCase() +
            usernameSlug.slice(1).toLowerCase();
        const hashBuf = crypto.createHash("sha256").update(usernameSlug).digest();
        let idBig = 0n;
        for (let i = 0; i < 8; i++)
            idBig = (idBig << 8n) | BigInt(hashBuf[i]);
        const derivedTelegramId = (1000000000000000n +
            (idBig % 8999999999999999n)).toString();
        let user = await this.userModel
            .findOne({ telegramId: derivedTelegramId })
            .exec();
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            user = new this.userModel({
                telegramId: derivedTelegramId,
                firstName: displayName,
                lastName: "Dev",
                username: usernameSlug,
                authPasswordHash: passwordHash,
                miningStartDate: new Date(),
            });
            await user.save();
        }
        else {
            if (!user.authPasswordHash) {
                const salt = await bcrypt.genSalt(10);
                user.authPasswordHash = await bcrypt.hash(password, salt);
                await user.save();
            }
            else {
                const ok = await bcrypt.compare(password, user.authPasswordHash);
                if (!ok)
                    return { error: "Invalid credentials" };
            }
        }
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
    async debitElixir(telegramId, amount) {
        const result = await this.userModel
            .findOneAndUpdate({ telegramId, elixirBalance: { $gte: amount } }, { $inc: { elixirBalance: -amount } })
            .exec();
        return !!result;
    }
    async debitCrypto(telegramId, coin, amount) {
        if (amount <= 0 || !coin)
            return false;
        const result = await this.userModel
            .findOneAndUpdate({
            telegramId,
            [`cryptoBalances.${coin}`]: { $gte: amount },
        }, {
            $inc: { [`cryptoBalances.${coin}`]: -amount },
        })
            .exec();
        return !!result;
    }
    async creditCrypto(telegramId, coin, amount) {
        if (amount <= 0 || !coin)
            return false;
        const result = await this.userModel
            .findOneAndUpdate({ telegramId }, { $inc: { [`cryptoBalances.${coin}`]: amount } })
            .exec();
        return !!result;
    }
    async creditRewardAndLogTask(telegramId, reward, campaignId) {
        const result = await this.userModel
            .findOneAndUpdate({ telegramId, completedTasks: { $ne: campaignId } }, {
            $inc: { elixirBalance: reward, lifetimeElixir: reward, exp: 1, gameExp: 1 },
            $push: { completedTasks: campaignId },
        })
            .exec();
        return !!result;
    }
    async creditReferralBonus(uplineTelegramId, margin, downlineUsername, actionHash) {
        if (!uplineTelegramId)
            return false;
        const result = await this.userModel
            .findOneAndUpdate({ telegramId: uplineTelegramId }, { $inc: { referralBalance: margin } })
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
    async getReferralStats(telegramId) {
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
    async claimReferralVault(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user || (user.referralBalance || 0) < 1000)
            return { error: "Minimum 1000 ELIXIR required to claim vault" };
        const claimAmount = user.referralBalance;
        const updated = await this.userModel
            .findOneAndUpdate({ telegramId, referralBalance: { $gte: 1000 } }, {
            $inc: { elixirBalance: claimAmount, lifetimeElixir: claimAmount },
            $set: { referralBalance: 0 },
        }, { returnDocument: "after" })
            .exec();
        if (!updated)
            return { error: "Failed to process claim" };
        return { success: true, user: updated, claimedAmount: claimAmount };
    }
    async claimDailyLogin(telegramId) {
        const userCheck = await this.userModel.findOne({ telegramId }).exec();
        if (!userCheck || userCheck.adTickets < 1) {
            return {
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }
        const now = new Date();
        const updatedUser = await this.userModel
            .findOneAndUpdate({
            telegramId,
            $or: [
                { lastDailyLogin: null },
                { lastDailyLogin: { $lte: new Date(Date.now() - 86390000) } },
            ],
        }, {
            $set: { lastDailyLogin: now },
            $inc: { elixirBalance: 5, lifetimeElixir: 5, adTickets: -1 },
        }, { returnDocument: "after" })
            .exec();
        if (!updatedUser)
            return {
                error: "Come back in 24 hours to claim again or race condition mitigated!",
            };
        return { success: true, reward: 5, user: updatedUser };
    }
    async claimVipRank(telegramId, rankName) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { error: "User not found" };
        const rank = exports.VIP_RANKS.find((r) => r.name === rankName.toUpperCase());
        if (!rank)
            return { error: "Invalid rank" };
        if ((user.vipExp ?? user.exp ?? 0) < rank.xp)
            return { error: "Not enough XP for this rank" };
        if (user.claimedVipRanks && user.claimedVipRanks.includes(rank.name))
            return { error: "Rank already claimed" };
        if (rank.reward <= 0)
            return { error: "No reward available for this tier" };
        const updatedUser = await this.userModel
            .findOneAndUpdate({ telegramId, claimedVipRanks: { $ne: rank.name } }, {
            $inc: { elixirBalance: rank.reward, lifetimeElixir: rank.reward },
            $addToSet: { claimedVipRanks: rank.name },
        }, { returnDocument: "after" })
            .exec();
        if (!updatedUser)
            return { error: "Rank already claimed" };
        return { success: true, user: updatedUser, reward: rank.reward };
    }
    async registerMonetagTicket(telegramId, payoutUSD = 0) {
        if (!telegramId)
            return;
        await this.userModel
            .updateOne({ telegramId }, { $inc: { adTickets: 1, totalAdRevenueGeneratedUSD: payoutUSD } })
            .exec();
        if (payoutUSD > 0) {
            await this.adminService.addProfit("USD", payoutUSD, "MONETAG_S2S_PAYOUT", telegramId);
        }
    }
    async claimFaucet(telegramId) {
        const now = new Date();
        const userCheck = await this.userModel.findOne({ telegramId }).exec();
        if (!userCheck)
            return { error: "User not found" };
        if (userCheck.adTickets < 1) {
            return {
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }
        const finalNum = Math.floor(Math.random() * 980001);
        let reward = 3;
        if (finalNum >= 950001)
            reward = 10;
        else if (finalNum >= 800001)
            reward = 5;
        const updatedUser = await this.userModel
            .findOneAndUpdate({
            telegramId,
            $or: [
                { lastFaucetRoll: null },
                { lastFaucetRoll: { $lte: new Date(Date.now() - 3590000) } },
            ],
        }, {
            $set: { lastFaucetRoll: now },
            $inc: {
                elixirBalance: reward,
                lifetimeElixir: reward,
                exp: 1,
                gameExp: 1,
                adTickets: -1,
            },
        }, { returnDocument: "after" })
            .exec();
        if (!updatedUser)
            return { error: "Race condition mitigated or cooldown active" };
        return { success: true, finalNum, reward, user: updatedUser };
    }
    async claimCodeDrop(telegramId, code) {
        if (!code)
            return { error: "Invalid code provided" };
        const now = new Date();
        const utcHours = now.getUTCHours();
        if (utcHours < 12) {
            return { error: "⚠️ CODE EXPIRED OR FULL CLAIMED!" };
        }
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
        const todayCode = `ELIX-${dateStr}`;
        if (code.toUpperCase() !== todayCode) {
            return { error: "⚠️ CODE EXPIRED OR FULL CLAIMED!" };
        }
        const totalClaims = await this.userModel
            .countDocuments({ claimedCodeDrops: todayCode })
            .exec();
        if (totalClaims >= 50) {
            return {
                error: "⚠️ CODE EXPIRED OR FULL CLAIMED! This voucher was fully exhausted by the first 50 players.",
            };
        }
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { error: "User not found" };
        if (user.adTickets < 1)
            return {
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        if (user.claimedCodeDrops &&
            user.claimedCodeDrops.includes(code.toUpperCase())) {
            return { error: "Anda sudah mengklaim Drop Code ini!" };
        }
        const voucherExpiry = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        const updatedUser = await this.userModel
            .findOneAndUpdate({ telegramId, claimedCodeDrops: { $ne: code.toUpperCase() } }, {
            $addToSet: { claimedCodeDrops: code.toUpperCase() },
            $set: { miningVoucherExpiry: voucherExpiry },
            $inc: {
                elixirBalance: 2.5,
                lifetimeElixir: 2.5,
                exp: 1,
                gameExp: 1,
                adTickets: -1,
            },
        }, { returnDocument: "after" })
            .exec();
        if (!updatedUser)
            return { error: "Gagal mengklaim voucher!" };
        return { success: true, user: updatedUser, reward: 2.5 };
    }
    async verifyTelegramChannel(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { error: "User not found" };
        if (user.adTickets < 1)
            return {
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        if (user.joinedTelegram)
            return { error: "Already claimed" };
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            const updatedUser = await this.userModel
                .findOneAndUpdate({ telegramId, joinedTelegram: { $ne: true } }, {
                $set: { joinedTelegram: true },
                $inc: { elixirBalance: 100, lifetimeElixir: 100, adTickets: -1 },
            }, { returnDocument: "after" })
                .exec();
            if (!updatedUser)
                return { error: "Already claimed" };
            return { success: true, reward: 100, user: updatedUser, mock: true };
        }
        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=@ElixirNetwork&user_id=${telegramId}`);
            const data = await response.json();
            if (data.ok &&
                ["member", "administrator", "creator"].includes(data.result.status)) {
                const updatedUser = await this.userModel
                    .findOneAndUpdate({ telegramId, joinedTelegram: { $ne: true } }, {
                    $set: { joinedTelegram: true },
                    $inc: { elixirBalance: 100, lifetimeElixir: 100, adTickets: -1 },
                }, { returnDocument: "after" })
                    .exec();
                if (!updatedUser)
                    return { error: "Already claimed" };
                return { success: true, reward: 100, user: updatedUser };
            }
            else {
                return { error: "Please join the channel first!" };
            }
        }
        catch (e) {
            return { error: "Verification failed" };
        }
    }
    async getBalance(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        const withdrawLimits = await this.adminService.getWithdrawLimits();
        const totalReferrals = await this.userModel
            .countDocuments({ referredBy: telegramId })
            .exec();
        return {
            elixirBalance: user?.elixirBalance || 0,
            cryptoBalances: user?.cryptoBalances || {},
            materials: user.materials || {},
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
            vipExp: user.vipExp ?? user?.exp ?? 0,
            gameExp: user.gameExp ?? user?.exp ?? 0,
            isBanned: Boolean(user?.isBanned),
        };
    }
    async bindCwalletUid(telegramId, uid) {
        if (!uid || uid.trim() === "")
            return { error: "Invalid UID" };
        const user = await this.userModel
            .findOneAndUpdate({ telegramId }, { $set: { cwalletUid: uid } }, { returnDocument: "after" })
            .exec();
        return { success: true, user };
    }
    async bindSolanaAddress(telegramId, address) {
        if (!address || address.trim() === "")
            return { error: "Invalid Address" };
        const user = await this.userModel
            .findOneAndUpdate({ telegramId }, { $set: { solanaAddress: address } }, { returnDocument: "after" })
            .exec();
        return { success: true, user };
    }
    priceCache = {};
    async getLivePrice(geckoId) {
        const now = Date.now();
        const cacheEntry = this.priceCache[geckoId];
        if (cacheEntry && now - cacheEntry.timestamp < 180000) {
            return cacheEntry.price;
        }
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
            const data = await res.json();
            const price = data[geckoId]?.usd;
            if (price) {
                this.priceCache[geckoId] = { price, timestamp: now };
                return price;
            }
        }
        catch (e) {
        }
        if (cacheEntry) {
            return cacheEntry.price;
        }
        return null;
    }
    async swapTokens(telegramId, fromAmount, targetCoin) {
        if (fromAmount <= 0)
            return { error: "Invalid exchange amount" };
        const locked = await this.lockUserForWithdrawal(telegramId);
        if (!locked)
            return { error: "A transaction is currently processing, please wait." };
        try {
            const user = await this.userModel.findOne({ telegramId }).exec();
            if (!user || user.elixirBalance < fromAmount) {
                return { error: "Insufficient ELIXIR balance for this swap" };
            }
            const coinGeckoMap = {
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
                        error: "Price Oracle is currently offline. Trading is paused to protect market integrity.",
                    };
                cryptoPrice = livePrice;
            }
            const usdValue = fromAmount / 10000;
            const grossCryptoAmount = usdValue / cryptoPrice;
            const netCryptoAmount = grossCryptoAmount * 0.92;
            if (!user.cryptoBalances)
                user.cryptoBalances = {};
            const currentTargetBalance = user.cryptoBalances[targetCoin] || 0;
            user.cryptoBalances[targetCoin] = currentTargetBalance + netCryptoAmount;
            user.elixirBalance -= fromAmount;
            user.markModified("cryptoBalances");
            await user.save();
            const spread = grossCryptoAmount * 0.08;
            await this.adminService.addProfit(targetCoin, spread, "SWAP_SPREAD", telegramId);
            return {
                success: true,
                user,
                received: netCryptoAmount,
                gross: grossCryptoAmount,
                spread: grossCryptoAmount * 0.08,
            };
        }
        finally {
            await this.unlockUserWithdrawal(telegramId);
        }
    }
    async convertDustToElixir(telegramId, coinsToConvert) {
        if (!coinsToConvert || coinsToConvert.length === 0)
            return { error: "No coins selected" };
        const locked = await this.lockUserForWithdrawal(telegramId);
        if (!locked)
            return { error: "A transaction is currently processing, please wait." };
        try {
            const user = await this.userModel.findOne({ telegramId }).exec();
            if (!user)
                return { error: "User not found" };
            if (!user.cryptoBalances)
                return { error: "No balances to convert" };
            const coinGeckoMap = {
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
                if (balance <= 0)
                    continue;
                let cryptoPrice = 1.0;
                const geckoId = coinGeckoMap[sym];
                if (geckoId) {
                    const livePrice = await this.getLivePrice(geckoId);
                    if (!livePrice)
                        return {
                            error: `Price Oracle is offline for ${sym}. Trading is paused.`,
                        };
                    cryptoPrice = livePrice;
                }
                const grossUsdValue = balance * cryptoPrice;
                const feeUsd = grossUsdValue * 0.003;
                const netUsdValue = grossUsdValue - feeUsd;
                totalUsdValue += netUsdValue;
                const feeInNativeToken = balance * 0.003;
                if (feeInNativeToken > 0) {
                    await this.adminService.addProfit(sym, feeInNativeToken, "DUST_CONVERT", telegramId);
                }
                user.cryptoBalances[sym] = 0;
            }
            if (totalUsdValue <= 0) {
                return { error: "Selected balances have zero value." };
            }
            const elixirGained = totalUsdValue * 10000;
            user.elixirBalance = (user.elixirBalance || 0) + elixirGained;
            user.lifetimeElixir = (user.lifetimeElixir || 0) + elixirGained;
            user.markModified("cryptoBalances");
            await user.save();
            return {
                success: true,
                elixirGained,
                newElixirBalance: user.elixirBalance,
                cryptoBalances: user.cryptoBalances,
            };
        }
        finally {
            await this.unlockUserWithdrawal(telegramId);
        }
    }
    async executeHiLoBet(telegramId, betAmount, multiplier, type) {
        if (betAmount < 10 || betAmount > 50000) {
            return { error: "Bet amount must be between 10 and 50,000 ELIXIR" };
        }
        if (multiplier < 1.01 || multiplier > 100) {
            return { error: "Invalid multiplier constraint" };
        }
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
                error: "⚠️ Daily win limit reached. Come back tomorrow for more action!",
            };
        }
        const dStats = await this.circularCasino.getDashboardStats();
        const treasuryPool = dStats?.treasury?.value || 100000;
        const maxPermittedProfit = Math.floor(treasuryPool * 0.05);
        if (betAmount * multiplier - betAmount > maxPermittedProfit) {
            return { error: "Bet error please try again later" };
        }
        const user = await this.userModel
            .findOneAndUpdate({ telegramId, elixirBalance: { $gte: betAmount } }, { $inc: { elixirBalance: -betAmount } }, { returnDocument: "after" })
            .exec();
        if (!user) {
            return { error: "Insufficient balance or invalid bet amount" };
        }
        const baseWinChance = (100 / multiplier) * 0.9;
        const thresholdHI = Math.floor(10000 - baseWinChance * 100);
        const thresholdLO = Math.ceil(baseWinChance * 100);
        const serverSeed = crypto.randomBytes(16).toString("hex");
        const clientSeed = `${telegramId}-${Date.now()}`;
        const hash = crypto
            .createHmac("sha256", serverSeed)
            .update(clientSeed)
            .digest("hex");
        const hexSub = hash.substring(0, 5);
        const parsedHex = parseInt(hexSub, 16);
        const rolledNumber = parsedHex % 10001;
        let isWin = false;
        if (type === "hi" && rolledNumber >= thresholdHI)
            isWin = true;
        if (type === "lo" && rolledNumber <= thresholdLO)
            isWin = true;
        let circularMeta = null;
        try {
            const outcome = await this.circularCasino.resolveHiLoBet(telegramId, user.firstName || null, user.username || null, betAmount, isWin, multiplier);
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
                    .findOneAndUpdate({ telegramId }, { $inc: { elixirBalance: userNet, lifetimeElixir: userNet } }, { returnDocument: "after" })
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
        }
        catch (err) {
            this.logger.error(`[CircularCasino] Fatal resolveHiLoBet failed, refunding bet: ${err}`);
            const refund = betAmount;
            await this.userModel
                .updateOne({ telegramId }, { $inc: { elixirBalance: refund } })
                .exec();
            const finalBalance = user.elixirBalance;
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
    async getHiLoHistory(telegramId) {
        const history = await this.hiloBetModel
            .find({ telegramId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
            .exec();
        return history;
    }
    async searchUserForAdmin(query) {
        return this.userModel
            .findOne({
            $or: [
                { telegramId: query },
                { username: { $regex: new RegExp(`^${query}$`, "i") } },
            ],
        })
            .exec();
    }
    async updateUserBalanceAdmin(telegramId, elixirBalance, cryptoBalances) {
        const update = {};
        if (elixirBalance !== undefined)
            update.elixirBalance = elixirBalance;
        if (cryptoBalances !== undefined)
            update.cryptoBalances = cryptoBalances;
        return this.userModel
            .findOneAndUpdate({ telegramId }, { $set: update }, { returnDocument: "after" })
            .exec();
    }
    async setUserBanStatus(telegramId, isBanned) {
        return this.userModel
            .findOneAndUpdate({ telegramId }, { $set: { isBanned } }, { returnDocument: "after" })
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
            .select("telegramId firstName lastName username isBanned createdAt elixirBalance cryptoBalances")
            .lean()
            .exec();
        return {
            totalUsers,
            totalElixir,
            totalAdRevenueUSD,
            recentUsers,
        };
    }
    async getTopUsersPaginated(page = 1, perPage = 10) {
        const safePage = Math.max(1, Math.floor(Number(page) || 1));
        const safePerPage = Math.max(1, Math.min(100, Math.floor(Number(perPage) || 10)));
        const skip = (safePage - 1) * safePerPage;
        const totalUsers = await this.userModel.countDocuments().exec();
        const users = await this.userModel
            .find()
            .sort({ elixirBalance: -1 })
            .skip(skip)
            .limit(safePerPage)
            .select("telegramId firstName lastName username isBanned createdAt elixirBalance cryptoBalances")
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
    async lockUserForWithdrawal(telegramId) {
        const locked = await this.userModel
            .findOneAndUpdate({ telegramId, isWithdrawing: { $ne: true } }, { $set: { isWithdrawing: true } })
            .exec();
        return !!locked;
    }
    async unlockUserWithdrawal(telegramId) {
        await this.userModel
            .updateOne({ telegramId }, { $set: { isWithdrawing: false } })
            .exec();
    }
    async addExp(telegramId, amount) {
        await this.userModel
            .updateOne({ telegramId }, { $inc: { exp: amount, gameExp: amount } })
            .exec();
    }
};
exports.UsersService = UsersService;
__decorate([
    (0, schedule_1.Cron)("0 1 * * *", { timeZone: "UTC" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersService.prototype, "cleanupOldCodeDrops", null);
__decorate([
    (0, schedule_1.Cron)("*/5 * * * *", { timeZone: "UTC" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersService.prototype, "notifyFullMining", null);
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(referral_log_schema_1.ReferralLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(hilo_bet_schema_1.HiLoBet.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => achievements_service_1.AchievementsService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => admin_service_1.AdminService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => circular_casino_service_1.CircularCasinoService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        achievements_service_1.AchievementsService,
        admin_service_1.AdminService,
        circular_casino_service_1.CircularCasinoService])
], UsersService);
//# sourceMappingURL=users.service.js.map