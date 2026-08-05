import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

import { forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => AdminModule),
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }])
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService]
})
export class PaymentModule { }
