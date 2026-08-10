import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminService } from '../admin/admin.service';
import { IS_PUBLIC_KEY } from './telegram.guard';

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private adminService: AdminService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Allow endpoints explicitly marked @Public() (e.g. /admin/login itself)
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            throw new UnauthorizedException('Admin login required — missing Authorization header');
        }

        // Accept both "Bearer <token>" and raw "<token>"
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : authHeader.trim();

        const admin = await this.adminService.verifySessionToken(token);
        if (!admin) {
            throw new UnauthorizedException('Admin session invalid or expired — please re-login');
        }

        // Attach admin to request for downstream handlers
        request.admin = {
            id: admin._id?.toString(),
            username: admin.username,
            role: admin.role,
        };
        return true;
    }
}
