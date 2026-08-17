import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TradeSpotService } from "./trade-spot.service";
import { TradeSpotController } from "./trade-spot.controller";
import { MarketMakerService } from "./market-maker.service";
import { Trade, TradeSchema } from "./schemas/trade.schema";
import { LiquidityPool, LiquidityPoolSchema } from "./schemas/pool.schema";
import { OpenOrder, OpenOrderSchema } from "./schemas/open-order.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: LiquidityPool.name, schema: LiquidityPoolSchema },
      { name: OpenOrder.name, schema: OpenOrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TradeSpotController],
  providers: [TradeSpotService, MarketMakerService],
  exports: [TradeSpotService],
})
export class TradeSpotModule {}
