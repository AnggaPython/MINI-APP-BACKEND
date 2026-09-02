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
exports.OpenOrderSchema = exports.OpenOrder = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let OpenOrder = class OpenOrder {
    telegramId;
    pair;
    side;
    price;
    amount;
    filledAmount;
    status;
    iceberg;
    icebergTotal;
    icebergChunkSize;
    icebergChunksFilled;
};
exports.OpenOrder = OpenOrder;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], OpenOrder.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "ELIXCOIN/ELIXIR" }),
    __metadata("design:type", String)
], OpenOrder.prototype, "pair", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["BUY", "SELL"] }),
    __metadata("design:type", String)
], OpenOrder.prototype, "side", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], OpenOrder.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], OpenOrder.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OpenOrder.prototype, "filledAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: "OPEN", enum: ["OPEN", "FILLED", "CANCELLED"] }),
    __metadata("design:type", String)
], OpenOrder.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], OpenOrder.prototype, "iceberg", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OpenOrder.prototype, "icebergTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OpenOrder.prototype, "icebergChunkSize", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OpenOrder.prototype, "icebergChunksFilled", void 0);
exports.OpenOrder = OpenOrder = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], OpenOrder);
exports.OpenOrderSchema = mongoose_1.SchemaFactory.createForClass(OpenOrder);
exports.OpenOrderSchema.index({ pair: 1, status: 1, price: 1 });
exports.OpenOrderSchema.index({ telegramId: 1, status: 1 });
exports.OpenOrderSchema.index({ status: 1, price: 1 });
//# sourceMappingURL=open-order.schema.js.map