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
exports.LiquidityPoolSchema = exports.LiquidityPool = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let LiquidityPool = class LiquidityPool {
    pair;
    elixcoinReserve;
    elixirReserve;
    lastMid;
    spreadPct;
    feePct;
    platformFeesAccumulated;
    spreadProfitAccumulated;
    botRunCount;
    lastBotRunAt;
    lifetimeVolume;
    botEnabled;
    botIntervalMinutes;
    high24h;
    low24h;
    volume24h;
    quoteVolume24h;
    open24h;
    dayResetAt;
};
exports.LiquidityPool = LiquidityPool;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], LiquidityPool.prototype, "pair", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "elixcoinReserve", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "elixirReserve", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.14872647389 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "lastMid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.004 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "spreadPct", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.025 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "feePct", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "platformFeesAccumulated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "spreadProfitAccumulated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "botRunCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], LiquidityPool.prototype, "lastBotRunAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "lifetimeVolume", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], LiquidityPool.prototype, "botEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 15, min: 1, max: 60 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "botIntervalMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "high24h", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Infinity }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "low24h", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "volume24h", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "quoteVolume24h", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiquidityPool.prototype, "open24h", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], LiquidityPool.prototype, "dayResetAt", void 0);
exports.LiquidityPool = LiquidityPool = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], LiquidityPool);
exports.LiquidityPoolSchema = mongoose_1.SchemaFactory.createForClass(LiquidityPool);
//# sourceMappingURL=pool.schema.js.map