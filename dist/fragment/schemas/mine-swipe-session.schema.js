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
exports.MineSwipeSessionSchema = exports.MineSwipeSession = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let MineSwipeSession = class MineSwipeSession {
    telegramId;
    boardSize;
    mineCount;
    mines;
    revealed;
    status;
    accumulatedReward;
    finalReward;
    rewardPerTile;
    expireAt;
};
exports.MineSwipeSession = MineSwipeSession;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], MineSwipeSession.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 5 }),
    __metadata("design:type", Number)
], MineSwipeSession.prototype, "boardSize", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 5 }),
    __metadata("design:type", Number)
], MineSwipeSession.prototype, "mineCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], MineSwipeSession.prototype, "mines", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], MineSwipeSession.prototype, "revealed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["active", "won", "lost", "claimed"], default: "active" }),
    __metadata("design:type", String)
], MineSwipeSession.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], MineSwipeSession.prototype, "accumulatedReward", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], MineSwipeSession.prototype, "finalReward", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], MineSwipeSession.prototype, "rewardPerTile", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], MineSwipeSession.prototype, "expireAt", void 0);
exports.MineSwipeSession = MineSwipeSession = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MineSwipeSession);
exports.MineSwipeSessionSchema = mongoose_1.SchemaFactory.createForClass(MineSwipeSession);
exports.MineSwipeSessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
exports.MineSwipeSessionSchema.index({ telegramId: 1, status: 1 });
//# sourceMappingURL=mine-swipe-session.schema.js.map