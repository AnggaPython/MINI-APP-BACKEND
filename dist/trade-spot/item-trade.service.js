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
var ItemTradeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemTradeService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const item_sync_1 = require("./item-sync");
const buff_item_collections_service_1 = require("../buff-item-collections/buff-item-collections.service");
let ItemTradeService = ItemTradeService_1 = class ItemTradeService {
    userModel;
    buffCollectionsService;
    logger = new common_1.Logger(ItemTradeService_1.name);
    constructor(userModel, buffCollectionsService) {
        this.userModel = userModel;
        this.buffCollectionsService = buffCollectionsService;
    }
    async getItemBalance(telegramId, base) {
        if ((0, item_sync_1.isMaterialBase)(base)) {
            const displayName = (0, item_sync_1.slugToMaterialName)(base);
            const user = await this.userModel.findOne({ telegramId }).lean().exec();
            const materials = user?.materials;
            return materials?.[displayName] ?? 0;
        }
        return this.buffCollectionsService.countBuffInstances(telegramId, base.toLowerCase());
    }
    isItem(base) {
        return (0, item_sync_1.isItemBase)(base);
    }
    isMaterial(base) {
        return (0, item_sync_1.isMaterialBase)(base);
    }
    async grantItem(telegramId, base, qty) {
        if (qty <= 0)
            return true;
        try {
            if ((0, item_sync_1.isMaterialBase)(base)) {
                const displayName = (0, item_sync_1.slugToMaterialName)(base);
                await this.buffCollectionsService.grantMaterial(telegramId, displayName, qty);
            }
            else {
                const itemId = base.toLowerCase();
                for (let i = 0; i < qty; i++) {
                    await this.buffCollectionsService.grantBuffItem(telegramId, itemId);
                }
            }
            return true;
        }
        catch (err) {
            this.logger.warn(`[ItemTrade] grantItem ${base}: ${err?.message}`);
            return false;
        }
    }
    async deductItem(telegramId, base, qty) {
        if (qty <= 0)
            return true;
        try {
            if ((0, item_sync_1.isMaterialBase)(base)) {
                const displayName = (0, item_sync_1.slugToMaterialName)(base);
                await this.buffCollectionsService.removeMaterial(telegramId, displayName, qty);
            }
            else {
                await this.buffCollectionsService.removeBuffItem(telegramId, base.toLowerCase(), qty);
            }
            return true;
        }
        catch (err) {
            this.logger.warn(`[ItemTrade] deductItem ${base}: ${err?.message}`);
            return false;
        }
    }
};
exports.ItemTradeService = ItemTradeService;
exports.ItemTradeService = ItemTradeService = ItemTradeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        buff_item_collections_service_1.BuffItemCollectionsService])
], ItemTradeService);
//# sourceMappingURL=item-trade.service.js.map