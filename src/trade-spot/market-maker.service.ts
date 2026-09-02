import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { TradeSpotService } from "./trade-spot.service";
import { CORE_BOT_PAIRS } from "./trade-pairs";
import { AssetRegistryService } from "./asset-registry.service";

/**
 * Market-maker bot for multi-pair platforms.
 *
 * Runs in the background and NEVER touches the user-facing order book or any
 * user account. It only creates its own trade history + volume against the
 * platform liquidity pool of the active pairs.
 *
 * RANDOM TIMING MODEL:
 * Each pool gets N trades per hour (default 10) scheduled at random times
 * within a 1-hour window. This prevents predictable bot patterns that
 * scalpers could exploit.
 */
@Injectable()
export class MarketMakerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketMakerService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private running = new Set<string>();

  /** Per-pair scheduled execution timestamps for the current hour window. */
  private schedules = new Map<string, number[]>();
  /** Per-pair hour window start timestamp. */
  private hourWindows = new Map<string, number>();
  /** Per-pair how many trades executed this hour. */
  private hourCounts = new Map<string, number>();

  constructor(
    private readonly tradeSpotService: TradeSpotService,
    private readonly assetRegistry: AssetRegistryService,
  ) { }

  async onModuleInit() {
    try {
      await this.assetRegistry.bootstrap();
      this.logger.log("[AssetRegistry] Bootstrap complete — cross-pair sync active");
    } catch (e: any) {
      this.logger.error(`[AssetRegistry] Bootstrap failed: ${e?.message}`);
    }

    this.tick().catch((e) =>
      this.logger.error(`[MM Bot] initial tick failed: ${e?.message}`),
    );
    this.intervalId = setInterval(() => {
      this.tick().catch((e) =>
        this.logger.error(`[MM Bot] tick failed: ${e?.message}`),
      );
    }, 10_000);
    this.logger.log(
      "[MM Bot] armed — random-timing model active for all botEnabled pools",
    );
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Generate N random timestamps within the next hour window.
   * Sorted ascending so they execute in chronological order.
   */
  private generateHourSchedule(tradesPerHour: number): number[] {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000; // 1 hour in ms
    const times: number[] = [];
    for (let i = 0; i < tradesPerHour; i++) {
      times.push(now + Math.random() * hourMs);
    }
    times.sort((a, b) => a - b);
    return times;
  }

  /**
   * Get or create the hour schedule for a pool.
   */
  private ensureSchedule(pair: string, tradesPerHour: number): void {
    const windowStart = this.hourWindows.get(pair) ?? 0;
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    // If window expired or no schedule exists, generate new one
    if (!this.schedules.has(pair) || now - windowStart >= hourMs) {
      this.schedules.set(pair, this.generateHourSchedule(tradesPerHour));
      this.hourWindows.set(pair, now);
      this.hourCounts.set(pair, 0);
      this.logger.log(
        `[MM Bot] ${pair}: new hour schedule — ${tradesPerHour} random trades in 60min`,
      );
    }
  }

  /**
   * Scheduler tick: check all active pools and execute any due trades.
   */
  private async tick() {
    this.tradeSpotService.clearDriftCycle();

    const pools = await this.tradeSpotService.getAllActivePools();
    for (const pool of pools) {
      if (pool.botEnabled === false) continue;

      const tradesPerHour = pool.botTradesPerCycle ?? 10;
      this.ensureSchedule(pool.pair, tradesPerHour);

      const schedule = this.schedules.get(pool.pair) ?? [];
      const done = this.hourCounts.get(pool.pair) ?? 0;
      const now = Date.now();

      // Execute all trades whose scheduled time has arrived
      let idx = done;
      while (idx < schedule.length && now >= schedule[idx]) {
        this.hourCounts.set(pool.pair, idx + 1);
        this.runCycle(pool.pair).catch(e =>
          console.error(`[MM Bot] cycle failed for ${pool.pair}:`, e?.message),
        );
        idx++;
      }
    }
  }

  /**
   * Admin: Get current schedule status for all pools.
   */
  getSchedules(): Record<string, {
    hourWindowStart: number;
    tradesDone: number;
    tradesTotal: number;
    nextExecutions: number[];
  }> {
    const result: Record<string, any> = {};
    for (const [pair, schedule] of this.schedules) {
      const windowStart = this.hourWindows.get(pair) ?? 0;
      const done = this.hourCounts.get(pair) ?? 0;
      const now = Date.now();
      const upcoming = schedule.filter(t => t > now).map(t => t - now); // ms until next
      result[pair] = {
        hourWindowStart: windowStart,
        tradesDone: done,
        tradesTotal: schedule.length,
        nextExecutions: upcoming, // ms until each remaining execution
      };
    }
    return result;
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
    if (this.running.has(pair)) return 0;
    this.running.add(pair);
    try {
      await this.tradeSpotService.driftMid(pair);
      const fills = await this.tradeSpotService.matchOpenOrders(pair);
      const { count } = await this.tradeSpotService.botCycle(pair);

      const pool = await this.tradeSpotService.getPool(pair);
      const done = this.hourCounts.get(pair) ?? 0;
      const total = (this.schedules.get(pair) ?? []).length;
      console.log(
        `[MM Bot] ${pair} — ${count} trades (mid ${pool.lastMid.toFixed(8)}), ${fills.length} user order(s) filled [hour ${done}/${total}]`,
      );
      return count;
    } finally {
      this.running.delete(pair);
    }
  }
}
