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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const users_service_1 = require("../users/users.service");
let AdminController = class AdminController {
    adminService;
    usersService;
    constructor(adminService, usersService) {
        this.adminService = adminService;
        this.usersService = usersService;
    }
    async login(body, req) {
        if (!body.username || !body.password) {
            return { error: 'Missing username or password' };
        }
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        return await this.adminService.authenticate(body.username, body.password, ip);
    }
    async getFeed() {
        const stats = await this.usersService.getDashboardStatsAdmin();
        return { success: true, ...stats };
    }
    async getProfitBalances() {
        const balances = await this.adminService.getProfitBalances();
        return { success: true, profitBalances: balances };
    }
    async getProfitLogs(coin) {
        const logs = await this.adminService.getProfitLogs(coin);
        return { success: true, logs };
    }
    async getWithdrawLimits() {
        const limits = await this.adminService.getWithdrawLimits();
        return { success: true, withdrawLimits: limits };
    }
    async updateWithdrawLimit(body) {
        if (!body.coin || body.limit === undefined)
            return { error: 'Missing parameters' };
        const limits = await this.adminService.updateWithdrawLimit(body.coin, body.limit);
        return { success: true, withdrawLimits: limits };
    }
    async searchUser(query) {
        if (!query)
            return { error: 'Missing search query' };
        const cleanQuery = query.startsWith('@') ? query.substring(1) : query;
        const user = await this.usersService.searchUserForAdmin(cleanQuery);
        if (!user)
            return { error: 'User not found' };
        return { success: true, user };
    }
    async updateUserBalance(body) {
        if (!body.telegramId)
            return { error: 'Missing telegramId' };
        const user = await this.usersService.updateUserBalanceAdmin(body.telegramId, body.elixirBalance, body.cryptoBalances);
        if (!user)
            return { error: 'User not found' };
        return { success: true, user };
    }
    async banUser(body) {
        if (!body.telegramId || typeof body.isBanned !== 'boolean')
            return { error: 'Missing parameters' };
        const user = await this.usersService.setUserBanStatus(body.telegramId, body.isBanned);
        if (!user)
            return { error: 'User not found' };
        return { success: true, user };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('feed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)('profit-balances'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfitBalances", null);
__decorate([
    (0, common_1.Get)('profit-logs'),
    __param(0, (0, common_1.Query)('coin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfitLogs", null);
__decorate([
    (0, common_1.Get)('withdraw-limits'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawLimits", null);
__decorate([
    (0, common_1.Post)('withdraw-limits'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateWithdrawLimit", null);
__decorate([
    (0, common_1.Post)('user/search'),
    __param(0, (0, common_1.Body)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "searchUser", null);
__decorate([
    (0, common_1.Post)('user/update-balance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserBalance", null);
__decorate([
    (0, common_1.Post)('user/ban'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        users_service_1.UsersService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map