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
exports.CaseBoxController = void 0;
const common_1 = require("@nestjs/common");
const case_box_service_1 = require("./case-box.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let CaseBoxController = class CaseBoxController {
    caseBoxService;
    constructor(caseBoxService) {
        this.caseBoxService = caseBoxService;
    }
    async spawn(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.caseBoxService.spawn(telegramId);
    }
    async destroyCase(telegramId, caseId) {
        if (!caseId)
            return { success: false, error: "Missing caseId" };
        return await this.caseBoxService.destroy(telegramId, caseId);
    }
    async claimCase(telegramId, caseId) {
        if (!caseId)
            return { success: false, error: "Missing caseId parameter" };
        return await this.caseBoxService.claimCase(caseId, telegramId);
    }
    async history(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return await this.caseBoxService.history(telegramId);
    }
};
exports.CaseBoxController = CaseBoxController;
__decorate([
    (0, common_1.Get)("spawn"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaseBoxController.prototype, "spawn", null);
__decorate([
    (0, common_1.Post)("destroy"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("caseId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CaseBoxController.prototype, "destroyCase", null);
__decorate([
    (0, common_1.Post)("claim"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)("caseId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CaseBoxController.prototype, "claimCase", null);
__decorate([
    (0, common_1.Get)("history"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaseBoxController.prototype, "history", null);
exports.CaseBoxController = CaseBoxController = __decorate([
    (0, common_1.Controller)("case-box"),
    __metadata("design:paramtypes", [case_box_service_1.CaseBoxService])
], CaseBoxController);
//# sourceMappingURL=case-box.controller.js.map