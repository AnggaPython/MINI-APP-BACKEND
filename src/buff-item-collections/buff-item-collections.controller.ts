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

  // ── Grants ───────────────────────────────────────────────────────────────
  //
  // POST /buff-collections/grant and /grant-random were REMOVED. Item creation
  // is a server-side privilege: case-box, miner-stone and auction-house call
  // BuffItemCollectionsService directly, and no frontend file ever called these
  // two routes. Exposing them let any authenticated player mint any buff item
  // (grant-random even honoured a client-chosen `preferredRarity`), which also
  // defeated the mining anti-cheat damage ceiling.
  //
  // If a client-triggered grant is ever required (e.g. a promo code), implement
  // it as POST /buff-collections/claim-grant { voucherId } where the voucher
  // document is created server-side, is single-use, and is marked consumed in
  // the same atomic update that pushes the item into the collection.
}
