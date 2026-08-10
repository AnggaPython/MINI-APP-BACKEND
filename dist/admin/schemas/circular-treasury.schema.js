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
exports.CircularTreasurySchema = exports.CircularTreasury = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let CircularTreasury = class CircularTreasury {
    key;
    adminTreasuryElixir;
    circularLossPoolElixir;
    burnedTotalElixir;
    adminTreasuryStartCycle;
    totalTaxCollectedThisCycle;
    isRefillMode;
    refillTriggerCountThisCycle;
    paramAdminTreasuryStart;
    paramRefillTriggerBelow;
    paramRefillStopAbove;
    paramAdminTaxNormal;
    paramAdminTaxRefill;
    paramCircularShareNormal;
    paramCircularShareRefill;
    paramBurnRate;
    paramMaxAdminPayoutPercentPerBet;
    paramWhaleBetThresholdElixir;
    paramWhalePatternNormalTargetLoss;
    paramWhalePatternRefillTargetLoss;
    liveImpactLog;
    dailySnapshots30D;
    lastDailySnapshot;
    createdAt;
    updatedAt;
};
exports.CircularTreasury = CircularTreasury;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, default: 'MAIN' }),
    __metadata("design:type", String)
], CircularTreasury.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 100000 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "adminTreasuryElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "circularLossPoolElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "burnedTotalElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 100000 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "adminTreasuryStartCycle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "totalTaxCollectedThisCycle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], CircularTreasury.prototype, "isRefillMode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "refillTriggerCountThisCycle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 100000 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramAdminTreasuryStart", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 90000 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramRefillTriggerBelow", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 102000 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramRefillStopAbove", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.15 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramAdminTaxNormal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.25 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramAdminTaxRefill", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.8 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramCircularShareNormal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.7 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramCircularShareRefill", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.05 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramBurnRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.02 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramMaxAdminPayoutPercentPerBet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 500 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramWhaleBetThresholdElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.12 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramWhalePatternNormalTargetLoss", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0.22 }),
    __metadata("design:type", Number)
], CircularTreasury.prototype, "paramWhalePatternRefillTargetLoss", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: Object }], default: [] }),
    __metadata("design:type", Array)
], CircularTreasury.prototype, "liveImpactLog", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: Object }], default: [] }),
    __metadata("design:type", Array)
], CircularTreasury.prototype, "dailySnapshots30D", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CircularTreasury.prototype, "lastDailySnapshot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CircularTreasury.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CircularTreasury.prototype, "updatedAt", void 0);
exports.CircularTreasury = CircularTreasury = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CircularTreasury);
exports.CircularTreasurySchema = mongoose_1.SchemaFactory.createForClass(CircularTreasury);
//# sourceMappingURL=circular-treasury.schema.js.map