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
const circular_casino_service_1 = require("./circular-casino.service");
const users_service_1 = require("../users/users.service");
const admin_guard_1 = require("../auth/admin.guard");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
const trade_spot_service_1 = require("../trade-spot/trade-spot.service");
const market_maker_service_1 = require("../trade-spot/market-maker.service");
let AdminController = class AdminController {
    adminService;
    usersService;
    circularCasino;
    tradeSpotService;
    marketMakerService;
    constructor(adminService, usersService, circularCasino, tradeSpotService, marketMakerService) {
        this.adminService = adminService;
        this.usersService = usersService;
        this.circularCasino = circularCasino;
        this.tradeSpotService = tradeSpotService;
        this.marketMakerService = marketMakerService;
    }
    async login(body, req) {
        if (!body.username || !body.password) {
            return { error: "Missing username or password" };
        }
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        return await this.adminService.authenticate(body.username, body.password, ip);
    }
    async getFeed() {
        const stats = await this.usersService.getDashboardStatsAdmin();
        return { success: true, ...stats };
    }
    async getTopUsers(page, limit) {
        const result = await this.usersService.getTopUsersPaginated(Number(page) || 1, Number(limit) || 10);
        return { success: true, ...result };
    }
    async getProfitBalances() {
        const result = await this.adminService.getProfitBalances();
        return {
            success: true,
            profitBalances: result.balances,
            monetagSummary: result.monetagSummary,
            totalProfitFeesAllCoinsUsd: result.totalProfitFeesAllCoinsUsd,
            profitFeeValueByCoin: result.profitFeeValueByCoin,
            livePriceUsdByCoin: result.livePriceUsdByCoin,
        };
    }
    async getMonetagTopUsers(page, limit) {
        const res = await this.adminService.getMonetagTopUsers(Number(page) || 1, Number(limit) || 10);
        return { success: true, ...res };
    }
    async getProfitLogs(coin, page, limit) {
        const result = await this.adminService.getProfitLogsPaginated(coin, Number(page) || 1, Number(limit) || 10);
        return {
            success: true,
            logs: result.logs,
            pagination: {
                page: result.page,
                perPage: result.perPage,
                totalLogs: result.totalLogs,
                hasMore: result.hasMore,
                hardLimit: result.hardLimit,
            },
        };
    }
    async getWithdrawLimits() {
        const limits = await this.adminService.getWithdrawLimits();
        return { success: true, withdrawLimits: limits };
    }
    async updateWithdrawLimit(body) {
        if (!body.coin || body.limit === undefined)
            return { error: "Missing parameters" };
        const limits = await this.adminService.updateWithdrawLimit(body.coin, body.limit);
        return { success: true, withdrawLimits: limits };
    }
    async searchUser(query) {
        if (!query)
            return { error: "Missing search query" };
        const cleanQuery = query.startsWith("@") ? query.substring(1) : query;
        const user = await this.usersService.searchUserForAdmin(cleanQuery);
        if (!user)
            return { error: "User not found" };
        return { success: true, user };
    }
    async updateUserBalance(body) {
        if (!body.telegramId)
            return { error: "Missing telegramId" };
        const user = await this.usersService.updateUserBalanceAdmin(body.telegramId, body.elixirBalance, body.cryptoBalances);
        if (!user)
            return { error: "User not found" };
        return { success: true, user };
    }
    async banUser(body) {
        if (!body.telegramId || typeof body.isBanned !== "boolean")
            return { error: "Missing parameters" };
        const user = await this.usersService.setUserBanStatus(body.telegramId, body.isBanned);
        if (!user)
            return { error: "User not found" };
        return { success: true, user };
    }
    async getBaseCasinoStats() {
        const stats = await this.circularCasino.getDashboardStats();
        const topWhales = await this.circularCasino.getTop5WhalesByNetEquity();
        return {
            success: true,
            treasury: stats.adminTreasury,
            circularPool: stats.circularPool,
            burned: stats.burned,
            taxThisCycle: stats.taxThisCycle,
            params: stats.params,
            liveImpactLog: stats.liveImpactLog,
            dailySnapshots30D: stats.dailySnapshots30D,
            monthlyBook: stats.monthlyBook,
            topWhales,
        };
    }
    async getTopWhales() {
        const data = await this.circularCasino.getTop5WhalesByNetEquity();
        return { success: true, whales: data };
    }
    async updateBaseCasinoParams(body) {
        if (!body || typeof body !== "object")
            return { error: "Invalid payload" };
        const safeNumbers = {};
        for (const [k, v] of Object.entries(body)) {
            if (typeof v === "number" && Number.isFinite(v))
                safeNumbers[k] = v;
        }
        await this.circularCasino.updateParams(safeNumbers);
        const stats = await this.circularCasino.getDashboardStats();
        return {
            success: true,
            params: stats.params,
            treasury: stats.adminTreasury,
            circularPool: stats.circularPool,
        };
    }
    async closeCurrentCycle() {
        await this.circularCasino.closeCurrentCycleAndStartNew();
        const stats = await this.circularCasino.getDashboardStats();
        return {
            success: true,
            monthlyBook: stats.monthlyBook,
            treasury: stats.adminTreasury,
        };
    }
    async getTradeSpotBot() {
        return this.tradeSpotService.getBotStatus();
    }
    async updateTradeSpotBot(body) {
        return this.tradeSpotService.updateBotConfig(body || {});
    }
    async runTradeSpotBotNow() {
        const res = await this.marketMakerService.runNow();
        const status = await this.tradeSpotService.getBotStatus();
        return {
            ...status,
            runNow: res,
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, telegram_user_decorator_1.Public)(),
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, common_1.Get)("feed"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)("top-users"),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopUsers", null);
__decorate([
    (0, common_1.Get)("profit-balances"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfitBalances", null);
__decorate([
    (0, common_1.Get)("profit-logs/monetag-top-users"),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMonetagTopUsers", null);
__decorate([
    (0, common_1.Get)("profit-logs"),
    __param(0, (0, common_1.Query)("coin")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfitLogs", null);
__decorate([
    (0, common_1.Get)("withdraw-limits"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawLimits", null);
__decorate([
    (0, common_1.Post)("withdraw-limits"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateWithdrawLimit", null);
__decorate([
    (0, common_1.Post)("user/search"),
    __param(0, (0, common_1.Body)("query")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "searchUser", null);
__decorate([
    (0, common_1.Post)("user/update-balance"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserBalance", null);
__decorate([
    (0, common_1.Post)("user/ban"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Get)("base-casino/stats"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBaseCasinoStats", null);
__decorate([
    (0, common_1.Get)("base-casino/top-whales"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopWhales", null);
__decorate([
    (0, common_1.Post)("base-casino/params"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateBaseCasinoParams", null);
__decorate([
    (0, common_1.Post)("base-casino/close-cycle"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "closeCurrentCycle", null);
__decorate([
    (0, common_1.Get)("trade-spot/bot"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTradeSpotBot", null);
__decorate([
    (0, common_1.Post)("trade-spot/bot"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTradeSpotBot", null);
__decorate([
    (0, common_1.Post)("trade-spot/bot/run-now"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "runTradeSpotBotNow", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)(admin_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        users_service_1.UsersService,
        circular_casino_service_1.CircularCasinoService,
        trade_spot_service_1.TradeSpotService,
        market_maker_service_1.MarketMakerService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map