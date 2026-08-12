"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("../payment/schemas/transaction.schema");
const bank_log_schema_1 = require("../bank/schemas/bank-log.schema");
const hilo_bet_schema_1 = require("../users/schemas/hilo-bet.schema");
let HistoryService = class HistoryService {
    txModel;
    bankLogModel;
    hiloBetModel;
    constructor(txModel, bankLogModel, hiloBetModel) {
        this.txModel = txModel;
        this.bankLogModel = bankLogModel;
        this.hiloBetModel = hiloBetModel;
    }
    async getAggregatedHistory(telegramId, page, limit, filter) {
        const rawItems = [];
        if (filter === 'All' || filter === 'Deposit' || filter === 'Withdraw') {
            let typeQ = { $in: ['DEPOSIT', 'WITHDRAW', 'SWAP'] };
            if (filter === 'Deposit')
                typeQ = 'DEPOSIT';
            if (filter === 'Withdraw')
                typeQ = 'WITHDRAW';
            const txs = await this.txModel.find({ telegramId, type: typeQ }).sort({ createdAt: -1 }).limit(100).lean().exec();
            txs.forEach((tx) => {
                const isPos = tx.type === 'DEPOSIT';
                rawItems.push({
                    id: tx._id.toString(),
                    type: tx.type === 'DEPOSIT' ? 'Deposit' : (tx.type === 'WITHDRAW' ? 'Withdraw' : 'Swap'),
                    hash: tx._id.toString().substring(0, 8).toUpperCase(),
                    amount: tx.amount,
                    isPositive: isPos,
                    createdAt: tx.createdAt
                });
            });
        }
        if (filter === 'All' || filter === 'HI-LO bet') {
            const bets = await this.hiloBetModel.find({ telegramId }).sort({ createdAt: -1 }).limit(100).lean().exec();
            bets.forEach((bet) => {
                rawItems.push({
                    id: bet._id.toString(),
                    type: 'HI-LO bet',
                    hash: bet.hash ? bet.hash.substring(0, 8).toUpperCase() : bet._id.toString().substring(0, 8).toUpperCase(),
                    amount: bet.betAmount,
                    isPositive: bet.isWin,
                    createdAt: bet.createdAt
                });
            });
        }
        if (filter === 'All' || filter === 'Bank vault') {
            const bankLogs = await this.bankLogModel.find({ telegramId }).sort({ createdAt: -1 }).limit(100).lean().exec();
            bankLogs.forEach((log) => {
                let isPos = true;
                if (log.type === 'STAKE' || log.type === 'UNSTAKE')
                    isPos = false;
                if (log.type === 'CLAIM')
                    isPos = true;
                rawItems.push({
                    id: log._id.toString(),
                    type: 'Bank vault',
                    hash: log._id.toString().substring(0, 8).toUpperCase(),
                    amount: log.amount,
                    isPositive: isPos,
                    createdAt: log.createdAt,
                    metaType: log.type
                });
            });
        }
        rawItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const formattedItems = rawItems.map(item => {
            const d = new Date(item.createdAt);
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).substring(2)}`;
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            return { ...item, date: dateStr, time: timeStr };
        });
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const pagedData = formattedItems.slice(startIndex, endIndex);
        return {
            success: true,
            filter,
            data: pagedData,
            hasMore: rawItems.length > endIndex,
            totalItems: rawItems.length
        };
    }
};
exports.HistoryService = HistoryService;
exports.HistoryService = HistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(1, (0, mongoose_1.InjectModel)(bank_log_schema_1.BankLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(hilo_bet_schema_1.HiLoBet.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], HistoryService);
//# sourceMappingURL=history.service.js.map