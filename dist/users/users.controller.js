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
    async startMining(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const result = await this.usersService.startMining(telegramId);
        return { success: true, user: result };
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
        return { success: true, balance: result.elixirBalance };
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
    (0, common_1.Post)('start-mining'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "startMining", null);
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
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map