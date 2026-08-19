import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { BuffItemCollectionsService } from "./buff-item-collections.service";
import { User } from "../auth/telegram-user.decorator";
import { BuffType } from "./schemas/buff-item.schema";

@Controller("buff-collections")
export class BuffItemCollectionsController {
  constructor(private readonly service: BuffItemCollectionsService) {}

  // ── Public catalog ───────────────────────────────────────────────────────

  /** GET /buff-collections — all 160 buff items with metadata */
  @Get()
  async getAll() {
    return this.service.getAllBuffItems();
  }

  /** GET /buff-collections/:type — buff items for a specific type (ATK, ECONOMY, etc.) */
  @Get(":type")
  async getByType(@Param("type") type: string) {
    const buffType = type.toUpperCase() as BuffType;
    if (!["ATK", "ECONOMY", "DURABILITY", "DROPRATE"].includes(buffType)) {
      return { success: false, error: "Invalid buff type" };
    }
    return this.service.getBuffItemsByType(buffType);
  }

  // ── User collection ──────────────────────────────────────────────────────

  /** GET /buff-collections/user/me — get authenticated user's collection */
  @Get("user/me")
  async getMyCollection(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.service.getUserCollection(telegramId);
  }

  /** GET /buff-collections/user/totals — get computed buff totals for gameplay */
  @Get("user/totals")
  async getMyTotals(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.service.getUserBuffTotals(telegramId);
  }

  // ── Activate / Deactivate ────────────────────────────────────────────────

  /** POST /buff-collections/activate — equip a buff item */
  @Post("activate")
  async activate(
    @User("telegramId") telegramId: string,
    @Body("buffId") buffId: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    if (!buffId) return { success: false, error: "Missing buffId" };
    return this.service.activateBuff(telegramId, buffId);
  }

  /** POST /buff-collections/deactivate — unequip a buff item */
  @Post("deactivate")
  async deactivate(
    @User("telegramId") telegramId: string,
    @Body("buffId") buffId: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    if (!buffId) return { success: false, error: "Missing buffId" };
    return this.service.deactivateBuff(telegramId, buffId);
  }

  /** POST /buff-collections/activate-all/:type — equip all owned buffs of a type */
  @Post("activate-all/:type")
  async activateAllByType(
    @User("telegramId") telegramId: string,
    @Param("type") type: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    const buffType = type.toUpperCase() as BuffType;
    if (!["ATK", "ECONOMY", "DURABILITY", "DROPRATE"].includes(buffType)) {
      return { success: false, error: "Invalid buff type" };
    }
    return this.service.activateAllByType(telegramId, buffType);
  }

  // ── Grant (for loot system integration) ──────────────────────────────────

  /** POST /buff-collections/grant — grant a specific buff item to user */
  @Post("grant")
  async grant(
    @User("telegramId") telegramId: string,
    @Body("buffId") buffId: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    if (!buffId) return { success: false, error: "Missing buffId" };
    return this.service.grantBuffItem(telegramId, buffId);
  }

  /** POST /buff-collections/grant-random — grant a random buff based on drop weights */
  @Post("grant-random")
  async grantRandom(
    @User("telegramId") telegramId: string,
    @Body("preferredRarity") preferredRarity?: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.service.grantRandomBuff(
      telegramId,
      preferredRarity as any,
    );
  }
}
