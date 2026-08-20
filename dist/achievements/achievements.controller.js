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
exports.AchievementsController = void 0;
const common_1 = require("@nestjs/common");
const achievements_service_1 = require("./achievements.service");
let AchievementsController = class AchievementsController {
    achievementsService;
    constructor(achievementsService) {
        this.achievementsService = achievementsService;
    }
    async getStats(telegramId) {
        if (!telegramId)
            return { error: "Missing telegramId" };
        const stats = await this.achievementsService.getStats(telegramId);
        return { success: true, stats };
    }
    async claimReward(body) {
        if (!body.telegramId || !body.achievementId) {
            return { error: "Incomplete parameters" };
        }
        return await this.achievementsService.claimReward(body.telegramId, body.achievementId);
    }
};
exports.AchievementsController = AchievementsController;
__decorate([
    (0, common_1.Get)("stats/:telegramId"),
    __param(0, (0, common_1.Param)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)("claim"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "claimReward", null);
exports.AchievementsController = AchievementsController = __decorate([
    (0, common_1.Controller)("achievements"),
    __metadata("design:paramtypes", [achievements_service_1.AchievementsService])
], AchievementsController);
//# sourceMappingURL=achievements.controller.js.map