import { Controller, Get, Post, Body } from "@nestjs/common";
import { PickaxeUpgradeService } from "./pickaxe-upgrade.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("pickaxe-upgrade")
export class PickaxeUpgradeController {
  constructor(private readonly upgradeService: PickaxeUpgradeService) {}

  /** GET /pickaxe-upgrade/status — upgrade status for all pickaxes */
  @Get("status")
  async getUpgradeStatus(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.upgradeService.getUpgradeStatus(telegramId);
  }

  /** POST /pickaxe-upgrade/upgrade — upgrade a pickaxe to next level */
  @Post("upgrade")
  async upgradePickaxe(
    @User("telegramId") telegramId: string,
    @Body() body: { tier?: string },
  ): Promise<any> {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    if (!body?.tier) return { success: false, error: "Missing tier" };
    return await this.upgradeService.upgradePickaxe(telegramId, String(body.tier));
  }

  /** POST /pickaxe-upgrade/skin — equip an unlocked milestone skin (visual only) */
  @Post("skin")
  async setSkin(
    @User("telegramId") telegramId: string,
    @Body() body: { tier?: string; skin?: string },
  ): Promise<any> {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    if (!body?.tier || !body?.skin) return { success: false, error: "Missing tier or skin" };
    return await this.upgradeService.setActiveSkin(telegramId, String(body.tier), String(body.skin));
  }
}
