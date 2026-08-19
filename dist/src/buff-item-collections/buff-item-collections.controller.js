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
exports.BuffItemCollectionsController = void 0;
const common_1 = require("@nestjs/common");
const buff_item_collections_service_1 = require("./buff-item-collections.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let BuffItemCollectionsController = class BuffItemCollectionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getAll() {
        return this.service.getAllBuffItems();
    }
    async getByType(type) {
        const buffType = type.toUpperCase();
        if (!["ATK", "ECONOMY", "DURABILITY", "DROPRATE"].includes(buffType)) {
            return { success: false, error: "Invalid buff type" };
        }
        return this.service.getBuffItemsByType(buffType);
    }
    async getMyCollection(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.service.getUserCollection(telegramId);
    }
    async getMyTotals(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.service.getUserBuffTotals(telegramId);
    }
    async activate(telegramId, buffId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!buffId)
            return { success: false, error: "Missing buffId" };
        return this.service.activateBuff(telegramId, buffId);
    }
    async deactivate(telegramId, buffId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!buffId)
            return { success: false, error: "Missing buffId" };
        return this.service.deactivateBuff(telegramId, buffId);
    }
    async activateAllByType(telegramId, type) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        const buffType = type.toUpperCase();
        if (!["ATK", "ECONOMY", "DURABILITY", "DROPRATE"].includes(buffType)) {
            return { success: false, error: "Invalid buff type" };
        }
        return this.service.activateAllByType(telegramId, buffType);
    }
    async grant(telegramId, buffId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!buffId)
            return { success: false, error: "Missing buffId" };
        return this.service.grantBuffItem(telegramId, buffId);
    }
    async grantRandom(telegramId, preferredRarity) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.service.grantRandomBuff(telegramId, preferredRarity);
    }
};
exports.BuffItemCollectionsController = BuffItemCollectionsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(":type"),
    __param(0, (0, common_1.Param)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "getByType", null);
__decorate([
    (0, common_1.Get)("user/me"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "getMyCollection", null);
__decorate([
    (0, common_1.Get)("user/totals"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "getMyTotals", null);
__decorate([
    (0, common_1.Post)("activate"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("buffId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)("deactivate"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("buffId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)("activate-all/:type"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Param)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "activateAllByType", null);
__decorate([
    (0, common_1.Post)("grant"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("buffId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "grant", null);
__decorate([
    (0, common_1.Post)("grant-random"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("preferredRarity")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuffItemCollectionsController.prototype, "grantRandom", null);
exports.BuffItemCollectionsController = BuffItemCollectionsController = __decorate([
    (0, common_1.Controller)("buff-collections"),
    __metadata("design:paramtypes", [buff_item_collections_service_1.BuffItemCollectionsService])
], BuffItemCollectionsController);
//# sourceMappingURL=buff-item-collections.controller.js.map