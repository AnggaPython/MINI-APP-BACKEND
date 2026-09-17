import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Logger,
} from "@nestjs/common";
import { AutoMiningService } from "./auto-mining.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("auto-mining")
export class AutoMiningController {
  private readonly logger = new Logger(AutoMiningController.name);

  constructor(private readonly autoMiningService: AutoMiningService) {}

  /** Live plan state + today's quota usage. */
  @Get("status")
  async status(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.autoMiningService.status(telegramId);
  }

  /** Earnings report: ?days=1|7|30 (runs, earnings, ROI). */
  @Get("stats")
  async stats(
    @User("telegramId") telegramId: string,
    @Query("days") days?: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.autoMiningService.stats(telegramId, Number(days) || 7);
  }

  /** Buy the 30-day plan for 250,000 ELIXIR. */
  @Post("subscribe")
  async subscribe(
    @User("telegramId") telegramId: string,
    @Body()
    body: {
      target?: string;
      splitStonePct?: number;
      startDate?: string;
      stopDate?: string;
      claimMode?: string;
    },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    try {
      return await this.autoMiningService.subscribe(telegramId, body || {});
    } catch (err) {
      // Last-resort net: a throw here becomes an opaque HTTP 500 on the
      // client. Log the full stack server-side and explain instead.
      this.logger.error(
        `POST /auto-mining/subscribe crashed: ${(err as Error)?.stack || err}`,
      );
      return {
        success: false,
        error: `Subscribe failed: ${(err as Error)?.message || "unexpected server error"}`,
      };
    }
  }

  /** Pause / resume the autopilot (plan stays). */
  @Post("toggle")
  async toggle(
    @User("telegramId") telegramId: string,
    @Body() body: { on?: boolean },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.autoMiningService.toggle(telegramId, body?.on !== false);
  }

  /** Cancel the plan (no refund). */
  @Post("cancel")
  async cancel(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.autoMiningService.cancel(telegramId);
  }
}
