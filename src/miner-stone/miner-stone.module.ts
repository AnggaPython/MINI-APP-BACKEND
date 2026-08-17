import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MinerStoneService } from "./miner-stone.service";
import { MinerStoneController } from "./miner-stone.controller";
import {
  MiningStone,
  MiningStoneSchema,
} from "./schemas/mining-stone.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MiningStone.name, schema: MiningStoneSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
  ],
  controllers: [MinerStoneController],
  providers: [MinerStoneService],
  exports: [MinerStoneService],
})
export class MinerStoneModule {}
