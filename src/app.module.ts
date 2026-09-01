import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ScheduleModule } from "@nestjs/schedule";
import { UsersModule } from "./users/users.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { BankModule } from "./bank/bank.module";
import { AchievementsModule } from "./achievements/achievements.module";
import { PaymentModule } from "./payment/payment.module";
import { HistoryModule } from "./history/history.module";
import { AdminModule } from "./admin/admin.module";
import { BotModule } from "./bot/bot.module";
import { MinerStoneModule } from "./miner-stone/miner-stone.module";
import { TradeSpotModule } from "./trade-spot/trade-spot.module";
import { CaseBoxModule } from "./case-box/case-box.module";
import { BuffItemCollectionsModule } from "./buff-item-collections/buff-item-collections.module";
import { AuctionHouseModule } from "./auction-house/auction-house.module";
import { LevelingModule } from "./leveling-miner/leveling.module";
import { PickaxeUpgradeModule } from "./pickaxe-upgraded/pickaxe-upgrade.module";
import { FragmentModule } from "./fragment/fragment.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    CampaignsModule,
    BankModule,
    AchievementsModule,
    PaymentModule,
    HistoryModule,
    AdminModule,
    BotModule,
    MinerStoneModule,
    TradeSpotModule,
    CaseBoxModule,
    BuffItemCollectionsModule,
    AuctionHouseModule,
    LevelingModule,
    PickaxeUpgradeModule,
    FragmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
