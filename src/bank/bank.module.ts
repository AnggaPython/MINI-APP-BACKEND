import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BankService } from "./bank.service";
import { BankController } from "./bank.controller";
import { Stake, StakeSchema } from "./schemas/stake.schema";
import { BankLog, BankLogSchema } from "./schemas/bank-log.schema";
import { UsersModule } from "../users/users.module";
import { AchievementsModule } from "../achievements/achievements.module";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Stake.name, schema: StakeSchema },
      { name: BankLog.name, schema: BankLogSchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => AchievementsModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [BankController],
  providers: [BankService],
  exports: [BankService],
})
export class BankModule {}
