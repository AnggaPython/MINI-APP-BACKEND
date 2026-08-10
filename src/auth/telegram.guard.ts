import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Allow endpoints marked with @Public() to bypass auth
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const rawInitData = request.headers['authorization'];

        if (!rawInitData) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            // Dev-mode fallback: parse initData without HMAC validation
            // (only safe in local dev — prod must have BOT_TOKEN)
            const parsed = this.parseInitData(rawInitData);
            if (!parsed.user) throw new UnauthorizedException('Invalid initData: no user field');
            const user = JSON.parse(parsed.user);
            request.user = { telegramId: user.id?.toString() };
            return true;
        }

        // 1. Parse the raw initData query string
        const parsed = this.parseInitData(rawInitData);
        const receivedHash = parsed.hash;
        if (!receivedHash) throw new UnauthorizedException('Missing hash in initData');

        // 2. Build check string: all pairs except hash, sorted alphabetically
        const checkString = Object.entries(parsed)
            .filter(([k]) => k !== 'hash')
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        // 3. Derive secret key from bot token using "WebAppData" as HMAC key
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // 4. Compute expected HMAC
        const expectedHash = crypto
            .createHmac('sha256', secretKey)
            .update(checkString)
            .digest('hex');

        if (expectedHash !== receivedHash) {
            throw new UnauthorizedException('initData HMAC verification failed');
        }

        // 5. Check auth_date is not stale (> 24 hours old)
        const authDate = parseInt(parsed.auth_date || '0', 10);
        const nowSec = Math.floor(Date.now() / 1000);
        if (nowSec - authDate > 86400) {
            throw new UnauthorizedException('initData has expired');
        }

        // 6. Attach validated user to request
        if (!parsed.user) throw new UnauthorizedException('No user in initData');
        const user = JSON.parse(parsed.user);
        request.user = {
            telegramId: user.id?.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            isPremium: user.is_premium === true,
        };

        return true;
    }

    private parseInitData(raw: string): Record<string, string> {
        const result: Record<string, string> = {};
        try {
            const params = new URLSearchParams(raw);
            params.forEach((v, k) => { result[k] = v; });
        } catch {
            throw new UnauthorizedException('Malformed initData');
        }
        return result;
    }
}
