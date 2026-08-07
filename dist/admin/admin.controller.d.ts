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
    getFeed(): Promise<{
        totalUsers: number;
        totalElixir: number;
        recentUsers: (import("../users/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        success: boolean;
    }>;
    getProfitBalances(): Promise<{
        success: boolean;
        profitBalances: Record<string, number>;
    }>;
    getProfitLogs(coin: string): Promise<{
        success: boolean;
        logs: (import("mongoose").Document<unknown, {}, import("./schemas/profit-log.schema").ProfitLogDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/profit-log.schema").ProfitLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
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
