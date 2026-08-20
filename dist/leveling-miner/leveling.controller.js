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
exports.LevelingController = void 0;
const common_1 = require("@nestjs/common");
const leveling_service_1 = require("./leveling.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let LevelingController = class LevelingController {
    levelingService;
    constructor(levelingService) {
        this.levelingService = levelingService;
    }
    async getMyLevel(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.levelingService.getUserLevel(telegramId);
    }
    async getBenefits() {
        return await this.levelingService.getLevelBenefits();
    }
    async craftLevel(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.levelingService.craftLevel(telegramId);
    }
};
exports.LevelingController = LevelingController;
__decorate([
    (0, common_1.Get)("me"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LevelingController.prototype, "getMyLevel", null);
__decorate([
    (0, common_1.Get)("benefits"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LevelingController.prototype, "getBenefits", null);
__decorate([
    (0, common_1.Post)("craft"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LevelingController.prototype, "craftLevel", null);
exports.LevelingController = LevelingController = __decorate([
    (0, common_1.Controller)("leveling"),
    __metadata("design:paramtypes", [leveling_service_1.LevelingService])
], LevelingController);
//# sourceMappingURL=leveling.controller.js.map