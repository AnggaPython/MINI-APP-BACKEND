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
var UsersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const telegram_guard_1 = require("../auth/telegram.guard");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let UsersController = UsersController_1 = class UsersController {
    usersService;
    logger = new common_1.Logger(UsersController_1.name);
    constructor(usersService) {
        this.usersService = usersService;
    }
    async syncUser(userData, telegramId) {
        if (!userData || !userData.id) {
            return { success: false, error: "Invalid user payload" };
        }
        const referredBy = userData.start_param;
        const result = await this.usersService.syncTelegramUser(userData, referredBy);
        const notifications = await this.usersService.getPendingNotifications(telegramId);
        return { success: true, user: result, notifications };
    }
    async monetagPostback(s2sSecret, userid, eventLegacy, rewardLegacy, payoutLegacy, ymid, eventType, rewardEventType, estimatedPrice, telegramId) {
        const resolvedUserId = telegramId ?? userid ?? ymid;
        const requiredSecret = process.env.MONETAG_S2S_SECRET;
        if (requiredSecret && s2sSecret !== requiredSecret) {
            this.logger.warn(`[Monetag S2S] REJECTED: missing/invalid s2s_secret for user=${resolvedUserId ?? "?"}`);
            return { status: "rejected", reason: "invalid_secret" };
        }
        const resolvedReward = rewardEventType ?? rewardLegacy;
        const resolvedPayout = estimatedPrice ?? payoutLegacy;
        const resolvedEvent = eventType ?? eventLegacy;
        this.logger.log(`[Monetag S2S] === Incoming postback START ===`);
        this.logger.log(`[Monetag S2S] FULL RAW: telegram_id=${telegramId}, userid=${userid}, ymid=${ymid}, event_type=${eventType}, eventLegacy=${eventLegacy}, reward_event_type=${rewardEventType}, rewardLegacy=${rewardLegacy}, estimated_price=${estimatedPrice}, payoutLegacy=${payoutLegacy}`);
        this.logger.log(`[Monetag S2S] Resolved: userId=${resolvedUserId}, reward=${resolvedReward}, payout=$${resolvedPayout}, event=${resolvedEvent}`);
        if (!resolvedUserId) {
            this.logger.log(`[Monetag S2S] IGNORED: No user ID resolved from query params`);
            return { status: "ignored", reason: "missing_user_id" };
        }
        if (resolvedReward !== "valued") {
            this.logger.log(`[Monetag S2S] IGNORED: reward="${resolvedReward}" !== "valued" for user ${resolvedUserId}`);
            return { status: "ignored", reason: "reward_not_valued" };
        }
        const payoutUSD = parseFloat(resolvedPayout || "0") || 0;
        await this.usersService.registerMonetagTicket(resolvedUserId, payoutUSD);
        this.logger.log(`[Monetag S2S] SUCCESS: Ticket registered for user ${resolvedUserId}, payout=$${payoutUSD}`);
        return { status: "success", user: resolvedUserId, payout: payoutUSD };
    }
    async devPublicLogin(username, password) {
        return await this.usersService.devLoginUsernamePassword(username, password);
    }
    async startMining(telegramId) {
        const result = await this.usersService.startMining(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user };
    }
    async boostMining(telegramId) {
        const result = await this.usersService.boostMining(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user };
    }
    async claimMining(telegramId) {
        const result = await this.usersService.claimMining(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return {
            success: true,
            user: result.user,
            claimedAmount: result.claimedAmount,
        };
    }
    async getReferralStats(telegramId) {
        const stats = await this.usersService.getReferralStats(telegramId);
        return { success: true, stats };
    }
    async claimReferral(telegramId) {
        const result = await this.usersService.claimReferralVault(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return {
            success: true,
            user: result.user,
            claimedAmount: result.claimedAmount,
        };
    }
    async claimInvite(telegramId, code) {
        if (!code)
            return { success: false, error: "Missing invite code" };
        const result = await this.usersService.claimInvite(telegramId, code);
        if (result.error)
            return { success: false, error: result.error };
        const notifications = await this.usersService.getPendingNotifications(telegramId);
        return { success: true, user: result.user, notifications };
    }
    async ackNotifications(telegramId, ids, via) {
        const result = await this.usersService.ackNotifications(telegramId, ids, via);
        return { success: true, acked: result.acked };
    }
    async claimDaily(telegramId) {
        const result = await this.usersService.claimDailyLogin(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async claimFaucet(telegramId) {
        const result = await this.usersService.claimFaucet(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, finalNum: result.finalNum, reward: result.reward };
    }
    async claimCodeDrop(telegramId, code) {
        if (!code)
            return { success: false, error: "Missing code parameter" };
        const result = await this.usersService.claimCodeDrop(telegramId, code);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async claimVipRank(telegramId, rankName) {
        if (!rankName)
            return { success: false, error: "Missing rankName parameter" };
        const result = await this.usersService.claimVipRank(telegramId, rankName);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async verifyTelegram(telegramId) {
        const result = await this.usersService.verifyTelegramChannel(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async getBalance(telegramId) {
        const result = await this.usersService.getBalance(telegramId);
        return {
            success: true,
            balance: result.elixirBalance,
            cryptoBalances: result.cryptoBalances,
            materials: result.materials,
            ownedPickaxes: result.ownedPickaxes,
            cwalletUid: result.cwalletUid,
            solanaAddress: result.solanaAddress,
            withdrawLimits: result.withdrawLimits,
            lifetimeElixir: result.lifetimeElixir,
            totalReferrals: result.totalReferrals,
            lastFaucetRoll: result.lastFaucetRoll,
            exp: result.exp,
            isBanned: Boolean(result.isBanned),
        };
    }
    async bindWallet(telegramId, cwalletUid) {
        if (!cwalletUid)
            return { success: false, error: "Missing cwalletUid parameter" };
        return await this.usersService.bindCwalletUid(telegramId, cwalletUid);
    }
    async bindSolana(telegramId, solanaAddress) {
        if (!solanaAddress)
            return { success: false, error: "Missing solanaAddress parameter" };
        return await this.usersService.bindSolanaAddress(telegramId, solanaAddress);
    }
    async convertDust(telegramId, coins) {
        if (!coins || !coins.length)
            return { success: false, error: "Missing coins array" };
        return await this.usersService.convertDustToElixir(telegramId, coins);
    }
    async swapElixir(telegramId, amount, targetCoin) {
        if (!amount || !targetCoin)
            return { success: false, error: "Missing swap parameters" };
        return await this.usersService.swapTokens(telegramId, amount, targetCoin);
    }
    async executeHiLoBet(telegramId, betAmount, multiplier, type) {
        if (!betAmount || !multiplier || !type) {
            return { success: false, error: "Missing required betting parameters" };
        }
        const strictBet = Number(betAmount);
        const strictMultiplier = Number(multiplier);
        if (isNaN(strictBet) || isNaN(strictMultiplier) || strictBet <= 0) {
            return {
                success: false,
                error: "Malicious payload detected: Numeric type coercion failed",
            };
        }
        return await this.usersService.executeHiLoBet(telegramId, strictBet, strictMultiplier, type);
    }
    async getHiLoHistory(telegramId) {
        const history = await this.usersService.getHiLoHistory(telegramId);
        return { success: true, history };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)("sync"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "syncUser", null);
__decorate([
    (0, telegram_user_decorator_1.Public)(),
    (0, common_1.Get)("public/monetag-postback"),
    __param(0, (0, common_1.Query)("s2s_secret")),
    __param(1, (0, common_1.Query)("userid")),
    __param(2, (0, common_1.Query)("event")),
    __param(3, (0, common_1.Query)("reward")),
    __param(4, (0, common_1.Query)("payout")),
    __param(5, (0, common_1.Query)("ymid")),
    __param(6, (0, common_1.Query)("event_type")),
    __param(7, (0, common_1.Query)("reward_event_type")),
    __param(8, (0, common_1.Query)("estimated_price")),
    __param(9, (0, common_1.Query)("telegram_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "monetagPostback", null);
__decorate([
    (0, telegram_user_decorator_1.Public)(),
    (0, common_1.Post)("public/login"),
    __param(0, (0, common_1.Body)("username")),
    __param(1, (0, common_1.Body)("password")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "devPublicLogin", null);
__decorate([
    (0, common_1.Post)("start-mining"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "startMining", null);
__decorate([
    (0, common_1.Post)("boost-mining"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "boostMining", null);
__decorate([
    (0, common_1.Post)("claim-mining"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimMining", null);
__decorate([
    (0, common_1.Get)("referral-stats"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getReferralStats", null);
__decorate([
    (0, common_1.Post)("claim-referral"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimReferral", null);
__decorate([
    (0, common_1.Post)("claim-invite"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("code")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimInvite", null);
__decorate([
    (0, common_1.Post)("ack-notifications"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("ids")),
    __param(2, (0, common_1.Body)("via")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "ackNotifications", null);
__decorate([
    (0, common_1.Post)("claim-daily"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimDaily", null);
__decorate([
    (0, common_1.Post)("claim-faucet"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimFaucet", null);
__decorate([
    (0, common_1.Post)("claim-drop"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("code")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimCodeDrop", null);
__decorate([
    (0, common_1.Post)("claim-vip-rank"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("rankName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimVipRank", null);
__decorate([
    (0, common_1.Post)("verify-telegram"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyTelegram", null);
__decorate([
    (0, common_1.Get)("me/balance"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)("bind-wallet"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("cwalletUid")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "bindWallet", null);
__decorate([
    (0, common_1.Post)("bind-solana"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("solanaAddress")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "bindSolana", null);
__decorate([
    (0, common_1.Post)("convert-dust"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("coins")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "convertDust", null);
__decorate([
    (0, common_1.Post)("swap"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("amount")),
    __param(2, (0, common_1.Body)("targetCoin")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "swapElixir", null);
__decorate([
    (0, common_1.Post)("hilo-bet"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("betAmount")),
    __param(2, (0, common_1.Body)("multiplier")),
    __param(3, (0, common_1.Body)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "executeHiLoBet", null);
__decorate([
    (0, common_1.Get)("hilo-history"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getHiLoHistory", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, common_1.Controller)("users"),
    (0, common_1.UseGuards)(telegram_guard_1.TelegramAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map