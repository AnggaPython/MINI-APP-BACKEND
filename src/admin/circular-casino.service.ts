import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  CircularTreasury,
  CircularTreasuryDocument,
} from "./schemas/circular-treasury.schema";
import {
  UserNetEquity,
  UserNetEquityDocument,
} from "./schemas/user-net-equity.schema";
import {
  MonthlyBookCycle,
  MonthlyBookCycleDocument,
} from "./schemas/monthly-book-cycle.schema";

export type BetOutcome = {
  isWin: boolean;
  isWhaleTrigger: boolean;
  patternApplied: boolean;
  adminDelta: number;
  circularPoolDelta: number;
  burnedDelta: number;
  userNetPayout: number;
  vestingLocked: number;
  vestingTurnoverRequired: number;
  maxAdminPayoutCapApplied: boolean;
  circularPoolWasEmpty: boolean;
  refillModeActive: boolean;
  userNetEquityDeltaTotal: number;
};

// WHALE_PATTERN_TEMPLATES removed — dead logic (anti-whale shuffle disabled)

@Injectable()
  // @ts-ignore - super strict cleanup pending
export class CircularCasinoService implements OnModuleInit {
  // @ts-ignore - super strict pending
  private readonly _logger = new Logger(CircularCasinoService.name);
  constructor(
    @InjectModel(CircularTreasury.name)
    private readonly treasuryModel: Model<CircularTreasuryDocument>,
    @InjectModel(UserNetEquity.name)
    private readonly equityModel: Model<UserNetEquityDocument>,
    @InjectModel(MonthlyBookCycle.name)
    private readonly bookCycleModel: Model<MonthlyBookCycleDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureBootstrapped();
  }

  // ---------- BOOTSTRAP ----------
  async ensureBootstrapped(): Promise<CircularTreasuryDocument> {
    let t = await this.treasuryModel.findOne({ key: "MAIN" }).exec();
    if (!t) {
      t = new this.treasuryModel({ key: "MAIN" });
      await t.save();
    }
    let book = await this.bookCycleModel.findOne({ isActive: true }).exec();
    if (!book) {
      const now = new Date();
      const cycleId = `CYCLE_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      book = new this.bookCycleModel({
        cycleId,
        startDate: now,
        isActive: true,
        startAdminTreasury: t.adminTreasuryElixir,
      });
      await book.save();
    }
    return t;
  }

  async getTreasury(): Promise<CircularTreasuryDocument> {
    const t = await this.treasuryModel.findOne({ key: "MAIN" }).exec();
    if (!t) return this.ensureBootstrapped();
    return t;
  }

  async getUserEquity(
    telegramId: string,
    firstName?: string | null,
    username?: string | null,
  ): Promise<UserNetEquityDocument> {
    let eq = await this.equityModel.findOne({ telegramId }).exec();
    if (!eq) {
      eq = new this.equityModel({
        telegramId,
        firstName: firstName ?? null,
        username: username ?? null,
        lastActiveAt: new Date(),
      });
      await eq.save();
    } else {
      const changed =
        (!eq.firstName && firstName) || (!eq.username && username);
      if (firstName) eq.firstName = firstName;
      if (username) eq.username = username;
      eq.lastActiveAt = new Date();
      if (changed) await eq.save();
    }
    return eq;
  }

  // ---------- PATTERN SHUFFLER REMOVED (dead code) ----------

  // ---------- CORE: RESOLVE HI-LO BET ----------
  async resolveHiLoBet(
    telegramId: string,
    firstName: string | null | undefined,
    username: string | null | undefined,
    betAmount: number,
    rawIsWinFromEngine: boolean,
    multiplier: number,
  ): Promise<BetOutcome> {
    const t = await this.ensureBootstrapped();
    const eq = await this.getUserEquity(
      telegramId,
      firstName ?? null,
      username ?? null,
    );

    const isWhale = betAmount >= t.paramWhaleBetThresholdElixir;
    const isWin = rawIsWinFromEngine;
    const patternApplied = false;

    // --- WHALE PATTERN SHUFFLE (REMOVED) ---

    eq.totalBetsLifetime = (eq.totalBetsLifetime || 0) + 1;
    eq.lastActiveAt = new Date();

    const grossPayoutIfWin = betAmount * multiplier;
    const profitIfWin = grossPayoutIfWin - betAmount;
    const maxAdminPayout = Math.floor(
      t.adminTreasuryElixir * t.paramMaxAdminPayoutPercentPerBet,
    );

    let adminDelta = 0;
    let circularPoolDelta = 0;
    let burnedDelta = 0;
    let userNetPayout = 0;
    const vestingLocked = 0;
    const vestingTurnoverRequired = 0;
    let maxAdminPayoutCapApplied = false;
    let circularPoolWasEmpty = false;

    if (isWin) {
      eq.totalHiLoGrossWinsElixir =
        (eq.totalHiLoGrossWinsElixir || 0) + grossPayoutIfWin;

      const adminShare = Math.min(
        maxAdminPayout,
        Math.floor(profitIfWin * 0.1),
      );
      const neededFromCircular = profitIfWin - adminShare;

      if (t.circularLossPoolElixir >= neededFromCircular) {
        circularPoolDelta = -neededFromCircular;
        adminDelta = -adminShare;
        userNetPayout = betAmount + profitIfWin;
      } else if (t.circularLossPoolElixir + maxAdminPayout >= profitIfWin) {
        const fromCircular = t.circularLossPoolElixir;
        const remaining = profitIfWin - fromCircular;
        circularPoolDelta = -fromCircular;
        adminDelta = -Math.min(maxAdminPayout, remaining);
        userNetPayout =
          betAmount + (fromCircular + Math.min(maxAdminPayout, remaining));
        if (adminDelta < 0 && Math.abs(adminDelta) === maxAdminPayout)
          maxAdminPayoutCapApplied = true;
      } else {
        circularPoolDelta = -t.circularLossPoolElixir;
        adminDelta = -maxAdminPayout;
        const realProfit = t.circularLossPoolElixir + maxAdminPayout;
        userNetPayout = betAmount + realProfit;
        circularPoolWasEmpty = t.circularLossPoolElixir < neededFromCircular;
        maxAdminPayoutCapApplied = true;
      }

      if (profitIfWin > betAmount * 10) {
        eq.lastBigWinAt = new Date();
      }

      eq.lockedVestingTurnoverDone =
        (eq.lockedVestingTurnoverDone || 0) + betAmount;
    } else {
      eq.totalHiLoGrossLossesElixir =
        (eq.totalHiLoGrossLossesElixir || 0) + betAmount;
      const burnAmt = Math.floor(betAmount * t.paramBurnRate);
      const taxShareAmt = t.isRefillMode
        ? Math.floor(betAmount * t.paramAdminTaxRefill)
        : Math.floor(betAmount * t.paramAdminTaxNormal);
      const circularAmt = Math.max(0, betAmount - burnAmt - taxShareAmt);

      burnedDelta = burnAmt;
      adminDelta = taxShareAmt;
      circularPoolDelta = circularAmt;
      userNetPayout = 0;

      eq.lockedVestingTurnoverDone =
        (eq.lockedVestingTurnoverDone || 0) + betAmount;
    }

    const todayKey = this.dateKey(new Date());
    if (eq.withdrawnDayKey !== todayKey) {
      eq.withdrawnDayKey = todayKey;
      eq.withdrawnTodayElixir = 0;
    }

    await eq.save();

    t.adminTreasuryElixir = Math.max(0, t.adminTreasuryElixir + adminDelta);
    t.circularLossPoolElixir = Math.max(
      0,
      t.circularLossPoolElixir + circularPoolDelta,
    );
    t.burnedTotalElixir = t.burnedTotalElixir + Math.max(0, burnedDelta);
    t.totalTaxCollectedThisCycle =
      t.totalTaxCollectedThisCycle + Math.max(0, adminDelta);

    const prevRefill = t.isRefillMode;
    if (t.adminTreasuryElixir < t.paramRefillTriggerBelow && !t.isRefillMode) {
      t.isRefillMode = true;
      t.refillTriggerCountThisCycle = (t.refillTriggerCountThisCycle || 0) + 1;
    } else if (
      t.adminTreasuryElixir > t.paramRefillStopAbove &&
      t.isRefillMode
    ) {
      t.isRefillMode = false;
    }
    if (!prevRefill && t.isRefillMode) {
      const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
      if (book) {
        book.refillModeTriggeredCount =
          (book.refillModeTriggeredCount || 0) + 1;
        await book.save();
      }
    }

    await this.maybeTakeDailySnapshot(t);
    await this.appendImpactLog(t, {
      betId: `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      telegramId,
      betAmount,
      isWhale,
      isWin,
      circularPoolDelta,
      adminTreasuryDelta: adminDelta,
      burnedDelta,
      timestamp: Date.now(),
    });

    await this.updateMonthlyBookOnBet(t, betAmount, adminDelta, burnedDelta);
    await t.save();

    return {
      isWin,
      isWhaleTrigger: isWhale,
      patternApplied,
      adminDelta,
      circularPoolDelta,
      burnedDelta,
      userNetPayout,
      vestingLocked,
      vestingTurnoverRequired,
      maxAdminPayoutCapApplied,
      circularPoolWasEmpty,
      refillModeActive: t.isRefillMode,
      userNetEquityDeltaTotal: isWin ? userNetPayout + vestingLocked : 0,
    };
  }

  // ---------- WITHDRAW HELPERS ----------
  computeWithdrawFeePercent(_eq: UserNetEquityDocument): {
    feePct: number;
    reason: string;
  } {
    return { feePct: 0.08, reason: "standard" };
  }

  computeDailyWithdrawCapUsd(_eq: UserNetEquityDocument): number {
    return Infinity;
  }

  computeNetEquityUsd(eq: UserNetEquityDocument): number {
    const netElixir =
      (eq.totalWithdrawnElixir || 0) +
      (eq.lockedVestingElixir || 0) +
      ((eq.totalHiLoGrossWinsElixir || 0) -
        (eq.totalHiLoGrossLossesElixir || 0)) -
      (eq.totalDepositedElixir || 0) -
      (eq.circulationTaxAccumulated || 0);
    return netElixir / 10000;
  }

  onUserWithdrawSuccess(
    eq: UserNetEquityDocument,
    withdrawnElixir: number,
    feeElixir: number,
  ): void {
    eq.totalWithdrawnElixir = (eq.totalWithdrawnElixir || 0) + withdrawnElixir;
    const today = this.dateKey(new Date());
    if (eq.withdrawnDayKey !== today) {
      eq.withdrawnDayKey = today;
      eq.withdrawnTodayElixir = 0;
    }
    eq.withdrawnTodayElixir += withdrawnElixir + feeElixir;
  }

  // ---------- ADMIN DASHBOARD ----------
  async getDashboardStats(): Promise<Record<string, unknown>> {
    const t = await this.ensureBootstrapped();
    const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
    const netProfitElixir = t.adminTreasuryElixir - t.adminTreasuryStartCycle;
    const netProfitPercent =
      t.adminTreasuryStartCycle > 0
        ? (netProfitElixir / t.adminTreasuryStartCycle) * 100
        : 0;
    return {
      adminTreasury: {
        value: t.adminTreasuryElixir,
        startCycle: t.adminTreasuryStartCycle,
        netProfitElixir,
        netProfitPercent,
        usdEquivalent: t.adminTreasuryElixir / 10000,
        usdNetProfit: netProfitElixir / 10000,
        isRefillMode: t.isRefillMode,
        refillTriggerCount: t.refillTriggerCountThisCycle,
        thresholdRefillBelow: t.paramRefillTriggerBelow,
        thresholdRefillStopAbove: t.paramRefillStopAbove,
      },
      circularPool: {
        value: t.circularLossPoolElixir,
        usdEquivalent: t.circularLossPoolElixir / 10000,
      },
      burned: {
        total: t.burnedTotalElixir,
        usd: t.burnedTotalElixir / 10000,
      },
      taxThisCycle: t.totalTaxCollectedThisCycle,
      params: {
        adminTreasuryStart: t.paramAdminTreasuryStart,
        refillTriggerBelow: t.paramRefillTriggerBelow,
        refillStopAbove: t.paramRefillStopAbove,
        adminTaxNormal: t.paramAdminTaxNormal,
        adminTaxRefill: t.paramAdminTaxRefill,
        circularShareNormal: t.paramCircularShareNormal,
        circularShareRefill: t.paramCircularShareRefill,
        burnRate: t.paramBurnRate,
        maxAdminPayoutPercentPerBet: t.paramMaxAdminPayoutPercentPerBet,
        whaleThreshold: t.paramWhaleBetThresholdElixir,
        whalePatternNormalLoss: t.paramWhalePatternNormalTargetLoss,
        whalePatternRefillLoss: t.paramWhalePatternRefillTargetLoss,
      },
      liveImpactLog: (t.liveImpactLog || []).slice(-30).reverse(),
      dailySnapshots30D: t.dailySnapshots30D || [],
      monthlyBook: book
        ? {
            cycleId: book.cycleId,
            startDate: book.startDate,
            startAdminTreasury: book.startAdminTreasury,
            endAdminTreasury: book.endAdminTreasury,
            totalTaxCollected: book.totalTaxCollected,
            totalBurned: book.totalBurned,
            totalWithdrawalFees: book.totalWithdrawalFees,
            totalAdsRevenueElixirEquivalent:
              book.totalAdsRevenueElixirEquivalent,
            totalBets: book.totalBets,
            totalBetsVolume: book.totalBetsVolume,
            refillModeTriggeredCount: book.refillModeTriggeredCount,
            dailySeries: book.dailySeries || [],
            netProfitPercent: book.netProfitPercent,
          }
        : null,
    };
  }

  async getTop5WhalesByNetEquity(): Promise<Record<string, unknown>[]> {
    const all = await this.equityModel
      .find({ totalBetsLifetime: { $gt: 5 } })
      .exec();
    const withEquity = all
      .map((eq) => {
        const netUsd = this.computeNetEquityUsd(eq);
        return {
          telegramId: eq.telegramId,
          firstName: eq.firstName,
          username: eq.username,
          netEquityUsd: netUsd,
          totalBets: eq.totalBetsLifetime,
          totalWithdrawnElixir: eq.totalWithdrawnElixir,
          lockedVesting: eq.lockedVestingElixir,
          lastBigWinAt: eq.lastBigWinAt,
          lastActiveAt: eq.lastActiveAt,
        };
      })
      .sort((a, b) => b.netEquityUsd - a.netEquityUsd);
    return withEquity.slice(0, 5);
  }

  async updateParams(updates: Record<string, number>): Promise<void> {
    const t = await this.ensureBootstrapped();
    const map: Record<string, string> = {
      adminTreasuryStart: "paramAdminTreasuryStart",
      refillTriggerBelow: "paramRefillTriggerBelow",
      refillStopAbove: "paramRefillStopAbove",
      adminTaxNormal: "paramAdminTaxNormal",
      adminTaxRefill: "paramAdminTaxRefill",
      circularShareNormal: "paramCircularShareNormal",
      circularShareRefill: "paramCircularShareRefill",
      burnRate: "paramBurnRate",
      maxAdminPayoutPercentPerBet: "paramMaxAdminPayoutPercentPerBet",
      whaleThreshold: "paramWhaleBetThresholdElixir",
      whalePatternNormalLoss: "paramWhalePatternNormalTargetLoss",
      whalePatternRefillLoss: "paramWhalePatternRefillTargetLoss",
    };
    for (const k of Object.keys(updates)) {
      if (
        map[k] !== undefined &&
        typeof updates[k] === "number" &&
        Number.isFinite(updates[k])
      ) {
        (t as any)[map[k]] = updates[k];
      }
    }
    if (
      typeof updates.adminTreasuryCurrent === "number" &&
      Number.isFinite(updates.adminTreasuryCurrent)
    ) {
      t.adminTreasuryElixir = Math.max(0, updates.adminTreasuryCurrent);
    }
    if (
      typeof updates.circularPoolCurrent === "number" &&
      Number.isFinite(updates.circularPoolCurrent)
    ) {
      t.circularLossPoolElixir = Math.max(0, updates.circularPoolCurrent);
    }
    await t.save();
  }

  async closeCurrentCycleAndStartNew(): Promise<void> {
    const t = await this.ensureBootstrapped();
    const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
    if (book) {
      book.isActive = false;
      book.endDate = new Date();
      book.endAdminTreasury = t.adminTreasuryElixir;
      book.netProfitPercent =
        book.startAdminTreasury > 0
          ? ((book.endAdminTreasury - book.startAdminTreasury) /
              book.startAdminTreasury) *
            100
          : null;
      await book.save();
    }
    const now = new Date();
    const cycleId = `CYCLE_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${now.getTime()}`;
    const next = new this.bookCycleModel({
      cycleId,
      startDate: now,
      isActive: true,
      startAdminTreasury: t.adminTreasuryElixir,
    });
    await next.save();
    t.adminTreasuryStartCycle = t.adminTreasuryElixir;
    t.totalTaxCollectedThisCycle = 0;
    t.refillTriggerCountThisCycle = 0;
    await t.save();
  }

  async addAdsRevenue(elixirEquivalent: number): Promise<void> {
    if (elixirEquivalent <= 0) return;
    const t = await this.ensureBootstrapped();
    t.adminTreasuryElixir += elixirEquivalent;
    t.totalTaxCollectedThisCycle += elixirEquivalent;
    const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
    if (book)
      book.totalAdsRevenueElixirEquivalent =
        (book.totalAdsRevenueElixirEquivalent || 0) + elixirEquivalent;
    await book?.save();
    await t.save();
  }

  async addWithdrawalFee(elixirFee: number): Promise<void> {
    if (elixirFee <= 0) return;
    const t = await this.ensureBootstrapped();
    t.adminTreasuryElixir += elixirFee;
    t.totalTaxCollectedThisCycle += elixirFee;
    const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
    if (book)
      book.totalWithdrawalFees = (book.totalWithdrawalFees || 0) + elixirFee;
    await book?.save();
    await t.save();
  }

  // ---------- HELPERS ----------
  private async appendImpactLog(
    t: CircularTreasuryDocument,
    entry: any,
  ): Promise<void> {
    const arr = Array.isArray(t.liveImpactLog) ? t.liveImpactLog : [];
    arr.push(entry);
    while (arr.length > 60) arr.shift();
    t.liveImpactLog = arr;
  }

  private async updateMonthlyBookOnBet(
    t: CircularTreasuryDocument,
    betAmount: number,
    taxDelta: number,
    burnDelta: number,
  ): Promise<void> {
    const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
    if (!book) return;
    book.totalBets = (book.totalBets || 0) + 1;
    book.totalBetsVolume = (book.totalBetsVolume || 0) + betAmount;
    book.totalTaxCollected =
      (book.totalTaxCollected || 0) + Math.max(0, taxDelta);
    book.totalBurned = (book.totalBurned || 0) + Math.max(0, burnDelta);
    const today = this.dateKey(new Date());
    const series = Array.isArray(book.dailySeries) ? book.dailySeries : [];
    const last = series[series.length - 1];
    if (!last || last.dateKey !== today) {
      series.push({
        dayIndex: series.length,
        dateKey: today,
        adminTreasury: t.adminTreasuryElixir,
        taxCollected: Math.max(0, taxDelta),
        betsVolume: betAmount,
      });
    } else {
      last.adminTreasury = t.adminTreasuryElixir;
      last.taxCollected += Math.max(0, taxDelta);
      last.betsVolume += betAmount;
    }
    while (series.length > 31) series.shift();
    book.dailySeries = series;
    await book.save();
  }

  private async maybeTakeDailySnapshot(
    t: CircularTreasuryDocument,
  ): Promise<void> {
    const today = this.dateKey(new Date());
    const lastSnap = (t.dailySnapshots30D || [])[
      (t.dailySnapshots30D || []).length - 1
    ];
    if (lastSnap && lastSnap.dateYYYYMMDD === today) {
      lastSnap.adminTreasuryElixir = t.adminTreasuryElixir;
      lastSnap.circularLossPool = t.circularLossPoolElixir;
      lastSnap.burnedToday = Math.max(0, lastSnap.burnedToday);
      lastSnap.taxCollectedToday = Math.max(0, lastSnap.taxCollectedToday);
      lastSnap.betsToday = (lastSnap.betsToday || 0) + 1;
      return;
    }
    const snaps = Array.isArray(t.dailySnapshots30D) ? t.dailySnapshots30D : [];
    snaps.push({
      dateYYYYMMDD: today,
      adminTreasuryElixir: t.adminTreasuryElixir,
      circularLossPool: t.circularLossPoolElixir,
      burnedToday: 0,
      taxCollectedToday: 0,
      betsToday: 1,
    });
    while (snaps.length > 30) snaps.shift();
    t.dailySnapshots30D = snaps;
    t.lastDailySnapshot = new Date();
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }
}
