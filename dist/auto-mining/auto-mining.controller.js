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
exports.AutoMiningController = void 0;
const common_1 = require("@nestjs/common");
const auto_mining_service_1 = require("./auto-mining.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let AutoMiningController = class AutoMiningController {
    autoMiningService;
    constructor(autoMiningService) {
        this.autoMiningService = autoMiningService;
    }
    async status(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.autoMiningService.status(telegramId);
    }
    async stats(telegramId, days) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.autoMiningService.stats(telegramId, Number(days) || 7);
    }
    async subscribe(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.autoMiningService.subscribe(telegramId, body || {});
    }
    async toggle(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.autoMiningService.toggle(telegramId, body?.on !== false);
    }
    async cancel(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.autoMiningService.cancel(telegramId);
    }
};
exports.AutoMiningController = AutoMiningController;
__decorate([
    (0, common_1.Get)("status"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AutoMiningController.prototype, "status", null);
__decorate([
    (0, common_1.Get)("stats"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)("days")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AutoMiningController.prototype, "stats", null);
__decorate([
    (0, common_1.Post)("subscribe"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AutoMiningController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)("toggle"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AutoMiningController.prototype, "toggle", null);
__decorate([
    (0, common_1.Post)("cancel"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AutoMiningController.prototype, "cancel", null);
exports.AutoMiningController = AutoMiningController = __decorate([
    (0, common_1.Controller)("auto-mining"),
    __metadata("design:paramtypes", [auto_mining_service_1.AutoMiningService])
], AutoMiningController);
//# sourceMappingURL=auto-mining.controller.js.map