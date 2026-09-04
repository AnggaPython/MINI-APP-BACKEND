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
exports.AutoMiningDaySchema = exports.AutoMiningDay = exports.AutoMiningSubSchema = exports.AutoMiningSub = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AutoMiningSub = class AutoMiningSub {
    telegramId;
    status;
    planDays;
    feePaid;
    claimMode;
    target;
    splitStonePct;
    startDate;
    endDate;
    dailyQuota;
    autopilotOn;
    lastRunAt;
    totalRuns;
    totalElixirValue;
    favPickaxe;
    planBuffs;
};
exports.AutoMiningSub = AutoMiningSub;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], AutoMiningSub.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ["active", "paused", "expired", "cancelled"],
        default: "active",
    }),
    __metadata("design:type", String)
], AutoMiningSub.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 30 }),
    __metadata("design:type", Number)
], AutoMiningSub.prototype, "planDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 250000 }),
    __metadata("design:type", Number)
], AutoMiningSub.prototype, "feePaid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["save", "sell"], default: "save" }),
    __metadata("design:type", String)
], AutoMiningSub.prototype, "claimMode", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ["stone", "casebox", "split"],
        default: "stone",
    }),
    __metadata("design:type", String)
], AutoMiningSub.prototype, "target", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 50 }),
    __metadata("design:type", Number)
], AutoMiningSub.prototype, "splitStonePct", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], AutoMiningSub.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], AutoMiningSub.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 500 }),
    __metadata("design:type", Number)
], AutoMiningSub.prototype, "dailyQuota", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AutoMiningSub.prototype, "autopilotOn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], AutoMiningSub.prototype, "lastRunAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AutoMiningSub.prototype, "totalRuns", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AutoMiningSub.prototype, "totalElixirValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], AutoMiningSub.prototype, "favPickaxe", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], AutoMiningSub.prototype, "planBuffs", void 0);
exports.AutoMiningSub = AutoMiningSub = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AutoMiningSub);
exports.AutoMiningSubSchema = mongoose_1.SchemaFactory.createForClass(AutoMiningSub);
let AutoMiningDay = class AutoMiningDay {
    telegramId;
    date;
    target;
    runs;
    skipped;
    earned;
    elixirValue;
};
exports.AutoMiningDay = AutoMiningDay;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AutoMiningDay.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AutoMiningDay.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AutoMiningDay.prototype, "target", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AutoMiningDay.prototype, "runs", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AutoMiningDay.prototype, "skipped", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], AutoMiningDay.prototype, "earned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AutoMiningDay.prototype, "elixirValue", void 0);
exports.AutoMiningDay = AutoMiningDay = __decorate([
    (0, mongoose_1.Schema)()
], AutoMiningDay);
exports.AutoMiningDaySchema = mongoose_1.SchemaFactory.createForClass(AutoMiningDay);
exports.AutoMiningDaySchema.index({ telegramId: 1, date: 1, target: 1 }, { unique: true });
exports.AutoMiningDaySchema.index({ telegramId: 1, date: 1 });
//# sourceMappingURL=auto-mining.schema.js.map