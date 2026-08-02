import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { ReferralLog, ReferralLogSchema } from './schemas/referral-log.schema';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ReferralLog.name, schema: ReferralLogSchema }
    ]),
    forwardRef(() => AchievementsModule)
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }
