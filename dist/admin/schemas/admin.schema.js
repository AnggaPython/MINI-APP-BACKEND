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
exports.AdminSchema = exports.Admin = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Admin = class Admin {
    username;
    passwordHash;
    role;
    lastLogin;
    lastIp;
    profitBalances;
    withdrawLimits;
};
exports.Admin = Admin;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Admin.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Admin.prototype, "passwordHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'SUPER_ADMIN' }),
    __metadata("design:type", String)
], Admin.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Admin.prototype, "lastLogin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Admin.prototype, "lastIp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Admin.prototype, "profitBalances", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: { 'PEPE': 10000000, 'USDC': 200 } }),
    __metadata("design:type", Object)
], Admin.prototype, "withdrawLimits", void 0);
exports.Admin = Admin = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Admin);
exports.AdminSchema = mongoose_1.SchemaFactory.createForClass(Admin);
//# sourceMappingURL=admin.schema.js.map