import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CaseBoxService } from "./case-box.service";
import { CaseBoxController } from "./case-box.controller";
import { CaseBox, CaseBoxSchema } from "./schemas/case-box.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CaseBox.name, schema: CaseBoxSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
  ],
  controllers: [CaseBoxController],
  providers: [CaseBoxService],
  exports: [CaseBoxService],
})
export class CaseBoxModule {}
