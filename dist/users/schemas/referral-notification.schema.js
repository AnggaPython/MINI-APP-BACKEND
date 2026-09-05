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
exports.ReferralNotificationSchema = exports.ReferralNotification = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ReferralNotification = class ReferralNotification {
    recipientTelegramId;
    kind;
    downlineUsername;
    amount;
    ackedAt;
    ackedVia;
};
exports.ReferralNotification = ReferralNotification;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], ReferralNotification.prototype, "recipientTelegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["invite", "welcome"] }),
    __metadata("design:type", String)
], ReferralNotification.prototype, "kind", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ReferralNotification.prototype, "downlineUsername", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], ReferralNotification.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], ReferralNotification.prototype, "ackedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], ReferralNotification.prototype, "ackedVia", void 0);
exports.ReferralNotification = ReferralNotification = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ReferralNotification);
exports.ReferralNotificationSchema = mongoose_1.SchemaFactory.createForClass(ReferralNotification);
exports.ReferralNotificationSchema.index({ ackedAt: 1 }, {
    name: "ackedAt_ttl",
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { ackedAt: { $type: "date" } },
});
//# sourceMappingURL=referral-notification.schema.js.map