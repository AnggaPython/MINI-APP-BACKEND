import { Controller, Get, Post, Body } from "@nestjs/common";
import { CaseBoxService } from "./case-box.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("case-box")
export class CaseBoxController {
  constructor(private readonly caseBoxService: CaseBoxService) { }

  /**
   * Spawn a new case — the ONLY read call of the open loop.
   * Server rolls tier + maxHp via server-side HMAC RNG and returns the unique
   * database ID for this case. Called exactly once per case.
   */
  @Get("spawn")
  async spawn(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.caseBoxService.spawn(telegramId);
  }

  /**
   * Break the lock & open the case. Server rolls the multi-layer RNG
   * (30% MATERIAL / 35% ZONK / 35% ELIXCOIN → 70/22/8 rarity; ELIXCOIN band
   * scales by case tier: COMMON 100–500, MEDIUM 300–1,200, RARE 800–3,000).
   * MEDIUM/RARE cases require a Monetag S2S ad ticket before the lock breaks.
   * Credits atomically — a replay can never double-pay.
   */
  /**
   * Check if a case still exists and is active.
   * Lightweight verification used by the frontend to validate
   * a case restored from localStorage before the user starts hitting it.
   */
  @Post("status")
  async checkStatus(
    @User("telegramId") telegramId: string,
    @Body("caseId") caseId: string,
  ) {
    if (!caseId) return { success: false, error: "Missing caseId" };
    return await this.caseBoxService.getStatus(telegramId, caseId);
  }

  @Post("destroy")
  async destroyCase(
    @User("telegramId") telegramId: string,
    @Body("caseId") caseId: string,
  ) {
    if (!caseId) return { success: false, error: "Missing caseId" };
    return await this.caseBoxService.destroy(telegramId, caseId);
  }

  @Post("claim")
  async claimCase(
    @User("telegramId") telegramId: string,
    @Body("caseId") caseId: string,
  ) {
    if (!caseId) return { success: false, error: "Missing caseId parameter" };
    return await this.caseBoxService.claimCase(caseId, telegramId);
  }

  /**
   * Opened case history (tier, outcome, loot) for the History tab.
   * Read-only; opened cases are retained for 30 days by the TTL index.
   */
  @Get("history")
  async history(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.caseBoxService.history(telegramId);
  }
}
