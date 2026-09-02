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
exports.MiningStoneSchema = exports.MiningStone = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let MiningStone = class MiningStone {
    telegramId;
    tier;
    maxHp;
    zonk;
    status;
    rewards;
    claimAction;
    claimedAt;
    finalizedAt;
    expireAt;
};
exports.MiningStone = MiningStone;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], MiningStone.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["Common", "Medium", "Rare"] }),
    __metadata("design:type", String)
], MiningStone.prototype, "tier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], MiningStone.prototype, "maxHp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], MiningStone.prototype, "zonk", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["active", "claimed"], default: "active" }),
    __metadata("design:type", String)
], MiningStone.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], MiningStone.prototype, "rewards", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, enum: [null, "save", "sell"] }),
    __metadata("design:type", Object)
], MiningStone.prototype, "claimAction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], MiningStone.prototype, "claimedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], MiningStone.prototype, "finalizedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], MiningStone.prototype, "expireAt", void 0);
exports.MiningStone = MiningStone = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MiningStone);
exports.MiningStoneSchema = mongoose_1.SchemaFactory.createForClass(MiningStone);
exports.MiningStoneSchema.index({ telegramId: 1, status: 1 });
exports.MiningStoneSchema.index({ telegramId: 1, status: 1, claimedAt: -1 });
exports.MiningStoneSchema.index({ telegramId: 1, status: 1, claimAction: 1 });
exports.MiningStoneSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=mining-stone.schema.js.map