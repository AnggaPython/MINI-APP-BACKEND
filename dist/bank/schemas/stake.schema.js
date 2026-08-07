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
exports.StakeSchema = exports.Stake = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Stake = class Stake {
    telegramId;
    amount;
    durationDays;
    rate;
    stakeDate;
    maturityDate;
    lastClaimDate;
    status;
    autoClaim;
    autoReinvest;
};
exports.Stake = Stake;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Stake.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Stake.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Stake.prototype, "durationDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Stake.prototype, "rate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Stake.prototype, "stakeDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Stake.prototype, "maturityDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Stake.prototype, "lastClaimDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['active', 'withdrawn'], default: 'active' }),
    __metadata("design:type", String)
], Stake.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Stake.prototype, "autoClaim", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Stake.prototype, "autoReinvest", void 0);
exports.Stake = Stake = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Stake);
exports.StakeSchema = mongoose_1.SchemaFactory.createForClass(Stake);
//# sourceMappingURL=stake.schema.js.map