import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LevelingService } from "./leveling.service";
import { LevelingController } from "./leveling.controller";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [LevelingController],
  providers: [LevelingService],
  exports: [LevelingService],
})
export class LevelingModule {}
