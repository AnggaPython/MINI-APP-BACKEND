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
exports.CampaignsController = void 0;
const common_1 = require("@nestjs/common");
const campaigns_service_1 = require("./campaigns.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let CampaignsController = class CampaignsController {
    campaignsService;
    constructor(campaignsService) {
        this.campaignsService = campaignsService;
    }
    async createCampaign(data, telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.campaignsService.createCampaign({
            ...data,
            creatorTelegramId: telegramId,
        });
    }
    async getActiveCampaigns(telegramId) {
        if (!telegramId)
            return { error: "Missing telegramId query param" };
        return this.campaignsService.getActiveCampaigns(telegramId);
    }
    async getMyCampaigns(telegramId) {
        return this.campaignsService.getMyCampaigns(telegramId);
    }
    async startTask(campaignId, telegramId) {
        if (!telegramId || !campaignId)
            return { success: false, error: "Missing params" };
        return this.campaignsService.startTask(telegramId, campaignId);
    }
    async completeTask(campaignId, telegramId) {
        if (!telegramId || !campaignId)
            return { success: false, error: "Missing params" };
        return this.campaignsService.completeTask(telegramId, campaignId);
    }
    async updateCampaign(id, data, telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.campaignsService.updateCampaign(id, telegramId, data);
    }
    async addBudget(id, amount, telegramId) {
        if (!telegramId || !amount)
            return { success: false, error: "Missing parameters" };
        return this.campaignsService.addBudget(id, Number(amount), telegramId);
    }
};
exports.CampaignsController = CampaignsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Get)("active"),
    __param(0, (0, common_1.Query)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getActiveCampaigns", null);
__decorate([
    (0, common_1.Get)("user/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getMyCampaigns", null);
__decorate([
    (0, common_1.Post)("start-task"),
    __param(0, (0, common_1.Body)("campaignId")),
    __param(1, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "startTask", null);
__decorate([
    (0, common_1.Post)("complete-task"),
    __param(0, (0, common_1.Body)("campaignId")),
    __param(1, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "completeTask", null);
__decorate([
    (0, common_1.Post)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "updateCampaign", null);
__decorate([
    (0, common_1.Post)("add-budget/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("amount")),
    __param(2, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "addBudget", null);
exports.CampaignsController = CampaignsController = __decorate([
    (0, common_1.Controller)("campaigns"),
    __metadata("design:paramtypes", [campaigns_service_1.CampaignsService])
], CampaignsController);
//# sourceMappingURL=campaigns.controller.js.map