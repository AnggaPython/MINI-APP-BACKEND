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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
