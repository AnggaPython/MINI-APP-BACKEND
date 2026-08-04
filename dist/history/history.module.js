"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const history_controller_1 = require("./history.controller");
const history_service_1 = require("./history.service");
const transaction_schema_1 = require("../payment/schemas/transaction.schema");
const bank_log_schema_1 = require("../bank/schemas/bank-log.schema");
const hilo_bet_schema_1 = require("../users/schemas/hilo-bet.schema");
let HistoryModule = class HistoryModule {
};
exports.HistoryModule = HistoryModule;
exports.HistoryModule = HistoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: transaction_schema_1.Transaction.name, schema: transaction_schema_1.TransactionSchema },
                { name: bank_log_schema_1.BankLog.name, schema: bank_log_schema_1.BankLogSchema },
                { name: hilo_bet_schema_1.HiLoBet.name, schema: hilo_bet_schema_1.HiLoBetSchema }
            ])
        ],
        controllers: [history_controller_1.HistoryController],
        providers: [history_service_1.HistoryService],
    })
], HistoryModule);
//# sourceMappingURL=history.module.js.map