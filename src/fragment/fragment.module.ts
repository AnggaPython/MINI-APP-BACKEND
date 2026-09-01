import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FragmentService } from "./fragment.service";
import { FragmentController } from "./fragment.controller";
import { User, UserSchema } from "../users/schemas/user.schema";
import {
  MineSwipeSession,
  MineSwipeSessionSchema,
} from "./schemas/mine-swipe-session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: MineSwipeSession.name, schema: MineSwipeSessionSchema },
    ]),
  ],
  controllers: [FragmentController],
  providers: [FragmentService],
  exports: [FragmentService],
})
export class FragmentModule {}
