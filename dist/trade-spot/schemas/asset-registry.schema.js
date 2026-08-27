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
exports.AssetRegistrySchema = exports.AssetRegistry = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AssetRegistry = class AssetRegistry {
    asset;
    virtualReserve;
    usdPrice;
    anchorUsdPrice;
    priceMin;
    priceMax;
    totalSupply;
};
exports.AssetRegistry = AssetRegistry;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], AssetRegistry.prototype, "asset", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AssetRegistry.prototype, "virtualReserve", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AssetRegistry.prototype, "usdPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AssetRegistry.prototype, "anchorUsdPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AssetRegistry.prototype, "priceMin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Infinity }),
    __metadata("design:type", Number)
], AssetRegistry.prototype, "priceMax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AssetRegistry.prototype, "totalSupply", void 0);
exports.AssetRegistry = AssetRegistry = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AssetRegistry);
exports.AssetRegistrySchema = mongoose_1.SchemaFactory.createForClass(AssetRegistry);
//# sourceMappingURL=asset-registry.schema.js.map