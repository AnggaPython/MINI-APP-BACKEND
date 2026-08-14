import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HistoryController } from "./history.controller";
import { HistoryService } from "./history.service";

import {
  Transaction,
  TransactionSchema,
} from "../payment/schemas/transaction.schema";
import { BankLog, BankLogSchema } from "../bank/schemas/bank-log.schema";
import { HiLoBet, HiLoBetSchema } from "../users/schemas/hilo-bet.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: BankLog.name, schema: BankLogSchema },
      { name: HiLoBet.name, schema: HiLoBetSchema },
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
