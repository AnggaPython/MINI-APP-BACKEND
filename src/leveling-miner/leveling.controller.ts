import { Controller, Get, Post } from "@nestjs/common";
import { LevelingService } from "./leveling.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("leveling")
export class LevelingController {
  constructor(private readonly levelingService: LevelingService) {}

  /** GET /leveling/me — current level, XP, and progress */
  @Get("me")
  async getMyLevel(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.levelingService.getUserLevel(telegramId);
  }

  /** GET /leveling/benefits — all level benefits & rewards */
  @Get("benefits")
  async getBenefits() {
    return await this.levelingService.getLevelBenefits();
  }

  /** POST /leveling/craft — unlock a milestone level using materials */
  @Post("craft")
  async craftLevel(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.levelingService.craftLevel(telegramId);
  }
}
