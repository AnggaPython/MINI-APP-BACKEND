import { Controller, Get, Param, Query } from "@nestjs/common";
import { HistoryService } from "./history.service";

@Controller("history")
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get(":telegramId")
  async getUnifiedHistory(
    @Param("telegramId") telegramId: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10",
    @Query("filter") filter: string = "All",
  ) {
    return await this.historyService.getAggregatedHistory(
      telegramId,
      parseInt(page, 10),
      parseInt(limit, 10),
      filter,
    );
  }
}
