import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { TradeSpotService } from "./trade-spot.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("trade-spot")
export class TradeSpotController {
  constructor(private readonly tradeSpotService: TradeSpotService) {}

  /** Real-time ticker: last price, 24h change/high/low/volume, fee & spread. */
  @Get("ticker")
  async ticker() {
    return this.tradeSpotService.getTicker();
  }

  /** Order book ladder (asks/bids) around the real-time mid — display data. */
  @Get("orderbook")
  async orderbook(@Query("depth") depth?: string) {
    return this.tradeSpotService.getOrderBook(Number(depth) || 10);
  }

  /** Recent market trades — the live tape (bot + user fills). */
  @Get("trades")
  async trades(@Query("limit") limit?: string) {
    return this.tradeSpotService.getTrades(Number(limit) || 30);
  }

  /** Market-maker + platform pool stats for the Bots tab. */
  @Get("stats")
  async stats() {
    return this.tradeSpotService.getStats();
  }

  /** The caller's tradable balances (ELIXIR + ELIXCOIN). */
  @Get("holdings")
  async holdings(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.tradeSpotService.getHoldings(telegramId);
  }

  /** The caller's resting limit orders. */
  @Get("open-orders")
  async openOrders(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.tradeSpotService.getOpenOrders(telegramId);
  }

  /**
   * Place an order — market (instant) or limit (instant if crossing, else rests).
   * Server-authoritative: balances are guarded + moved in ONE atomic update,
   * the platform pool is the counterparty, and 2.5% fee + spread slip accrue
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
