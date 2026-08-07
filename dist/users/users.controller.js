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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async syncUser(userData) {
        if (!userData || !userData.id) {
            return { error: 'Invalid user payload' };
        }
        const referredBy = userData.start_param;
        const result = await this.usersService.syncTelegramUser(userData, referredBy);
        return { success: true, user: result };
    }
    async monetagPostback(userid, eventType, reward, ymid, payout) {
        if (reward !== 'valued')
            return { status: 'ignored' };
        const payoutUSD = parseFloat(payout || "0") || 0;
        await this.usersService.registerMonetagTicket(userid, payoutUSD);
        return { status: 'success' };
    }
    async startMining(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.startMining(telegramId);
        if (result.user)
            return { success: true, user: result.user };
        else
            return { error: result.error || 'Verification Failed' };
    }
    async boostMining(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.boostMining(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user };
    }
    async claimMining(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.claimMining(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, claimedAmount: result.claimedAmount };
    }
    async getReferralStats(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const stats = await this.usersService.getReferralStats(telegramId);
        return { success: true, stats };
    }
    async claimReferral(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.claimReferralVault(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, claimedAmount: result.claimedAmount };
    }
    async claimDaily(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.claimDailyLogin(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async claimFaucet(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.claimFaucet(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, finalNum: result.finalNum, reward: result.reward };
    }
    async claimCodeDrop(body) {
        if (!body.telegramId || !body.code)
            return { error: 'Missing parameters' };
        const result = await this.usersService.claimCodeDrop(body.telegramId, body.code);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async claimVipRank(body) {
        if (!body.telegramId || !body.rankName)
            return { error: 'Missing parameters' };
        const result = await this.usersService.claimVipRank(body.telegramId, body.rankName);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async verifyTelegram(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.verifyTelegramChannel(telegramId);
        if (result.error)
            return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }
    async getBalance(id) {
        if (!id)
            return { error: 'Missing id' };
        const result = await this.usersService.getBalance(id);
        return { success: true, balance: result.elixirBalance, cryptoBalances: result.cryptoBalances, cwalletUid: result.cwalletUid, solanaAddress: result.solanaAddress, withdrawLimits: result.withdrawLimits, lifetimeElixir: result.lifetimeElixir, totalReferrals: result.totalReferrals, lastFaucetRoll: result.lastFaucetRoll };
    }
    async bindWallet(body) {
        if (!body.telegramId || !body.cwalletUid)
            return { error: 'Missing parameters' };
        return await this.usersService.bindCwalletUid(body.telegramId, body.cwalletUid);
    }
    async bindSolana(body) {
        if (!body.telegramId || !body.solanaAddress)
            return { error: 'Missing parameters' };
        return await this.usersService.bindSolanaAddress(body.telegramId, body.solanaAddress);
    }
    async convertDust(body) {
        if (!body.telegramId || !body.coins || !body.coins.length) {
            return { error: 'Missing parameters: telegramId or coins array' };
        }
        return await this.usersService.convertDustToElixir(body.telegramId, body.coins);
    }
    async swapElixir(body) {
        if (!body.telegramId || !body.amount || !body.targetCoin) {
            return { error: 'Missing swap parameters' };
        }
        return await this.usersService.swapTokens(body.telegramId, body.amount, body.targetCoin);
    }
    async executeHiLoBet(body) {
        if (!body.telegramId || !body.betAmount || !body.multiplier || !body.type) {
            return { error: 'Missing required betting parameters' };
        }
        const strictBet = Number(body.betAmount);
        const strictMultiplier = Number(body.multiplier);
        if (isNaN(strictBet) || isNaN(strictMultiplier) || strictBet <= 0) {
            return { error: 'Malicious payload detected: Numeric type coercion failed' };
        }
        return await this.usersService.executeHiLoBet(body.telegramId, strictBet, strictMultiplier, body.type);
    }
    async getHiLoHistory(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const history = await this.usersService.getHiLoHistory(telegramId);
        return { success: true, history };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "syncUser", null);
__decorate([
    (0, common_1.Get)('public/monetag-postback'),
    __param(0, (0, common_1.Query)('userid')),
    __param(1, (0, common_1.Query)('event')),
    __param(2, (0, common_1.Query)('reward')),
    __param(3, (0, common_1.Query)('ymid')),
    __param(4, (0, common_1.Query)('payout')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "monetagPostback", null);
__decorate([
    (0, common_1.Post)('start-mining'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "startMining", null);
__decorate([
    (0, common_1.Post)('boost-mining'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "boostMining", null);
__decorate([
    (0, common_1.Post)('claim-mining'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimMining", null);
__decorate([
    (0, common_1.Post)('referral-stats'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getReferralStats", null);
__decorate([
    (0, common_1.Post)('claim-referral'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimReferral", null);
__decorate([
    (0, common_1.Post)('claim-daily'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimDaily", null);
__decorate([
    (0, common_1.Post)('claim-faucet'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimFaucet", null);
__decorate([
    (0, common_1.Post)('claim-drop'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimCodeDrop", null);
__decorate([
    (0, common_1.Post)('claim-vip-rank'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "claimVipRank", null);
__decorate([
    (0, common_1.Post)('verify-telegram'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyTelegram", null);
__decorate([
    (0, common_1.Get)('balance/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('bind-wallet'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "bindWallet", null);
__decorate([
    (0, common_1.Post)('bind-solana'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "bindSolana", null);
__decorate([
    (0, common_1.Post)('convert-dust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "convertDust", null);
__decorate([
    (0, common_1.Post)('swap'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "swapElixir", null);
__decorate([
    (0, common_1.Post)('hilo-bet'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "executeHiLoBet", null);
__decorate([
    (0, common_1.Post)('hilo-history'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getHiLoHistory", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map