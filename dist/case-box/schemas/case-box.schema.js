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
exports.CaseBoxSchema = exports.CaseBox = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let CaseBox = class CaseBox {
    telegramId;
    tier;
    maxHp;
    status;
    outcome;
    lootRarity;
    lootName;
    loot;
    openedAt;
    claimedAt;
    expireAt;
};
exports.CaseBox = CaseBox;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], CaseBox.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["COMMON", "MEDIUM", "RARE"] }),
    __metadata("design:type", String)
], CaseBox.prototype, "tier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], CaseBox.prototype, "maxHp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ["active", "opened", "claimed"],
        default: "active",
    }),
    __metadata("design:type", String)
], CaseBox.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, enum: [null, "ZONK", "ELIXCOIN", "MATERIAL", "BUFF"] }),
    __metadata("design:type", Object)
], CaseBox.prototype, "outcome", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, enum: [null, "COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] }),
    __metadata("design:type", Object)
], CaseBox.prototype, "lootRarity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], CaseBox.prototype, "lootName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], CaseBox.prototype, "loot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], CaseBox.prototype, "openedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], CaseBox.prototype, "claimedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], CaseBox.prototype, "expireAt", void 0);
exports.CaseBox = CaseBox = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CaseBox);
exports.CaseBoxSchema = mongoose_1.SchemaFactory.createForClass(CaseBox);
exports.CaseBoxSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
exports.CaseBoxSchema.index({ telegramId: 1, status: 1, createdAt: -1 });
//# sourceMappingURL=case-box.schema.js.map