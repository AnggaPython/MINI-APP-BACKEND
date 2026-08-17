import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { TradeSpotService } from "./trade-spot.service";

/**
 * Market-maker bot for ELIXIR/ELIXCOIN.
 *
 * Runs in the background and NEVER touches the user-facing order book or any
 * user account. It only creates its own trade history + volume against the
 * platform liquidity pool:
 *
 *   • Every 5 minutes (plus once at boot) it prints 10 trades — 5 buys and
 *     5 sells — with random-but-sensible amounts.
 *   • Every execution is priced at the real-time MIDDLE of the spread
 *     (which itself drifts within a tight 9.5–10.5 band around the
 *     1 ELIXIR = 10 ELIXCOIN reference). Because buys and sells are symmetric
 *     at the same mid, the bot has zero directional bias — it can never pump
 *     or dump the price, so it never harms users.
 *   • The platform keeps the 2.5% fee on every one of these prints.
 */
@Injectable()
export class MarketMakerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly tradeSpotService: TradeSpotService) {}

  onModuleInit() {
    // Seed the market with a first cycle immediately so the page is never empty.
    this.runCycle().catch((e) =>
      console.error("[MM Bot] initial cycle failed:", e?.message),
    );
    this.intervalId = setInterval(() => {
      this.runCycle().catch((e) =>
        console.error("[MM Bot] cycle failed:", e?.message),
      );
    }, 5 * 60 * 1000); // 5-minute cooldown
    console.log(
      "[MM Bot] armed — 10 trades (5 buy / 5 sell) every 5 minutes at the real-time mid price",
    );
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  async runCycle() {
    if (this.running) return; // never overlap cycles
    this.running = true;
    try {
      // 1. Let the market breathe (bounded random walk of the mid).
      await this.tradeSpotService.driftMid();
      // 2. Fill any resting user limit orders the new price has crossed.
      const fills = await this.tradeSpotService.matchOpenOrders();
      // 3. Print the bot's own volume at the fresh mid.
      const { count } = await this.tradeSpotService.botCycle();
      console.log(
        `[MM Bot] cycle done — ${count} trades (mid ${(
          await this.tradeSpotService.getPool()
        ).lastMid.toFixed(8)}), ${fills.length} user limit order(s) filled`,
      );
    } finally {
      this.running = false;
    }
  }
}
