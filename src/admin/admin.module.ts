import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CircularCasinoService } from './circular-casino.service';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { ProfitLog, ProfitLogSchema } from './schemas/profit-log.schema';
import { CircularTreasury, CircularTreasurySchema } from './schemas/circular-treasury.schema';
import { UserNetEquity, UserNetEquitySchema } from './schemas/user-net-equity.schema';
import { MonthlyBookCycle, MonthlyBookCycleSchema } from './schemas/monthly-book-cycle.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Admin.name, schema: AdminSchema },
            { name: ProfitLog.name, schema: ProfitLogSchema },
            { name: CircularTreasury.name, schema: CircularTreasurySchema },
            { name: UserNetEquity.name, schema: UserNetEquitySchema },
            { name: MonthlyBookCycle.name, schema: MonthlyBookCycleSchema },
            { name: User.name, schema: UserSchema }
        ]),
        forwardRef(() => UsersModule)
    ],
    controllers: [AdminController],
    providers: [AdminService, CircularCasinoService],
    exports: [AdminService, CircularCasinoService]
})
export class AdminModule { }
