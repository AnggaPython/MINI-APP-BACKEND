import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { AuctionHouseService } from "./auction-house.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("auction-house")
export class AuctionHouseController {
  constructor(private readonly auctionService: AuctionHouseService) {}

  /**
   * POST /auction-house/list — Create a listing.
   * Body: { buffId, price }
   */
  @Post("list")
  async createListing(
    @User("telegramId") telegramId: string,
    @Body() body: { buffId: string; price: number },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.auctionService.createListing(telegramId, body.buffId, body.price);
  }

  /**
   * POST /auction-house/buy — Buy a listing.
   * Body: { auctionId }
   */
  @Post("buy")
  async buyListing(
    @User("telegramId") telegramId: string,
    @Body() body: { auctionId: string },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.auctionService.buyListing(telegramId, body.auctionId);
  }

  /**
   * POST /auction-house/cancel — Cancel a listing.
   * Body: { auctionId }
   */
  @Post("cancel")
  async cancelListing(
    @User("telegramId") telegramId: string,
    @Body() body: { auctionId: string },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.auctionService.cancelListing(telegramId, body.auctionId);
  }

  /**
   * GET /auction-house/browse — Browse marketplace.
   * Query: search, buffType, rarity, sort, page, limit
   */
  @Get("browse")
  async browse(
    @User("telegramId") telegramId: string,
    @Query() query: {
      search?: string;
      buffType?: string;
      rarity?: string;
      sort?: string;
      page?: string;
      limit?: string;
    },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.auctionService.browse({
      search: query.search,
      buffType: query.buffType,
      rarity: query.rarity,
      sort: query.sort,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    });
  }

  /**
   * GET /auction-house/my-listings — Get user's listings.
   */
  @Get("my-listings")
  async myListings(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.auctionService.myListings(telegramId);
  }

  /**
   * GET /auction-house/stats — Get marketplace statistics.
   */
  @Get("stats")
  async getStats(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return this.auctionService.getStats();
  }
}
