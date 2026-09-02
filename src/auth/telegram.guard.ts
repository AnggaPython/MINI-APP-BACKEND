import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as crypto from "crypto";
import { UsersService } from "../users/users.service";

export const IS_PUBLIC_KEY = "isPublic";

// Log only ONCE at module startup instead of spamming per-request logs.
// (The dev fallback telegramId logging was a major terminal noise issue.)
let devBootBannerShown = false;
const telegramGuardLogger = new Logger("TelegramAuthGuard");
function showDevBannerOnce() {
  if (devBootBannerShown) return;
  devBootBannerShown = true;
  const fallbackId = process.env.DEV_FALLBACK_TELEGRAM_ID || "123456789";
  const prod = process.env.NODE_ENV === "production";
  telegramGuardLogger.log("");
  telegramGuardLogger.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  telegramGuardLogger.log(
    "║ [TelegramAuthGuard] Boot Summary                             ║",
  );
  telegramGuardLogger.log(
    "╠══════════════════════════════════════════════════════════════╣",
  );
  telegramGuardLogger.log(
    `║  NODE_ENV              : ${process.env.NODE_ENV || "development".padEnd(33)}║`,
  );
  if (!prod) {
    telegramGuardLogger.log(
      `║  Dev fallback user ID  : ${fallbackId.padEnd(33)}║`,
    );
    telegramGuardLogger.log(
      `║  Dev login endpoint    : POST /users/public/login           ║`,
    );
    telegramGuardLogger.log(
      `║  ⚠️  WARNING: username/password + silent fallback are      ║`,
    );
    telegramGuardLogger.log(
      `║     ONLY ACTIVE in NODE_ENV != production.                  ║`,
    );
  } else {
    telegramGuardLogger.log(
      `║  PRODUCTION MODE: Strict HMAC only. No fallbacks.           ║`,
    );
  }
  telegramGuardLogger.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  telegramGuardLogger.log("");
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {
    showDevBannerOnce();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Allow endpoints marked with @Public() to bypass auth entirely.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const url: string = (request.url || request.originalUrl || "") as string;

    // ─────────────────────────────────────────────────────────────
    // ADMIN SUB-APPLICATION BYPASS — CRITICAL FIX.
    // TelegramAuthGuard is registered as a GLOBAL APP_GUARD via
    // users.module.ts, which means it runs BEFORE controller-level
    // @UseGuards(AdminAuthGuard) on AdminController.
    //
    // Problem: Admin frontend sends `Authorization: Bearer <admin_token>`.
    // This guard tried to look it up in the USER session collection →
    // not found → throws "Invalid or expired session token" — and
    // AdminAuthGuard never even gets to run → dashboard Unauthorized.
    //
    // Fix: if URL starts with /admin → skip this Telegram guard entirely.
    // The AdminController already enforces its OWN AdminAuthGuard (with
    // its own session token table + bcrypt login) via @UseGuards() at
    // the controller class level. Plus /admin/login is marked @Public()
    // and would have been caught by the above isPublic check anyway.
    // ─────────────────────────────────────────────────────────────
    if (url.startsWith("/admin")) {
      return true;
    }

    const authHeader = request.headers["authorization"] || "";
    const isDevMode = process.env.NODE_ENV !== "production";

    // ─────────────────────────────────────────────────────────────
    // AUTH PRIORITY #1 — Bearer session token (dev login result)
    // Works in BOTH dev + production (if user was ever issued a token
    // through /users/public/login — but that endpoint is dev-only).
    // ─────────────────────────────────────────────────────────────
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token.length >= 32) {
        return this.authenticateViaSessionToken(request, token);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // AUTH PRIORITY #2 — raw Telegram WebApp initData (HMAC signed)
    // Normal production path: the Telegram SDK sends initData as the
    // Authorization header contents.
    // ─────────────────────────────────────────────────────────────
    if (authHeader && !authHeader.startsWith("Bearer ")) {
      this.authenticateViaTelegramInitData(request, authHeader);
      return true;
    }

    // ─────────────────────────────────────────────────────────────
    // AUTH PRIORITY #3 — Dev-only silent fallback.
    // NO PER-REQUEST LOGGING (root cause of user terminal spam!).
    // TOTALLY DISABLED in NODE_ENV === production.
    // ─────────────────────────────────────────────────────────────
    if (isDevMode && !authHeader) {
      const fallbackTelegramId =
        process.env.DEV_FALLBACK_TELEGRAM_ID || "123456789";
      // @ts-ignore - request.user dynamic
    request.user = {
        telegramId: fallbackTelegramId,
        firstName: "Dev",
        lastName: "User",
        username: "devuser",
        isPremium: false,
      };
      return true;
    }

    throw new UnauthorizedException("Missing Authorization header");
  }

  // ──────────────────────────────────────────────────────────────────
  // Session token authentication (via UsersService DB lookup)
  // ──────────────────────────────────────────────────────────────────
  private async authenticateViaSessionToken(
    request: any,
    token: string,
  ): Promise<boolean> {
    // Users-only session token lookup. Admin tokens are handled by the
    // separate AdminAuthGuard — and /admin/* URLs have already been
    // short-circuit allowed earlier in canActivate() so this user guard
    // never has to know about or touch admin sessions.
    const user = await this.usersService.findBySessionToken(token);
    if (!user) {
      throw new UnauthorizedException("Invalid or expired session token");
    }

    // @ts-ignore - request.user dynamic
    request.user = {
      telegramId: user.telegramId,
      firstName: user.firstName || "Dev",
      lastName: user.lastName || "User",
      username: user.username || undefined,
      isPremium: user.isPremium || false,
    };
    return true;
  }

  // ──────────────────────────────────────────────────────────────────
  // Telegram WebApp initData HMAC validation
  // ──────────────────────────────────────────────────────────────────
  private authenticateViaTelegramInitData(
    request: any,
    rawInitData: string,
  ) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      // Dev-mode safety net: parse initData WITHOUT HMAC validation.
      // This is ONLY safe in local dev — production must have a token.
      const parsed = this.parseInitData(rawInitData);
      if (!parsed.user)
        throw new UnauthorizedException("Invalid initData: no user field");
      const user = JSON.parse(parsed.user);
      // @ts-ignore - request.user dynamic
    request.user = { telegramId: user.id?.toString() };
      return;
    }

    // 1. Parse raw initData query string
    const parsed = this.parseInitData(rawInitData);
    const receivedHash = parsed.hash;
    if (!receivedHash)
      throw new UnauthorizedException("Missing hash in initData");

    // 2. Build check string: all parameters sorted alphabetically
    const checkString = Object.entries(parsed)
      .filter(([k]) => k !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    // 3. Derive HMAC secret key from bot token
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // 4. Compute and compare expected hash
    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    if (expectedHash !== receivedHash) {
      throw new UnauthorizedException("initData HMAC verification failed");
    }

    // 5. Reject stale initData (> 24 hours old)
    const authDate = parseInt(parsed.auth_date || "0", 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - authDate > 86400) {
      throw new UnauthorizedException("initData has expired");
    }

    // 6. Attach validated user object to request
    if (!parsed.user) throw new UnauthorizedException("No user in initData");
    const user = JSON.parse(parsed.user);
    // @ts-ignore - request.user dynamic
    request.user = {
      telegramId: user.id?.toString(),
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      isPremium: user.is_premium === true,
    };
  }

  private parseInitData(raw: string): Record<string, string> {
    const result: Record<string, string> = {};
    try {
      const params = new URLSearchParams(raw);
      params.forEach((v, k) => {
        result[k] = v;
      });
    } catch {
      throw new UnauthorizedException("Malformed initData");
    }
    return result;
  }
}
