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
exports.UserNetEquitySchema = exports.UserNetEquity = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let UserNetEquity = class UserNetEquity {
    telegramId;
    firstName;
    username;
    totalDepositedElixir;
    totalWithdrawnElixir;
    totalHiLoGrossWinsElixir;
    totalHiLoGrossLossesElixir;
    lockedVestingElixir;
    lockedVestingTurnoverRequired;
    lockedVestingTurnoverDone;
    lastBigWinAt;
    totalBetsLifetime;
    adsViewedLifetime;
    withdrawnTodayElixir;
    withdrawnDayKey;
    circulationTaxAccumulated;
    lastActiveAt;
    whalePatternQueue;
    whalePatternIndex;
    createdAt;
    updatedAt;
};
exports.UserNetEquity = UserNetEquity;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, unique: true, index: true }),
    __metadata("design:type", String)
], UserNetEquity.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], UserNetEquity.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], UserNetEquity.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "totalDepositedElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "totalWithdrawnElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "totalHiLoGrossWinsElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "totalHiLoGrossLossesElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "lockedVestingElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "lockedVestingTurnoverRequired", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "lockedVestingTurnoverDone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], UserNetEquity.prototype, "lastBigWinAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "totalBetsLifetime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "adsViewedLifetime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "withdrawnTodayElixir", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], UserNetEquity.prototype, "withdrawnDayKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "circulationTaxAccumulated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], UserNetEquity.prototype, "lastActiveAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: Number, default: [] }] }),
    __metadata("design:type", Array)
], UserNetEquity.prototype, "whalePatternQueue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], UserNetEquity.prototype, "whalePatternIndex", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], UserNetEquity.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], UserNetEquity.prototype, "updatedAt", void 0);
exports.UserNetEquity = UserNetEquity = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], UserNetEquity);
exports.UserNetEquitySchema = mongoose_1.SchemaFactory.createForClass(UserNetEquity);
//# sourceMappingURL=user-net-equity.schema.js.map