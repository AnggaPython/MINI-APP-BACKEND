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
exports.BankController = void 0;
const common_1 = require("@nestjs/common");
const bank_service_1 = require("./bank.service");
let BankController = class BankController {
    bankService;
    constructor(bankService) {
        this.bankService = bankService;
    }
    async getStats(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        const stats = await this.bankService.getStats(telegramId);
        return { success: true, stats };
    }
    async stake(body) {
        if (!body.telegramId || !body.amount || !body.durationDays || !body.rate) {
            return { error: 'Incomplete parameters' };
        }
        return await this.bankService.createStake(body.telegramId, Number(body.amount), Number(body.durationDays), Number(body.rate), body.autoClaim || false);
    }
    async claimYield(telegramId) {
        if (!telegramId)
            return { error: 'Missing telegramId' };
        return await this.bankService.claimEarnings(telegramId);
    }
    async unstake(body) {
        if (!body.telegramId || !body.stakeId)
            return { error: 'Incomplete parameters' };
        return await this.bankService.unstake(body.telegramId, body.stakeId);
    }
    async toggleStakeConfig(body) {
        if (!body.telegramId || !body.stakeId)
            return { error: 'Incomplete parameters' };
        return await this.bankService.toggleStakeConfig(body.telegramId, body.stakeId, body.autoClaim, body.autoReinvest);
    }
};
exports.BankController = BankController;
__decorate([
    (0, common_1.Post)('stats'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('stake'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "stake", null);
__decorate([
    (0, common_1.Post)('claim-yield'),
    __param(0, (0, common_1.Body)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "claimYield", null);
__decorate([
    (0, common_1.Post)('unstake'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "unstake", null);
__decorate([
    (0, common_1.Post)('stake/toggle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "toggleStakeConfig", null);
exports.BankController = BankController = __decorate([
    (0, common_1.Controller)('bank'),
    __metadata("design:paramtypes", [bank_service_1.BankService])
], BankController);
//# sourceMappingURL=bank.controller.js.map