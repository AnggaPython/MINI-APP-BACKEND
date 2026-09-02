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
exports.BankLogSchema = exports.BankLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let BankLog = class BankLog {
    telegramId;
    actionType;
    amount;
};
exports.BankLog = BankLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], BankLog.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BankLog.prototype, "actionType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], BankLog.prototype, "amount", void 0);
exports.BankLog = BankLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], BankLog);
exports.BankLogSchema = mongoose_1.SchemaFactory.createForClass(BankLog);
exports.BankLogSchema.index({ telegramId: 1, createdAt: -1 });
exports.BankLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
//# sourceMappingURL=bank-log.schema.js.map