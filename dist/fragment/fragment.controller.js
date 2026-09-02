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
exports.FragmentController = void 0;
const common_1 = require("@nestjs/common");
const fragment_service_1 = require("./fragment.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let FragmentController = class FragmentController {
    fragmentService;
    constructor(fragmentService) {
        this.fragmentService = fragmentService;
    }
    async getBalance(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.fragmentService.getBalance(telegramId);
    }
    async spinWheel(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.fragmentService.spinWheel(telegramId);
    }
    async claimSpinWheel(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.fragmentService.claimSpinWheelBalance(telegramId);
    }
    async claimMineSwipe(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.fragmentService.claimMineSwipeBalance(telegramId);
    }
    async mineSwipeStart(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.fragmentService.mineSwipeStart(telegramId);
    }
    async mineSwipeReveal(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!body?.sessionId || body?.row === undefined || body?.col === undefined) {
            return { success: false, error: "Missing sessionId, row, or col" };
        }
        return await this.fragmentService.mineSwipeReveal(telegramId, String(body.sessionId), Number(body.row), Number(body.col));
    }
    async mineSwipeClaim(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!body?.sessionId)
            return { success: false, error: "Missing sessionId" };
        return await this.fragmentService.mineSwipeClaim(telegramId, String(body.sessionId));
    }
    async mineSwipeStatus(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.fragmentService.mineSwipeStatus(telegramId);
    }
};
exports.FragmentController = FragmentController;
__decorate([
    (0, common_1.Get)("balance"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)("spin-wheel/spin"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "spinWheel", null);
__decorate([
    (0, common_1.Post)("spin-wheel/claim"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "claimSpinWheel", null);
__decorate([
    (0, common_1.Post)("mine-swipe/claim-balance"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "claimMineSwipe", null);
__decorate([
    (0, common_1.Post)("mine-swipe/start"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "mineSwipeStart", null);
__decorate([
    (0, common_1.Post)("mine-swipe/reveal"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "mineSwipeReveal", null);
__decorate([
    (0, common_1.Post)("mine-swipe/claim"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "mineSwipeClaim", null);
__decorate([
    (0, common_1.Get)("mine-swipe/status"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FragmentController.prototype, "mineSwipeStatus", null);
exports.FragmentController = FragmentController = __decorate([
    (0, common_1.Controller)("fragment"),
    __metadata("design:paramtypes", [fragment_service_1.FragmentService])
], FragmentController);
//# sourceMappingURL=fragment.controller.js.map