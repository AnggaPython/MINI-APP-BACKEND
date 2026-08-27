import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { TradeSpotService } from "./trade-spot.service";
import { MINERAL_INITIAL_RATES } from "./trade-spot.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("trade-spot")
export class TradeSpotController {
  constructor(private readonly tradeSpotService: TradeSpotService) { }

  /** All available trading pairs from MINERAL_INITIAL_RATES. */
  @Get("pairs")
  async pairs() {
    const pairs = Object.keys(MINERAL_INITIAL_RATES).sort();
    return { success: true, pairs };
  }

  /** Real-time ticker: last price, 24h change/high/low/volume, fee & spread. */
  @Get("ticker")
  async ticker(@Query("pair") pair?: string) {
    return this.tradeSpotService.getTicker(pair);
  }

  /** Bulk real-time tickers */
  @Post("tickers")
  async tickers(@Body() body: { pairs?: string[] }) {
    if (!body?.pairs || !Array.isArray(body.pairs)) return { success: false, tickers: [] };
    const tickers = await this.tradeSpotService.getTickers(body.pairs);
    return { success: true, tickers };
  }

  /** Order book ladder (asks/bids) around the real-time mid — display data. */
  @Get("orderbook")
  async orderbook(
    @User("telegramId") telegramId: string,
    @Query("depth") depth?: string,
    @Query("pair") pair?: string,
  ) {
    return this.tradeSpotService.getOrderBook(Number(depth) || 10, pair, telegramId);
  }

  /** Recent market trades — the live tape (bot + user fills). */
  @Get("trades")
  async trades(@Query("limit") limit?: string, @Query("pair") pair?: string) {
    return this.tradeSpotService.getTrades(Number(limit) || 30, pair);
  }

  /** Market-maker + platform pool stats (legacy Bots-tab payload). */
  @Get("stats")
  async stats(@Query("pair") pair?: string) {
    return this.tradeSpotService.getStats(pair);
  }

  /** INFO panel: 24h totals + lifetime + chart data for ELIXIR & ELIXCOIN. */
  @Get("info")
  async info(@Query("pair") pair?: string) {
    return this.tradeSpotService.getInfo(pair);
  }

  /** The caller's tradable balances (ELIXIR + ELIXCOIN). */
  @Get("holdings")
  async holdings(@User("telegramId") telegramId: string, @Query("pair") pair?: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.tradeSpotService.getHoldings(telegramId, pair);
  }

  /**
   * Max tradeable amount for the caller, accounting for anti-whale slippage.
   * Returns the maximum BASE amount the user can BUY (or SELL) without
   * the backend rejecting for insufficient balance.
   */
  @Get("max-tradeable")
  async maxTradeable(
    @User("telegramId") telegramId: string,
    @Query("pair") pair?: string,
    @Query("side") side?: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.tradeSpotService.getMaxTradeable(telegramId, pair, side);
  }

  /** The caller's resting limit orders. */
  @Get("open-orders")
  async openOrders(@User("telegramId") telegramId: string, @Query("pair") pair?: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.tradeSpotService.getOpenOrders(telegramId, pair);
  }

  /**
   * The caller's own trade history — newest first, 5 per page. The frontend
   * "Load more" button keeps fetching the next page (5 more rows each).
   */
  @Get("user-trades")
  async userTrades(
    @User("telegramId") telegramId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("pair") pair?: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.tradeSpotService.getUserTrades(
      telegramId,
      Number(page) || 1,
      Number(limit) || 5,
      pair,
    );
  }

  /**
   * Place an order — market (instant) or limit (instant if crossing, else rests).
   * Server-authoritative: balances are guarded + moved in ONE atomic update,
   * the platform pool is the counterparty, and 1.5% fee + spread slip accrue
   * to the platform on every fill.
   */
  @Post("order")
  async placeOrder(
    @User("telegramId") telegramId: string,
    @Body() body: { side?: string; type?: string; amount?: number; price?: number },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.tradeSpotService.placeOrder(telegramId, body || {});
  }

  /** Cancel one of the caller's resting limit orders. */
  @Post("cancel-order")
  async cancelOrder(
    @User("telegramId") telegramId: string,
    @Body() body: { orderId?: string },
  ) {
    if (!telegramId || !body?.orderId) {
      return { success: false, error: "Missing orderId" };
    }
    return this.tradeSpotService.cancelOrder(telegramId, String(body.orderId));
  }
}
