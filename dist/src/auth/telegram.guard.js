"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAuthGuard = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
exports.IS_PUBLIC_KEY = "isPublic";
let devBootBannerShown = false;
function showDevBannerOnce() {
    if (devBootBannerShown)
        return;
    devBootBannerShown = true;
    const fallbackId = process.env.DEV_FALLBACK_TELEGRAM_ID || "123456789";
    const prod = process.env.NODE_ENV === "production";
    console.log("");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║ [TelegramAuthGuard] Boot Summary                             ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log(`║  NODE_ENV              : ${process.env.NODE_ENV || "development".padEnd(33)}║`);
    if (!prod) {
        console.log(`║  Dev fallback user ID  : ${fallbackId.padEnd(33)}║`);
        console.log(`║  Dev login endpoint    : POST /users/public/login           ║`);
        console.log(`║  ⚠️  WARNING: username/password + silent fallback are      ║`);
        console.log(`║     ONLY ACTIVE in NODE_ENV != production.                  ║`);
    }
    else {
        console.log(`║  PRODUCTION MODE: Strict HMAC only. No fallbacks.           ║`);
    }
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("");
}
let TelegramAuthGuard = class TelegramAuthGuard {
    reflector;
    usersService;
    constructor(reflector, usersService) {
        this.reflector = reflector;
        this.usersService = usersService;
        showDevBannerOnce();
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const url = (request.url || request.originalUrl || "");
        if (url.startsWith("/admin")) {
            return true;
        }
        const authHeader = request.headers["authorization"] || "";
        const isDevMode = process.env.NODE_ENV !== "production";
        if (authHeader.startsWith("Bearer ")) {
            const token = authHeader.slice(7).trim();
            if (token.length >= 32) {
                return this.authenticateViaSessionToken(request, token);
            }
        }
        if (authHeader && !authHeader.startsWith("Bearer ")) {
            this.authenticateViaTelegramInitData(request, authHeader);
            return true;
        }
        if (isDevMode && !authHeader) {
            const fallbackTelegramId = process.env.DEV_FALLBACK_TELEGRAM_ID || "123456789";
            request.user = {
                telegramId: fallbackTelegramId,
                firstName: "Dev",
                lastName: "User",
                username: "devuser",
                isPremium: false,
            };
            return true;
        }
        throw new common_1.UnauthorizedException("Missing Authorization header");
    }
    async authenticateViaSessionToken(request, token) {
        const user = await this.usersService.findBySessionToken(token);
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid or expired session token");
        }
        request.user = {
            telegramId: user.telegramId,
            firstName: user.firstName || "Dev",
            lastName: user.lastName || "User",
            username: user.username || undefined,
            isPremium: user.isPremium || false,
        };
        return true;
    }
    authenticateViaTelegramInitData(request, rawInitData) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            const parsed = this.parseInitData(rawInitData);
            if (!parsed.user)
                throw new common_1.UnauthorizedException("Invalid initData: no user field");
            const user = JSON.parse(parsed.user);
            request.user = { telegramId: user.id?.toString() };
            return;
        }
        const parsed = this.parseInitData(rawInitData);
        const receivedHash = parsed.hash;
        if (!receivedHash)
            throw new common_1.UnauthorizedException("Missing hash in initData");
        const checkString = Object.entries(parsed)
            .filter(([k]) => k !== "hash")
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join("\n");
        const secretKey = crypto
            .createHmac("sha256", "WebAppData")
            .update(botToken)
            .digest();
        const expectedHash = crypto
            .createHmac("sha256", secretKey)
            .update(checkString)
            .digest("hex");
        if (expectedHash !== receivedHash) {
            throw new common_1.UnauthorizedException("initData HMAC verification failed");
        }
        const authDate = parseInt(parsed.auth_date || "0", 10);
        const nowSec = Math.floor(Date.now() / 1000);
        if (nowSec - authDate > 86400) {
            throw new common_1.UnauthorizedException("initData has expired");
        }
        if (!parsed.user)
            throw new common_1.UnauthorizedException("No user in initData");
        const user = JSON.parse(parsed.user);
        request.user = {
            telegramId: user.id?.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            isPremium: user.is_premium === true,
        };
    }
    parseInitData(raw) {
        const result = {};
        try {
            const params = new URLSearchParams(raw);
            params.forEach((v, k) => {
                result[k] = v;
            });
        }
        catch {
            throw new common_1.UnauthorizedException("Malformed initData");
        }
        return result;
    }
};
exports.TelegramAuthGuard = TelegramAuthGuard;
exports.TelegramAuthGuard = TelegramAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object, users_service_1.UsersService])
], TelegramAuthGuard);
//# sourceMappingURL=telegram.guard.js.map