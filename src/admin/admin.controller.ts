import { Controller, Post, Get, Body, Req, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CircularCasinoService } from './circular-casino.service';
import { UsersService } from '../users/users.service';
import { AdminAuthGuard } from '../auth/admin.guard';
import { Public } from '../auth/telegram-user.decorator';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly usersService: UsersService,
        private readonly circularCasino: CircularCasinoService
    ) { }

    @Public()
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

    @Get('top-users')
    async getTopUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.usersService.getTopUsersPaginated(
            Number(page) || 1,
            Number(limit) || 10,
        );
        return { success: true, ...result };
    }

    @Get('profit-balances')
    async getProfitBalances() {
        const result = await this.adminService.getProfitBalances();
        return {
            success: true,
            profitBalances: result.balances,
            monetagSummary: result.monetagSummary,
            totalProfitFeesAllCoinsUsd: result.totalProfitFeesAllCoinsUsd,
            profitFeeValueByCoin: result.profitFeeValueByCoin,
            livePriceUsdByCoin: result.livePriceUsdByCoin,
        };
    }

    // ──────────────────────────────────────────────────────────────────
    // Top-100 capped Monetag ad viewers leaderboard.
    // Query params: page (default 1), limit (default 10, max 50).
    // Hard-cap 100 unique users — anything over that is discarded on
    // the backend regardless of pagination parameters sent.
    // ──────────────────────────────────────────────────────────────────
    @Get('profit-logs/monetag-top-users')
    async getMonetagTopUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const res = await this.adminService.getMonetagTopUsers(
            Number(page) || 1,
            Number(limit) || 10,
        );
        return { success: true, ...res };
    }

    @Get('profit-logs')
    async getProfitLogs(
        @Query('coin') coin: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.adminService.getProfitLogsPaginated(
            coin,
            Number(page) || 1,
            Number(limit) || 10,
        );
        return {
            success: true,
            logs: result.logs,
            pagination: {
                page: result.page,
                perPage: result.perPage,
                totalLogs: result.totalLogs,
                hasMore: result.hasMore,
                hardLimit: result.hardLimit,
            }
        };
    }

    @Get('withdraw-limits')
    async getWithdrawLimits() {
        const limits = await this.adminService.getWithdrawLimits();
        return { success: true, withdrawLimits: limits };
    }

    @Post('withdraw-limits')
    async updateWithdrawLimit(@Body() body: { coin: string, limit: number }) {
        if (!body.coin || body.limit === undefined) return { error: 'Missing parameters' };
        const limits = await this.adminService.updateWithdrawLimit(body.coin, body.limit);
        return { success: true, withdrawLimits: limits };
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

    // ──────────────────────────────────────────────────────────────────
    // Base Casino Dashboard — Zero-Sum Circular Treasury
    // ──────────────────────────────────────────────────────────────────

    @Get('base-casino/stats')
    async getBaseCasinoStats() {
        const stats = await this.circularCasino.getDashboardStats();
        const topWhales = await this.circularCasino.getTop5WhalesByNetEquity();
        return { success: true, treasury: stats.adminTreasury, circularPool: stats.circularPool, burned: stats.burned, taxThisCycle: stats.taxThisCycle, params: stats.params, liveImpactLog: stats.liveImpactLog, dailySnapshots30D: stats.dailySnapshots30D, monthlyBook: stats.monthlyBook, topWhales };
    }

    @Get('base-casino/top-whales')
    async getTopWhales() {
        const data = await this.circularCasino.getTop5WhalesByNetEquity();
        return { success: true, whales: data };
    }

    @Post('base-casino/params')
    async updateBaseCasinoParams(@Body() body: Record<string, any>) {
        if (!body || typeof body !== 'object') return { error: 'Invalid payload' };
        const safeNumbers: Record<string, number> = {};
        for (const [k, v] of Object.entries(body)) {
            if (typeof v === 'number' && Number.isFinite(v)) safeNumbers[k] = v;
        }
        await this.circularCasino.updateParams(safeNumbers);
        const stats = await this.circularCasino.getDashboardStats();
        return { success: true, params: stats.params, treasury: stats.adminTreasury, circularPool: stats.circularPool };
    }

    @Post('base-casino/close-cycle')
    async closeCurrentCycle() {
        await this.circularCasino.closeCurrentCycleAndStartNew();
        const stats = await this.circularCasino.getDashboardStats();
        return { success: true, monthlyBook: stats.monthlyBook, treasury: stats.adminTreasury };
    }
}
