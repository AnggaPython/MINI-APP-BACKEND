import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
export declare class AdminController {
    private readonly adminService;
    private readonly usersService;
    constructor(adminService: AdminService, usersService: UsersService);
    login(body: any, req: any): Promise<{
        success: boolean;
        token: string;
        role: string;
        error?: undefined;
    } | {
        error: string;
    }>;
    searchUser(query: string): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("../users/schemas/user.schema").User;
        error?: undefined;
    }>;
    updateUserBalance(body: {
        telegramId: string;
        elixirBalance?: number;
        cryptoBalances?: Record<string, number>;
    }): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("../users/schemas/user.schema").User;
        error?: undefined;
    }>;
    banUser(body: {
        telegramId: string;
        isBanned: boolean;
    }): Promise<{
        error: string;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: import("../users/schemas/user.schema").User;
        error?: undefined;
    }>;
}
