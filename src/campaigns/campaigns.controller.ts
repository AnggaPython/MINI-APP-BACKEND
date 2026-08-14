import { Controller, Post, Body, Get, Param, Query } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";

@Controller("campaigns")
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  async createCampaign(@Body() data: any) {
    return this.campaignsService.createCampaign(data);
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
    @Body("telegramId") telegramId: string,
    @Body("campaignId") campaignId: string,
  ) {
    if (!telegramId || !campaignId)
      return { success: false, error: "Missing params" };
    return this.campaignsService.startTask(telegramId, campaignId);
  }

  @Post("complete-task")
  async completeTask(
    @Body("telegramId") telegramId: string,
    @Body("campaignId") campaignId: string,
  ) {
    if (!telegramId || !campaignId)
      return { success: false, error: "Missing params" };
    return this.campaignsService.completeTask(telegramId, campaignId);
  }

  @Post(":id")
  async updateCampaign(@Param("id") id: string, @Body() data: any) {
    return this.campaignsService.updateCampaign(id, data);
  }

  @Post("add-budget/:id")
  async addBudget(
    @Param("id") id: string,
    @Body("telegramId") telegramId: string,
    @Body("amount") amount: number,
  ) {
    if (!telegramId || !amount)
      return { success: false, error: "Missing parameters" };
    return this.campaignsService.addBudget(id, Number(amount), telegramId);
  }
}
