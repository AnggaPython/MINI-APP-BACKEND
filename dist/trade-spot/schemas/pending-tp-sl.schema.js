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
exports.PendingTpSlSchema = exports.PendingTpSl = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PendingTpSl = class PendingTpSl {
    telegramId;
    pair;
    originalSide;
    tpPrice;
    slPrice;
    amount;
    triggered;
    cancelled;
    triggeredAt;
};
exports.PendingTpSl = PendingTpSl;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PendingTpSl.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PendingTpSl.prototype, "pair", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["BUY", "SELL"] }),
    __metadata("design:type", String)
], PendingTpSl.prototype, "originalSide", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PendingTpSl.prototype, "tpPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PendingTpSl.prototype, "slPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], PendingTpSl.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PendingTpSl.prototype, "triggered", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PendingTpSl.prototype, "cancelled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], PendingTpSl.prototype, "triggeredAt", void 0);
exports.PendingTpSl = PendingTpSl = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PendingTpSl);
exports.PendingTpSlSchema = mongoose_1.SchemaFactory.createForClass(PendingTpSl);
exports.PendingTpSlSchema.index({ pair: 1, triggered: 1, cancelled: 1 });
exports.PendingTpSlSchema.index({ telegramId: 1, pair: 1 });
//# sourceMappingURL=pending-tp-sl.schema.js.map