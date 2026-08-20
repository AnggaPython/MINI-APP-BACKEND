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
exports.TradeSchema = exports.Trade = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Trade = class Trade {
    pair;
    side;
    price;
    amount;
    total;
    fee;
    feeCurrency;
    source;
    telegramId;
};
exports.Trade = Trade;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: "ELIXIR/ELIXCOIN" }),
    __metadata("design:type", String)
], Trade.prototype, "pair", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["BUY", "SELL"] }),
    __metadata("design:type", String)
], Trade.prototype, "side", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Trade.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Trade.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Trade.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Trade.prototype, "fee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: "ELIXCOIN", enum: ["ELIXIR", "ELIXCOIN"] }),
    __metadata("design:type", String)
], Trade.prototype, "feeCurrency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: "USER", enum: ["BOT", "USER"] }),
    __metadata("design:type", String)
], Trade.prototype, "source", void 0);
__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    __metadata("design:type", String)
], Trade.prototype, "telegramId", void 0);
exports.Trade = Trade = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Trade);
exports.TradeSchema = mongoose_1.SchemaFactory.createForClass(Trade);
exports.TradeSchema.index({ createdAt: -1 });
exports.TradeSchema.index({ pair: 1, createdAt: -1 });
//# sourceMappingURL=trade.schema.js.map