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
exports.PickaxeUpgradeController = void 0;
const common_1 = require("@nestjs/common");
const pickaxe_upgrade_service_1 = require("./pickaxe-upgrade.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let PickaxeUpgradeController = class PickaxeUpgradeController {
    upgradeService;
    constructor(upgradeService) {
        this.upgradeService = upgradeService;
    }
    async getUpgradeStatus(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.upgradeService.getUpgradeStatus(telegramId);
    }
    async upgradePickaxe(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!body?.tier)
            return { success: false, error: "Missing tier" };
        return await this.upgradeService.upgradePickaxe(telegramId, String(body.tier));
    }
    async setSkin(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!body?.tier || !body?.skin)
            return { success: false, error: "Missing tier or skin" };
        return await this.upgradeService.setActiveSkin(telegramId, String(body.tier), String(body.skin));
    }
};
exports.PickaxeUpgradeController = PickaxeUpgradeController;
__decorate([
    (0, common_1.Get)("status"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PickaxeUpgradeController.prototype, "getUpgradeStatus", null);
__decorate([
    (0, common_1.Post)("upgrade"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PickaxeUpgradeController.prototype, "upgradePickaxe", null);
__decorate([
    (0, common_1.Post)("skin"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PickaxeUpgradeController.prototype, "setSkin", null);
exports.PickaxeUpgradeController = PickaxeUpgradeController = __decorate([
    (0, common_1.Controller)("pickaxe-upgrade"),
    __metadata("design:paramtypes", [pickaxe_upgrade_service_1.PickaxeUpgradeService])
], PickaxeUpgradeController);
//# sourceMappingURL=pickaxe-upgrade.controller.js.map