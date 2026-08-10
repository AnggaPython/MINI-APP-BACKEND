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
exports.MonthlyBookCycleSchema = exports.MonthlyBookCycle = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let MonthlyBookCycle = class MonthlyBookCycle {
    cycleId;
    startDate;
    endDate;
    isActive;
    startAdminTreasury;
    endAdminTreasury;
    totalTaxCollected;
    totalBurned;
    totalWithdrawalFees;
    totalAdsRevenueElixirEquivalent;
    totalBets;
    totalBetsVolume;
    refillModeTriggeredCount;
    dailySeries;
    netProfitPercent;
    createdAt;
    updatedAt;
};
exports.MonthlyBookCycle = MonthlyBookCycle;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, unique: true }),
    __metadata("design:type", String)
], MonthlyBookCycle.prototype, "cycleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], MonthlyBookCycle.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], MonthlyBookCycle.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], MonthlyBookCycle.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 100000 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "startAdminTreasury", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], MonthlyBookCycle.prototype, "endAdminTreasury", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "totalTaxCollected", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "totalBurned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "totalWithdrawalFees", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "totalAdsRevenueElixirEquivalent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "totalBets", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "totalBetsVolume", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], MonthlyBookCycle.prototype, "refillModeTriggeredCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: Object }], default: [] }),
    __metadata("design:type", Array)
], MonthlyBookCycle.prototype, "dailySeries", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], MonthlyBookCycle.prototype, "netProfitPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], MonthlyBookCycle.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], MonthlyBookCycle.prototype, "updatedAt", void 0);
exports.MonthlyBookCycle = MonthlyBookCycle = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MonthlyBookCycle);
exports.MonthlyBookCycleSchema = mongoose_1.SchemaFactory.createForClass(MonthlyBookCycle);
//# sourceMappingURL=monthly-book-cycle.schema.js.map