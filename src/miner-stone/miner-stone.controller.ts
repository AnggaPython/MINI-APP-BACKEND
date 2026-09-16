import { Controller, Get, Post, Body } from "@nestjs/common";
import { MinerStoneService } from "./miner-stone.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("miner-stone")
export class MinerStoneController {
  constructor(private readonly minerStoneService: MinerStoneService) {}

  /**
   * Spawn a new stone — the ONLY read call of the game loop.
   * Server rolls tier + MPa via server-side HMAC RNG and returns the unique
   * database ID for this stone. Called exactly once per stone.
   */
  @Get("spawn")
  async spawn(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.minerStoneService.spawn(telegramId);
  }

  /**
   * Rotate session — abandon the current active stone (NO loot, NO XP) and
   * spawn a fresh one. Called when the client's session countdown ends, so
   * the old session is replaced even mid-HP without destroying first.
   */
  @Post("rotate")
  async rotate(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.minerStoneService.rotate(telegramId);
  }

  /**
   * Claimed stone history (tier, MPa, rewards) for the History tab.
   * Read-only; claimed stones are retained for 30 days by the TTL index.
   */
  @Get("history")
  async history(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.minerStoneService.history(telegramId);
  }

  /**
   * Repair a pickaxe by spending resources (IRON/SILVER/GOLD/DIAMOND per tier).
   * Server-authoritative: validates ownership + balance and deducts atomically;
   * the client only resets its local durability display after a success.
   */
  @Post("repair-pickaxe")
  async repairPickaxe(
    @User("telegramId") telegramId: string,
    @Body() body: { tier?: string },
  ) {
    if (!telegramId || !body?.tier) {
      return { success: false, error: "Missing tier" };
    }
    return await this.minerStoneService.repairPickaxe(
      telegramId,
      String(body.tier),
    );
  }

  /**
   * Server-authoritative durability (source of truth across refreshes and
   * devices; localStorage is only a write-through cache).
   */
  @Get("durability")
  async getDurability(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.minerStoneService.getDurability(telegramId);
  }

  /** Write-through sync from client (session boundaries / page hide). */
  @Post("durability/sync")
  async syncDurability(
    @User("telegramId") telegramId: string,
    @Body() body: { durability?: Record<string, number> },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.minerStoneService.syncDurability(telegramId, body?.durability || {});
  }

  /**
   * Destroy the stone & roll its loot — called exactly once, after the stone
   * is fully destroyed on the client. Only the stoneId travels; the server
   * derives tier + rewards (or ZONK) from its own stored data, and the loot
   * stays PENDING until the client commits it via /claim (SAVE or SELL).
   */
  @Post("destroy")
  async destroy(
    @User("telegramId") telegramId: string,
    @Body() body: { stoneId?: string },
  ) {
    if (!telegramId || !body?.stoneId) {
      return { success: false, error: "Missing stoneId" };
    }
    return await this.minerStoneService.destroy(telegramId, String(body.stoneId));
  }

  /**
   * Commit pending loot for a destroyed stone:
   *   action "save" → resources credited into the Bag (cryptoBalances)
   *   action "sell" → resources converted to ELIX COIN at server rates
   * Atomic + idempotent — each stone's loot can only be committed once.
   */
  @Post("claim")
  async claim(
    @User("telegramId") telegramId: string,
    @Body() body: { stoneId?: string; action?: string },
  ) {
    if (!telegramId || !body?.stoneId || !body?.action) {
      return { success: false, error: "Missing stoneId or action" };
    }
    return await this.minerStoneService.claimRewards(
      telegramId,
      String(body.stoneId),
      String(body.action),
    );
  }
}
