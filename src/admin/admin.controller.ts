import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { CircularCasinoService } from "./circular-casino.service";
import { UsersService } from "../users/users.service";
import { AdminAuthGuard } from "../auth/admin.guard";
import { Public } from "../auth/telegram-user.decorator";
import { TradeSpotService } from "../trade-spot/trade-spot.service";
import { MarketMakerService } from "../trade-spot/market-maker.service";

@Controller("admin")
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly circularCasino: CircularCasinoService,
    private readonly tradeSpotService: TradeSpotService,
    private readonly marketMakerService: MarketMakerService,
  ) {}

  @Public()
  @Post("login")
  async login(@Body() body: any, @Req() req: any) {
    if (!body.username || !body.password) {
      return { error: "Missing username or password" };
    }

    // Primitive IP parsing
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

    return await this.adminService.authenticate(
      body.username,
      body.password,
      ip as string,
    );
  }

  @Get("feed")
  async getFeed() {
    const stats = await this.usersService.getDashboardStatsAdmin();
    return { success: true, ...stats };
  }

  @Get("top-users")
  async getTopUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const result = await this.usersService.getTopUsersPaginated(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return { success: true, ...result };
  }

  @Get("profit-balances")
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
  @Get("profit-logs/monetag-top-users")
  async getMonetagTopUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const res = await this.adminService.getMonetagTopUsers(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return { success: true, ...res };
  }

  @Get("profit-logs")
  async getProfitLogs(
    @Query("coin") coin: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
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
      },
    };
  }

  @Get("withdraw-limits")
  async getWithdrawLimits() {
    const limits = await this.adminService.getWithdrawLimits();
    return { success: true, withdrawLimits: limits };
  }

  @Post("withdraw-limits")
  async updateWithdrawLimit(@Body() body: { coin: string; limit: number }) {
    if (!body.coin || body.limit === undefined)
      return { error: "Missing parameters" };
    const limits = await this.adminService.updateWithdrawLimit(
      body.coin,
      body.limit,
    );
    return { success: true, withdrawLimits: limits };
  }

  // --- User Interrogation Endpoints ---
  @Post("user/search")
  async searchUser(@Body("query") query: string) {
    if (!query) return { error: "Missing search query" };
    // Clean the '@' if the admin types it
    const cleanQuery = query.startsWith("@") ? query.substring(1) : query;
    const user = await this.usersService.searchUserForAdmin(cleanQuery);
    if (!user) return { error: "User not found" };
    return { success: true, user };
  }

  @Post("user/update-balance")
  async updateUserBalance(
    @Body()
    body: {
      telegramId: string;
      elixirBalance?: number;
      cryptoBalances?: Record<string, number>;
    },
  ) {
    if (!body.telegramId) return { error: "Missing telegramId" };
    const user = await this.usersService.updateUserBalanceAdmin(
      body.telegramId,
      body.elixirBalance,
      body.cryptoBalances,
    );
    if (!user) return { error: "User not found" };
    return { success: true, user };
  }

  @Post("user/ban")
  async banUser(@Body() body: { telegramId: string; isBanned: boolean }) {
    if (!body.telegramId || typeof body.isBanned !== "boolean")
      return { error: "Missing parameters" };
    const user = await this.usersService.setUserBanStatus(
      body.telegramId,
      body.isBanned,
    );
    if (!user) return { error: "User not found" };
    return { success: true, user };
  }

  // ──────────────────────────────────────────────────────────────────
  // Base Casino Dashboard — Zero-Sum Circular Treasury
  // ──────────────────────────────────────────────────────────────────

  @Get("base-casino/stats")
  async getBaseCasinoStats() {
    const stats = await this.circularCasino.getDashboardStats();
    const topWhales = await this.circularCasino.getTop5WhalesByNetEquity();
    return {
      success: true,
      treasury: stats.adminTreasury,
      circularPool: stats.circularPool,
      burned: stats.burned,
      taxThisCycle: stats.taxThisCycle,
      params: stats.params,
      liveImpactLog: stats.liveImpactLog,
      dailySnapshots30D: stats.dailySnapshots30D,
      monthlyBook: stats.monthlyBook,
      topWhales,
    };
  }

  @Get("base-casino/top-whales")
  async getTopWhales() {
    const data = await this.circularCasino.getTop5WhalesByNetEquity();
    return { success: true, whales: data };
  }

  @Post("base-casino/params")
  async updateBaseCasinoParams(@Body() body: Record<string, any>) {
    if (!body || typeof body !== "object") return { error: "Invalid payload" };
    const safeNumbers: Record<string, number> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "number" && Number.isFinite(v)) safeNumbers[k] = v;
    }
    await this.circularCasino.updateParams(safeNumbers);
    const stats = await this.circularCasino.getDashboardStats();
    return {
      success: true,
      params: stats.params,
      treasury: stats.adminTreasury,
      circularPool: stats.circularPool,
    };
  }

  @Post("base-casino/close-cycle")
  async closeCurrentCycle() {
    await this.circularCasino.closeCurrentCycleAndStartNew();
    const stats = await this.circularCasino.getDashboardStats();
    return {
      success: true,
      monthlyBook: stats.monthlyBook,
      treasury: stats.adminTreasury,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // Trade Spot — Market-Maker Bot control
  // Bot info & controls live HERE (admin-only), not in the user UI.
  // ──────────────────────────────────────────────────────────────────

  @Get("trade-spot/bot")
  async getTradeSpotBot() {
    return this.tradeSpotService.getBotStatus();
  }

  @Post("trade-spot/bot")
  async updateTradeSpotBot(
    @Body() body: { pair?: string; enabled?: boolean; intervalMinutes?: number; tradesPerCycle?: number },
  ) {
    return this.tradeSpotService.updateBotConfig(body || {});
  }

  @Post("trade-spot/bot/run-now")
  async runTradeSpotBotNow(@Body() body: { pair?: string }) {
    const pair = body?.pair || 'ELIXCOIN/ELIXIR';
    const res = await this.marketMakerService.runNow(pair);
    const status = await this.tradeSpotService.getBotStatus(pair);
    return {
      ...status,
      runNow: res,
    };
  }

  @Get("trade-spot/bot/schedules")
  async getBotSchedules() {
    return { success: true, schedules: this.marketMakerService.getSchedules() };
  }

  // ──────────────────────────────────────────────────────────────────
  // Admin Price Control — set bid/ask range per pair.
  // Bot MM will only trade within this range.
  // ──────────────────────────────────────────────────────────────────

  @Get("trade-spot/pools")
  async getAllPools() {
    const pools = await this.tradeSpotService.getAllPools();
    return { success: true, pools };
  }

  @Post("trade-spot/price-control")
  async setPriceControl(
    @Body() body: { pair: string; bidFloor: number; askCeiling: number },
  ) {
    if (!body.pair || !body.bidFloor || !body.askCeiling) {
      return { success: false, error: "Missing pair, bidFloor, or askCeiling" };
    }
    if (body.bidFloor >= body.askCeiling) {
      return { success: false, error: "bidFloor must be less than askCeiling" };
    }
    return this.tradeSpotService.setAdminPriceControl(
      body.pair,
      body.bidFloor,
      body.askCeiling,
    );
  }

  @Post("trade-spot/price-control/clear")
  async clearPriceControl(@Body() body: { pair: string }) {
    if (!body.pair) return { success: false, error: "Missing pair" };
    return this.tradeSpotService.clearAdminPriceControl(body.pair);
  }

  // ──────────────────────────────────────────────────────────────────
  // Admin Order Book Walls — synthetic depth for each pair.
  // ──────────────────────────────────────────────────────────────────

  @Post("trade-spot/walls")
  async setWalls(
    @Body() body: {
      pair: string;
      sellWalls?: { price: number; amount: number }[];
      buyWalls?: { price: number; amount: number }[];
    },
  ) {
    if (!body.pair) return { success: false, error: "Missing pair" };
    return this.tradeSpotService.setAdminWalls(
      body.pair,
      body.sellWalls,
      body.buyWalls,
    );
  }

  @Post("trade-spot/walls/clear")
  async clearWalls(@Body() body: { pair: string }) {
    if (!body.pair) return { success: false, error: "Missing pair" };
    return this.tradeSpotService.clearAdminWalls(body.pair);
  }
}
