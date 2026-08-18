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
exports.AdminAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const admin_service_1 = require("../admin/admin.service");
const telegram_guard_1 = require("./telegram.guard");
let AdminAuthGuard = class AdminAuthGuard {
    reflector;
    adminService;
    constructor(reflector, adminService) {
        this.reflector = reflector;
        this.adminService = adminService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(telegram_guard_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers["authorization"];
        if (!authHeader) {
            throw new common_1.UnauthorizedException("Admin login required — missing Authorization header");
        }
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7).trim()
            : authHeader.trim();
        const admin = await this.adminService.verifySessionToken(token);
        if (!admin) {
            throw new common_1.UnauthorizedException("Admin session invalid or expired — please re-login");
        }
        request.admin = {
            id: admin._id?.toString(),
            username: admin.username,
            role: admin.role,
        };
        return true;
    }
};
exports.AdminAuthGuard = AdminAuthGuard;
exports.AdminAuthGuard = AdminAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        admin_service_1.AdminService])
], AdminAuthGuard);
//# sourceMappingURL=admin.guard.js.map