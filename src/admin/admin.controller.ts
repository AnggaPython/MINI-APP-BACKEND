import { Controller, Post, Get, Body, Req, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly usersService: UsersService
    ) { }

    @Post('login')
    async login(@Body() body: any, @Req() req: any) {
        if (!body.username || !body.password) {
            return { error: 'Missing username or password' };
        }

        // Primitive IP parsing
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

        return await this.adminService.authenticate(body.username, body.password, ip as string);
    }

    @Get('feed')
    async getFeed() {
        const stats = await this.usersService.getDashboardStatsAdmin();
        return { success: true, ...stats };
    }

    @Get('profit-balances')
    async getProfitBalances() {
        const balances = await this.adminService.getProfitBalances();
        return { success: true, profitBalances: balances };
    }

    @Get('profit-logs')
    async getProfitLogs(@Query('coin') coin: string) {
        const logs = await this.adminService.getProfitLogs(coin);
        return { success: true, logs };
    }

    // --- User Interrogation Endpoints ---
    @Post('user/search')
    async searchUser(@Body('query') query: string) {
        if (!query) return { error: 'Missing search query' };
        // Clean the '@' if the admin types it
        const cleanQuery = query.startsWith('@') ? query.substring(1) : query;
        const user = await this.usersService.searchUserForAdmin(cleanQuery);
        if (!user) return { error: 'User not found' };
        return { success: true, user };
    }

    @Post('user/update-balance')
    async updateUserBalance(@Body() body: { telegramId: string, elixirBalance?: number, cryptoBalances?: Record<string, number> }) {
        if (!body.telegramId) return { error: 'Missing telegramId' };
        const user = await this.usersService.updateUserBalanceAdmin(body.telegramId, body.elixirBalance, body.cryptoBalances);
        if (!user) return { error: 'User not found' };
        return { success: true, user };
    }

    @Post('user/ban')
    async banUser(@Body() body: { telegramId: string, isBanned: boolean }) {
        if (!body.telegramId || typeof body.isBanned !== 'boolean') return { error: 'Missing parameters' };
        const user = await this.usersService.setUserBanStatus(body.telegramId, body.isBanned);
        if (!user) return { error: 'User not found' };
        return { success: true, user };
    }
}
