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
exports.AuctionSchema = exports.Auction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Auction = class Auction {
    sellerId;
    sellerName;
    itemCategory;
    instanceId;
    baseItemId;
    amount;
    buffType;
    rarity;
    price;
    tax;
    netAmount;
    status;
    listedAt;
    expiresAt;
    collateralDeposit;
    collateralReturned;
    resolvedAt;
    buyerId;
};
exports.Auction = Auction;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Auction.prototype, "sellerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Auction.prototype, "sellerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["buff", "material"], default: "buff" }),
    __metadata("design:type", String)
], Auction.prototype, "itemCategory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Auction.prototype, "instanceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Auction.prototype, "baseItemId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 1 }),
    __metadata("design:type", Number)
], Auction.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE", "MATERIAL"] }),
    __metadata("design:type", String)
], Auction.prototype, "buffType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] }),
    __metadata("design:type", String)
], Auction.prototype, "rarity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Auction.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Auction.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Auction.prototype, "netAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["active", "sold", "cancelled"], default: "active" }),
    __metadata("design:type", String)
], Auction.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Auction.prototype, "listedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Auction.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 10000 }),
    __metadata("design:type", Number)
], Auction.prototype, "collateralDeposit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Auction.prototype, "collateralReturned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Auction.prototype, "resolvedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Auction.prototype, "buyerId", void 0);
exports.Auction = Auction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: "auctions" })
], Auction);
exports.AuctionSchema = mongoose_1.SchemaFactory.createForClass(Auction);
exports.AuctionSchema.index({ status: 1, buffType: 1, rarity: 1 });
exports.AuctionSchema.index({ status: 1, price: 1 });
exports.AuctionSchema.index({ sellerId: 1, status: 1 });
exports.AuctionSchema.index({ listedAt: -1 });
//# sourceMappingURL=auction.schema.js.map