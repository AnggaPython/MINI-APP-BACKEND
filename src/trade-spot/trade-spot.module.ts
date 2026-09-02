import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TradeSpotService } from "./trade-spot.service";
import { TradeSpotController } from "./trade-spot.controller";
import { MarketMakerService } from "./market-maker.service";
import { AssetRegistryService } from "./asset-registry.service";
import { Trade, TradeSchema } from "./schemas/trade.schema";
import { LiquidityPool, LiquidityPoolSchema } from "./schemas/pool.schema";
import { OpenOrder, OpenOrderSchema } from "./schemas/open-order.schema";
import { AssetRegistry, AssetRegistrySchema } from "./schemas/asset-registry.schema";
import { PendingTpSl, PendingTpSlSchema } from "./schemas/pending-tp-sl.schema";
import { SseService } from "./sse.service";
import { ItemTradeService } from "./item-trade.service";
import { User, UserSchema } from "../users/schemas/user.schema";
import { BuffItemCollectionsModule } from "../buff-item-collections/buff-item-collections.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: LiquidityPool.name, schema: LiquidityPoolSchema },
      { name: OpenOrder.name, schema: OpenOrderSchema },
      { name: AssetRegistry.name, schema: AssetRegistrySchema },
      { name: PendingTpSl.name, schema: PendingTpSlSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BuffItemCollectionsModule,
  ],
  controllers: [TradeSpotController],
  providers: [TradeSpotService, MarketMakerService, AssetRegistryService, SseService, ItemTradeService],
  exports: [TradeSpotService, MarketMakerService, AssetRegistryService, SseService, ItemTradeService],
})
export class TradeSpotModule {}
