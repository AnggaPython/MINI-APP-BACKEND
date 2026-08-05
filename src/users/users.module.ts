import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { ReferralLog, ReferralLogSchema } from './schemas/referral-log.schema';
import { HiLoBet, HiLoBetSchema } from './schemas/hilo-bet.schema';
import { AchievementsModule } from '../achievements/achievements.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ReferralLog.name, schema: ReferralLogSchema },
      { name: HiLoBet.name, schema: HiLoBetSchema }
    ]),
    forwardRef(() => AchievementsModule),
    forwardRef(() => AdminModule)
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }
