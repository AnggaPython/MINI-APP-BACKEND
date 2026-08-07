import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
export declare class AdminController {
    private readonly adminService;
    private readonly usersService;
    constructor(adminService: AdminService, usersService: UsersService);
    login(body: any, req: any): Promise<{
        success: boolean;
        token: any;
        role: any;
        error?: undefined;
    } | {
        error: string;
    }>;
    getFeed(): Promise<{
        totalUsers: any;
        totalElixir: any;
        totalAdRevenueUSD: any;
        recentUsers: any;
        success: boolean;
    }>;
    getProfitBalances(): Promise<{
        success: boolean;
        profitBalances: any;
    }>;
    getProfitLogs(coin: string): Promise<{
        success: boolean;
        logs: any;
    }>;
    getWithdrawLimits(): Promise<{
        success: boolean;
        withdrawLimits: Record<string, number>;
    }>;
    updateWithdrawLimit(body: {
        coin: string;
        limit: number;
    }): Promise<{
        error: string;
        success?: undefined;
        withdrawLimits?: undefined;
    } | {
        success: boolean;
        withdrawLimits: Record<string, number>;
        error?: undefined;
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
