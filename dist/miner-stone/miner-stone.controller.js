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
exports.MinerStoneController = void 0;
const common_1 = require("@nestjs/common");
const miner_stone_service_1 = require("./miner-stone.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let MinerStoneController = class MinerStoneController {
    minerStoneService;
    constructor(minerStoneService) {
        this.minerStoneService = minerStoneService;
    }
    async spawn(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.minerStoneService.spawn(telegramId);
    }
    async history(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.minerStoneService.history(telegramId);
    }
    async repairPickaxe(telegramId, body) {
        if (!telegramId || !body?.tier) {
            return { success: false, error: "Missing tier" };
        }
        return await this.minerStoneService.repairPickaxe(telegramId, String(body.tier));
    }
    async destroy(telegramId, body) {
        if (!telegramId || !body?.stoneId) {
            return { success: false, error: "Missing stoneId" };
        }
        return await this.minerStoneService.destroy(telegramId, String(body.stoneId));
    }
    async claim(telegramId, body) {
        if (!telegramId || !body?.stoneId || !body?.action) {
            return { success: false, error: "Missing stoneId or action" };
        }
        return await this.minerStoneService.claimRewards(telegramId, String(body.stoneId), String(body.action));
    }
};
exports.MinerStoneController = MinerStoneController;
__decorate([
    (0, common_1.Get)("spawn"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MinerStoneController.prototype, "spawn", null);
__decorate([
    (0, common_1.Get)("history"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MinerStoneController.prototype, "history", null);
__decorate([
    (0, common_1.Post)("repair-pickaxe"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MinerStoneController.prototype, "repairPickaxe", null);
__decorate([
    (0, common_1.Post)("destroy"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MinerStoneController.prototype, "destroy", null);
__decorate([
    (0, common_1.Post)("claim"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MinerStoneController.prototype, "claim", null);
exports.MinerStoneController = MinerStoneController = __decorate([
    (0, common_1.Controller)("miner-stone"),
    __metadata("design:paramtypes", [miner_stone_service_1.MinerStoneService])
], MinerStoneController);
//# sourceMappingURL=miner-stone.controller.js.map