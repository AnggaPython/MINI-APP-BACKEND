import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UsersService } from "../users/users.service";
export declare const IS_PUBLIC_KEY = "isPublic";
export declare class TelegramAuthGuard implements CanActivate {
    private reflector;
    private usersService;
    constructor(reflector: Reflector, usersService: UsersService);
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
    private authenticateViaSessionToken;
    private authenticateViaTelegramInitData;
    private parseInitData;
}
