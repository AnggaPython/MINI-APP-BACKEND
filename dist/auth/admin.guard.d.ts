import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminService } from '../admin/admin.service';
export declare class AdminAuthGuard implements CanActivate {
    private reflector;
    private adminService;
    constructor(reflector: Reflector, adminService: AdminService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
