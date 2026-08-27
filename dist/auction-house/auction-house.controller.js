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
exports.AuctionHouseController = void 0;
const common_1 = require("@nestjs/common");
const auction_house_service_1 = require("./auction-house.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
let AuctionHouseController = class AuctionHouseController {
    auctionService;
    constructor(auctionService) {
        this.auctionService = auctionService;
    }
    async createListing(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.auctionService.createListing(telegramId, body.price, body.itemCategory, body.instanceId, body.baseItemId, body.amount);
    }
    async buyListing(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.auctionService.buyListing(telegramId, body.auctionId);
    }
    async cancelListing(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.auctionService.cancelListing(telegramId, body.auctionId);
    }
    async browse(telegramId, query) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.auctionService.browse({
            search: query.search,
            buffType: query.buffType,
            rarity: query.rarity,
            sort: query.sort,
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 50,
        });
    }
    async browseItem(telegramId, baseItemId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        if (!baseItemId)
            return { success: false, error: "Missing baseItemId" };
        return this.auctionService.browseItemListings(baseItemId);
    }
    async myListings(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.auctionService.myListings(telegramId);
    }
    async getStats(telegramId) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.auctionService.getStats();
    }
};
exports.AuctionHouseController = AuctionHouseController;
__decorate([
    (0, common_1.Post)("list"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionHouseController.prototype, "createListing", null);
__decorate([
    (0, common_1.Post)("buy"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionHouseController.prototype, "buyListing", null);
__decorate([
    (0, common_1.Post)("cancel"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionHouseController.prototype, "cancelListing", null);
__decorate([
    (0, common_1.Get)("browse"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionHouseController.prototype, "browse", null);
__decorate([
    (0, common_1.Get)("browse-item"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)("baseItemId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuctionHouseController.prototype, "browseItem", null);
__decorate([
    (0, common_1.Get)("my-listings"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuctionHouseController.prototype, "myListings", null);
__decorate([
    (0, common_1.Get)("stats"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuctionHouseController.prototype, "getStats", null);
exports.AuctionHouseController = AuctionHouseController = __decorate([
    (0, common_1.Controller)("auction-house"),
    __metadata("design:paramtypes", [auction_house_service_1.AuctionHouseService])
], AuctionHouseController);
//# sourceMappingURL=auction-house.controller.js.map