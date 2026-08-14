import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Transaction } from "../payment/schemas/transaction.schema";
import { BankLog } from "../bank/schemas/bank-log.schema";
import { HiLoBet } from "../users/schemas/hilo-bet.schema";

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(Transaction.name) private txModel: Model<Transaction>,
    @InjectModel(BankLog.name) private bankLogModel: Model<BankLog>,
    @InjectModel(HiLoBet.name) private hiloBetModel: Model<HiLoBet>,
  ) {}

  async getAggregatedHistory(
    telegramId: string,
    page: number,
    limit: number,
    filter: string,
  ) {
    const rawItems: any[] = [];

    // 1. Transactions (Deposit / Withdraw / Swap)
    if (filter === "All" || filter === "Deposit" || filter === "Withdraw") {
      let typeQ: any = { $in: ["DEPOSIT", "WITHDRAW", "SWAP"] };
      if (filter === "Deposit") typeQ = "DEPOSIT";
      if (filter === "Withdraw") typeQ = "WITHDRAW";
      const txs = await this.txModel
        .find({ telegramId, type: typeQ })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
        .exec();
      txs.forEach((tx: any) => {
        const isPos = tx.type === "DEPOSIT";
        rawItems.push({
          id: tx._id.toString(),
          type:
            tx.type === "DEPOSIT"
              ? "Deposit"
              : tx.type === "WITHDRAW"
                ? "Withdraw"
                : "Swap",
          hash: tx._id.toString().substring(0, 8).toUpperCase(),
          amount: tx.amount,
          coin: tx.coin || "ELIXIR",
          isPositive: isPos,
          createdAt: tx.createdAt,
        });
      });
    }

    // 2. Hi-Lo Bets
    if (filter === "All" || filter === "HI-LO bet") {
      const bets = await this.hiloBetModel
        .find({ telegramId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
        .exec();
      bets.forEach((bet: any) => {
        rawItems.push({
          id: bet._id.toString(),
          type: "HI-LO bet",
          hash: bet.hash
            ? bet.hash.substring(0, 8).toUpperCase()
            : bet._id.toString().substring(0, 8).toUpperCase(),
          amount: bet.betAmount,
          coin: "ELIXIR",
          isPositive: bet.isWin, // For bets, + means win, - means lose (represented visually)
          // If we want exact profit metrics: isPositive ? bet.profit : bet.betAmount
          // We'll map visually in React
          createdAt: bet.createdAt,
        });
      });
    }

    // 3. Bank Vault (Stake, Claim, Unstake)
    if (filter === "All" || filter === "Bank vault") {
      const bankLogs = await this.bankLogModel
        .find({ telegramId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
        .exec();
      bankLogs.forEach((log: any) => {
        let isPos = true;
        if (log.type === "STAKE" || log.type === "UNSTAKE") isPos = false; // "Bank Vault" operation
        // Wait, staking means moving money into Bank (so from user's perspective, wallet drops, but bank increases).
        // Usually stakes are visually neutral or "Locked". We'll set isPositive based on CLAIM
        if (log.type === "CLAIM") isPos = true;

        rawItems.push({
          id: log._id.toString(),
          type: "Bank vault",
          hash: log._id.toString().substring(0, 8).toUpperCase(),
          amount: log.amount,
          coin: "ELIXIR",
          isPositive: isPos,
          createdAt: log.createdAt,
          metaType: log.type, // STAKE, CLAIM, EMERGENCY_UNSTAKE
        });
      });
    }

    // Sort globally by date descending
    rawItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Format dates dynamically
    const formattedItems = rawItems.map((item) => {
      const d = new Date(item.createdAt);
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).substring(2)}`;
      const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      return { ...item, date: dateStr, time: timeStr };
    });

    // Pagination Engine
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pagedData = formattedItems.slice(startIndex, endIndex);

    return {
      success: true,
      filter,
      data: pagedData,
      hasMore: rawItems.length > endIndex,
      totalItems: rawItems.length,
    };
  }
}
