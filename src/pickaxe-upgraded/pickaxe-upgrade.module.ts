import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PickaxeUpgradeService } from "./pickaxe-upgrade.service";
import { PickaxeUpgradeController } from "./pickaxe-upgrade.controller";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PickaxeUpgradeController],
  providers: [PickaxeUpgradeService],
  exports: [PickaxeUpgradeService],
})
export class PickaxeUpgradeModule {}
