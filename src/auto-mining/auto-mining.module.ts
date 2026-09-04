import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AutoMiningService } from "./auto-mining.service";
import { AutoMiningController } from "./auto-mining.controller";
import {
  AutoMiningSub,
  AutoMiningSubSchema,
  AutoMiningDay,
  AutoMiningDaySchema,
} from "./schemas/auto-mining.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import {
  MiningStone,
  MiningStoneSchema,
} from "../miner-stone/schemas/mining-stone.schema";
import { CaseBox, CaseBoxSchema } from "../case-box/schemas/case-box.schema";
import { MinerStoneModule } from "../miner-stone/miner-stone.module";
import { CaseBoxModule } from "../case-box/case-box.module";
import { BuffItemCollectionsModule } from "../buff-item-collections/buff-item-collections.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AutoMiningSub.name, schema: AutoMiningSubSchema },
      { name: AutoMiningDay.name, schema: AutoMiningDaySchema },
      { name: User.name, schema: UserSchema },
      { name: MiningStone.name, schema: MiningStoneSchema },
      { name: CaseBox.name, schema: CaseBoxSchema },
    ]),
    MinerStoneModule,
    CaseBoxModule,
    BuffItemCollectionsModule,
  ],
  controllers: [AutoMiningController],
  providers: [AutoMiningService],
  exports: [AutoMiningService],
})
export class AutoMiningModule {}
