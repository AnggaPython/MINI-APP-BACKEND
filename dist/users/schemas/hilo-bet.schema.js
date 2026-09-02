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
exports.HiLoBetSchema = exports.HiLoBet = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let HiLoBet = class HiLoBet {
    telegramId;
    betAmount;
    multiplier;
    targetType;
    thresholdHI;
    thresholdLO;
    rolledNumber;
    isWin;
    profit;
    newBalance;
    serverSeed;
    clientSeed;
    hash;
};
exports.HiLoBet = HiLoBet;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HiLoBet.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HiLoBet.prototype, "betAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HiLoBet.prototype, "multiplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HiLoBet.prototype, "targetType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HiLoBet.prototype, "thresholdHI", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HiLoBet.prototype, "thresholdLO", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HiLoBet.prototype, "rolledNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Boolean)
], HiLoBet.prototype, "isWin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HiLoBet.prototype, "profit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HiLoBet.prototype, "newBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HiLoBet.prototype, "serverSeed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HiLoBet.prototype, "clientSeed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HiLoBet.prototype, "hash", void 0);
exports.HiLoBet = HiLoBet = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], HiLoBet);
exports.HiLoBetSchema = mongoose_1.SchemaFactory.createForClass(HiLoBet);
exports.HiLoBetSchema.index({ telegramId: 1, createdAt: -1 });
//# sourceMappingURL=hilo-bet.schema.js.map