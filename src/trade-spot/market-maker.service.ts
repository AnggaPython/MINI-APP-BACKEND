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
 *   • Every `botIntervalMinutes` (default 15, admin-tunable) it prints 10
 *     trades — 5 buys and 5 sells — with random-but-sensible amounts.
 *   • Every execution is priced at the real-time MIDDLE of the spread
 *     (which itself drifts within a tight 0.148–0.151 band around the
 *     1 ELIXCOIN ≈ 0.15 ELIXIR reference). Because buys and sells are symmetric
 *     at the same mid, the bot has zero directional bias — it can never pump
 *     or dump the price, so it never harms users.   *   • The platform keeps the 1.5% fee on every one of these prints.
 *
 * The scheduler is config-driven: admin can toggle `botEnabled` and change
 * `botIntervalMinutes` on the liquidity pool at any time, and the 10s tick
 * picks the new settings up without a restart. `runNow()` lets the admin
 * force a cycle immediately.
 */
@Injectable()
export class MarketMakerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly tradeSpotService: TradeSpotService) { }

  onModuleInit() {
    // Boot cycle only when the schedule allows (e.g. fresh pool with no last
    // run), then a lightweight 10s tick that obeys the current config.
    this.tick().catch((e) =>
      console.error("[MM Bot] initial tick failed:", e?.message),
    );
    this.intervalId = setInterval(() => {
      this.tick().catch((e) =>
        console.error("[MM Bot] tick failed:", e?.message),
      );
    }, 10_000);
    console.log(
      "[MM Bot] armed — 10 trades (5 buy / 5 sell) per cycle, config-driven cooldown (default 15 min), trades priced at the real-time mid",
    );
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Scheduler tick: read the pool config and run a cycle only when the
   * bot is enabled and the cooldown has elapsed since the last run.
   */
  private async tick() {
    const pool = await this.tradeSpotService.getPool();
    if (pool.botEnabled === false) return;
    const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
    const last = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : 0;
    if (Date.now() - last >= intervalMs) {
      await this.runCycle();
    }
  }

  /**
   * Run one full bot cycle right now (admin "Run Now" trigger).
   * Never overlaps an in-flight cycle; the cycle itself stamps lastBotRunAt,
   * so a forced run also resets the cooldown clock.
   */
  async runNow(): Promise<{ ran: boolean; count: number }> {
    if (this.running) return { ran: false, count: 0 };
    const count = await this.runCycle();
    return { ran: true, count };
  }

  /** One bot cycle: drift mid → fill crossed user limits → print volume. */
  async runCycle(): Promise<number> {
    if (this.running) return 0; // never overlap cycles
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
      return count;
    } finally {
      this.running = false;
    }
  }
}
