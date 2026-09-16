import { Controller, Post, Body, Get, Param, Query } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("campaigns")
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  async createCampaign(
    @Body()
    data: {
      title: string;
      description: string;
      category: string;
      rewardPerClick: number;
      totalBudget: number;
      url?: string;
      oneUserLifetime?: boolean;
      autoRenew?: boolean;
      /** Ignored: the payer is always the authenticated session. */
      creatorTelegramId?: string;
    },
    @User("telegramId") telegramId: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.campaignsService.createCampaign({
      ...data,
      creatorTelegramId: telegramId,
    });
  }

  @Get("active")
  async getActiveCampaigns(@Query("telegramId") telegramId: string) {
    if (!telegramId) return { error: "Missing telegramId query param" };
    return this.campaignsService.getActiveCampaigns(telegramId);
  }

  @Get("user/:id")
  async getMyCampaigns(@Param("id") telegramId: string) {
    return this.campaignsService.getMyCampaigns(telegramId);
  }

  @Post("start-task")
  async startTask(
    @Body("campaignId") campaignId: string,
    @User("telegramId") telegramId: string,
  ) {
    if (!telegramId || !campaignId)
      return { success: false, error: "Missing params" };
    return this.campaignsService.startTask(telegramId, campaignId);
  }

  @Post("complete-task")
  async completeTask(
    @Body("campaignId") campaignId: string,
    @User("telegramId") telegramId: string,
  ) {
    if (!telegramId || !campaignId)
      return { success: false, error: "Missing params" };
    return this.campaignsService.completeTask(telegramId, campaignId);
  }

  @Post(":id")
  async updateCampaign(
    @Param("id") id: string,
    @Body() data: { title?: string; description?: string; url?: string },
    @User("telegramId") telegramId: string,
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.campaignsService.updateCampaign(id, telegramId, data);
  }

  @Post("add-budget/:id")
  async addBudget(
    @Param("id") id: string,
    @Body("amount") amount: number,
    @User("telegramId") telegramId: string,
  ) {
    if (!telegramId || !amount)
      return { success: false, error: "Missing parameters" };
    return this.campaignsService.addBudget(id, Number(amount), telegramId);
  }
}
