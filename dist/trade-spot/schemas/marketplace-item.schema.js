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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceItemSchema = exports.MarketplaceItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let MarketplaceItem = class MarketplaceItem {
    itemId;
    itemType;
    name;
    rarity;
    buffType;
    buffValue;
    buyPrice;
    sellPrice;
    liquidity;
    maxLiquidity;
    icon;
    active;
};
exports.MarketplaceItem = MarketplaceItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], MarketplaceItem.prototype, "itemId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["buff", "material"] }),
    __metadata("design:type", String)
], MarketplaceItem.prototype, "itemType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MarketplaceItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] }),
    __metadata("design:type", String)
], MarketplaceItem.prototype, "rarity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], MarketplaceItem.prototype, "buffType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], MarketplaceItem.prototype, "buffValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], MarketplaceItem.prototype, "buyPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], MarketplaceItem.prototype, "sellPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1000 }),
    __metadata("design:type", Number)
], MarketplaceItem.prototype, "liquidity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 10000 }),
    __metadata("design:type", Number)
], MarketplaceItem.prototype, "maxLiquidity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "📦" }),
    __metadata("design:type", String)
], MarketplaceItem.prototype, "icon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], MarketplaceItem.prototype, "active", void 0);
exports.MarketplaceItem = MarketplaceItem = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: "marketplace_items" })
], MarketplaceItem);
exports.MarketplaceItemSchema = mongoose_1.SchemaFactory.createForClass(MarketplaceItem);
exports.MarketplaceItemSchema.index({ rarity: 1 });
exports.MarketplaceItemSchema.index({ itemType: 1 });
exports.MarketplaceItemSchema.index({ active: 1 });
//# sourceMappingURL=marketplace-item.schema.js.map