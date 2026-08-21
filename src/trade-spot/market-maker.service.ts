import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { TradeSpotService } from "./trade-spot.service";

/**
 * Market-maker bot for multi-pair platforms.
 *
 * Runs in the background and NEVER touches the user-facing order book or any
 * user account. It only creates its own trade history + volume against the
 * platform liquidity pool of the active pairs.
 */
@Injectable()
export class MarketMakerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;
  private running = new Set<string>();

  constructor(private readonly tradeSpotService: TradeSpotService) { }

  onModuleInit() {
    this.tick().catch((e) =>
      console.error("[MM Bot] initial tick failed:", e?.message),
    );
    this.intervalId = setInterval(() => {
      this.tick().catch((e) =>
        console.error("[MM Bot] tick failed:", e?.message),
      );
    }, 10_000);
    console.log(
      "[MM Bot] armed — running cycles concurrently for all botEnabled pools",
    );
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Scheduler tick: read all active pools and run a cycle only when the
   * bot is enabled and the cooldown has elapsed since the last run.
   */
  private async tick() {
    const pools = await this.tradeSpotService.getAllActivePools();
    for (const pool of pools) {
      if (pool.botEnabled === false) continue;
      const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
      const last = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : 0;
      if (Date.now() - last >= intervalMs) {
        // intentionally not awaiting the cycle here to allow parallel processing
        // for multiple pairs, as they isolate neatly in mongodb
        this.runCycle(pool.pair).catch(e => console.error(`[MM Bot] cycle failed for ${pool.pair}:`, e?.message));
      }
    }
  }

  /**
   * Run one full bot cycle right now (admin "Run Now" trigger).
   */
  async runNow(pair: string = "ELIXCOIN/ELIXIR"): Promise<{ ran: boolean; count: number }> {
    if (this.running.has(pair)) return { ran: false, count: 0 };
    const count = await this.runCycle(pair);
    return { ran: true, count };
  }

  /** One bot cycle: drift mid → fill crossed user limits → print volume. */
  async runCycle(pair: string = "ELIXCOIN/ELIXIR"): Promise<number> {
    if (this.running.has(pair)) return 0; // never overlap cycles for same pair
    this.running.add(pair);
    try {
      await this.tradeSpotService.driftMid(pair);
      const fills = await this.tradeSpotService.matchOpenOrders(pair);
      const { count } = await this.tradeSpotService.botCycle(pair);

      const pool = await this.tradeSpotService.getPool(pair);
      console.log(
        `[MM Bot] cycle done for ${pair} — ${count} trades (mid ${pool.lastMid.toFixed(8)}), ${fills.length} user limit order(s) filled`,
      );
      return count;
    } finally {
      this.running.delete(pair);
    }
  }
}
