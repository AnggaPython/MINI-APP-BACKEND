import { Controller, Get, Post, Query, Param, Body } from "@nestjs/common";
import { MarketplaceService } from "./marketplace.service";

@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /** Get all marketplace items with optional filters */
  @Get("items")
  async getItems(
    @Query("type") type?: string,
    @Query("rarity") rarity?: string,
    @Query("search") search?: string,
  ) {
    return this.marketplaceService.getMarketplaceItems({
      itemType: type,
      rarity,
      search,
    });
  }

  /** Get a single marketplace item */
  @Get("items/:itemId")
  async getItem(@Param("itemId") itemId: string) {
    return this.marketplaceService.getMarketplaceItem(itemId);
  }

  /** Get marketplace stats */
  @Get("stats")
  async getStats() {
    return this.marketplaceService.getMarketplaceStats();
  }
}
