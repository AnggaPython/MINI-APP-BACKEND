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
var CircularCasinoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircularCasinoService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const circular_treasury_schema_1 = require("./schemas/circular-treasury.schema");
const user_net_equity_schema_1 = require("./schemas/user-net-equity.schema");
const monthly_book_cycle_schema_1 = require("./schemas/monthly-book-cycle.schema");
const WHALE_PATTERN_TEMPLATES = [
    [1, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0], [1, 0, 0, 1, 0, 0], [0, 1, 0, 0], [1, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 1, 0], [1, 0, 0, 0, 0, 1, 0, 0, 1], [1, 0, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 1, 0], [1, 0, 1, 0, 0, 0, 1, 0, 0], [1, 0, 0, 0, 1, 0, 0]
];
let CircularCasinoService = CircularCasinoService_1 = class CircularCasinoService {
    treasuryModel;
    equityModel;
    bookCycleModel;
    logger = new common_1.Logger(CircularCasinoService_1.name);
    constructor(treasuryModel, equityModel, bookCycleModel) {
        this.treasuryModel = treasuryModel;
        this.equityModel = equityModel;
        this.bookCycleModel = bookCycleModel;
    }
    async onModuleInit() {
        await this.ensureBootstrapped();
    }
    async ensureBootstrapped() {
        let t = await this.treasuryModel.findOne({ key: 'MAIN' }).exec();
        if (!t) {
            t = new this.treasuryModel({ key: 'MAIN' });
            await t.save();
        }
        let book = await this.bookCycleModel.findOne({ isActive: true }).exec();
        if (!book) {
            const now = new Date();
            const cycleId = `CYCLE_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            book = new this.bookCycleModel({
                cycleId,
                startDate: now,
                isActive: true,
                startAdminTreasury: t.adminTreasuryElixir
            });
            await book.save();
        }
        return t;
    }
    async getTreasury() {
        const t = await this.treasuryModel.findOne({ key: 'MAIN' }).exec();
        if (!t)
            return this.ensureBootstrapped();
        return t;
    }
    async getUserEquity(telegramId, firstName, username) {
        let eq = await this.equityModel.findOne({ telegramId }).exec();
        if (!eq) {
            eq = new this.equityModel({
                telegramId,
                firstName: firstName ?? null,
                username: username ?? null,
                lastActiveAt: new Date()
            });
            await eq.save();
        }
        else {
            const changed = (!eq.firstName && firstName) || (!eq.username && username);
            if (firstName)
                eq.firstName = firstName;
            if (username)
                eq.username = username;
            eq.lastActiveAt = new Date();
            if (changed)
                await eq.save();
        }
        return eq;
    }
    generateWhalePattern(numBets, targetNetLoss) {
        const results = [];
        const safeLoss = Math.min(0.35, Math.max(0.05, targetNetLoss));
        const winRatio = (1 - safeLoss) / 2.2;
        while (results.length < numBets + 15) {
            const tpl = WHALE_PATTERN_TEMPLATES[Math.floor(Math.random() * WHALE_PATTERN_TEMPLATES.length)];
            results.push(...tpl);
        }
        const wins = results.filter(x => x === 1).length;
        const currentRatio = wins / results.length;
        if (currentRatio > winRatio + 0.05) {
            for (let i = results.length - 1; i >= 0 && results.filter(x => x === 1).length / results.length > winRatio; i--) {
                if (results[i] === 1)
                    results[i] = 0;
            }
        }
        else if (currentRatio < winRatio - 0.05) {
            for (let i = 0; i < results.length && results.filter(x => x === 1).length / results.length < winRatio; i++) {
                if (results[i] === 0 && Math.random() < 0.4)
                    results[i] = 1;
            }
        }
        return results.slice(0, Math.max(20, numBets));
    }
    ensureWhalePatternForEquity(eq, refillMode, p) {
        if (!eq.whalePatternQueue || eq.whalePatternQueue.length === 0 || (eq.whalePatternIndex ?? 0) >= eq.whalePatternQueue.length - 1) {
            const targetLoss = refillMode ? p.paramWhalePatternRefillTargetLoss : p.paramWhalePatternNormalTargetLoss;
            eq.whalePatternQueue = this.generateWhalePattern(40, targetLoss);
            eq.whalePatternIndex = 0;
        }
    }
    async resolveHiLoBet(telegramId, firstName, username, betAmount, rawIsWinFromEngine, multiplier) {
        const t = await this.ensureBootstrapped();
        const eq = await this.getUserEquity(telegramId, firstName ?? null, username ?? null);
        const isWhale = betAmount >= t.paramWhaleBetThresholdElixir;
        let isWin = rawIsWinFromEngine;
        let patternApplied = false;
        if (isWhale) {
            this.ensureWhalePatternForEquity(eq, t.isRefillMode, t);
            const idx = eq.whalePatternIndex ?? 0;
            const q = eq.whalePatternQueue ?? [];
            if (q[idx] !== undefined) {
                isWin = q[idx] === 1;
                eq.whalePatternIndex = idx + 1;
                patternApplied = true;
            }
        }
        eq.totalBetsLifetime = (eq.totalBetsLifetime || 0) + 1;
        eq.lastActiveAt = new Date();
        const grossPayoutIfWin = betAmount * multiplier;
        const profitIfWin = grossPayoutIfWin - betAmount;
        const maxAdminPayout = Math.floor(t.adminTreasuryElixir * t.paramMaxAdminPayoutPercentPerBet);
        let adminDelta = 0;
        let circularPoolDelta = 0;
        let burnedDelta = 0;
        let userNetPayout = 0;
        let vestingLocked = 0;
        let vestingTurnoverRequired = 0;
        let maxAdminPayoutCapApplied = false;
        let circularPoolWasEmpty = false;
        if (isWin) {
            eq.totalHiLoGrossWinsElixir = (eq.totalHiLoGrossWinsElixir || 0) + grossPayoutIfWin;
            const adminShare = Math.min(maxAdminPayout, Math.floor(profitIfWin * 0.1));
            const neededFromCircular = profitIfWin - adminShare;
            if (t.circularLossPoolElixir >= neededFromCircular) {
                circularPoolDelta = -neededFromCircular;
                adminDelta = -adminShare;
                userNetPayout = betAmount + profitIfWin;
            }
            else if (t.circularLossPoolElixir + maxAdminPayout >= profitIfWin) {
                const fromCircular = t.circularLossPoolElixir;
                const remaining = profitIfWin - fromCircular;
                circularPoolDelta = -fromCircular;
                adminDelta = -Math.min(maxAdminPayout, remaining);
                userNetPayout = betAmount + (fromCircular + Math.min(maxAdminPayout, remaining));
                if (adminDelta < 0 && Math.abs(adminDelta) === maxAdminPayout)
                    maxAdminPayoutCapApplied = true;
            }
            else {
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
            eq.lockedVestingTurnoverDone = (eq.lockedVestingTurnoverDone || 0) + betAmount;
        }
        else {
            eq.totalHiLoGrossLossesElixir = (eq.totalHiLoGrossLossesElixir || 0) + betAmount;
            const burnAmt = Math.floor(betAmount * t.paramBurnRate);
            const taxShareAmt = t.isRefillMode
                ? Math.floor(betAmount * t.paramAdminTaxRefill)
                : Math.floor(betAmount * t.paramAdminTaxNormal);
            const circularAmt = Math.max(0, betAmount - burnAmt - taxShareAmt);
            burnedDelta = burnAmt;
            adminDelta = taxShareAmt;
            circularPoolDelta = circularAmt;
            userNetPayout = 0;
            eq.lockedVestingTurnoverDone = (eq.lockedVestingTurnoverDone || 0) + betAmount;
        }
        const todayKey = this.dateKey(new Date());
        if (eq.withdrawnDayKey !== todayKey) {
            eq.withdrawnDayKey = todayKey;
            eq.withdrawnTodayElixir = 0;
        }
        await eq.save();
        t.adminTreasuryElixir = Math.max(0, t.adminTreasuryElixir + adminDelta);
        t.circularLossPoolElixir = Math.max(0, t.circularLossPoolElixir + circularPoolDelta);
        t.burnedTotalElixir = t.burnedTotalElixir + Math.max(0, burnedDelta);
        t.totalTaxCollectedThisCycle = t.totalTaxCollectedThisCycle + Math.max(0, adminDelta);
        const prevRefill = t.isRefillMode;
        if (t.adminTreasuryElixir < t.paramRefillTriggerBelow && !t.isRefillMode) {
            t.isRefillMode = true;
            t.refillTriggerCountThisCycle = (t.refillTriggerCountThisCycle || 0) + 1;
        }
        else if (t.adminTreasuryElixir > t.paramRefillStopAbove && t.isRefillMode) {
            t.isRefillMode = false;
        }
        if (!prevRefill && t.isRefillMode) {
            const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
            if (book) {
                book.refillModeTriggeredCount = (book.refillModeTriggeredCount || 0) + 1;
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
            timestamp: Date.now()
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
            userNetEquityDeltaTotal: isWin ? (userNetPayout + vestingLocked) : 0
        };
    }
    computeWithdrawFeePercent(eq) {
        return { feePct: 0.08, reason: 'standard' };
    }
    computeDailyWithdrawCapUsd(eq) {
        return Infinity;
    }
    computeNetEquityUsd(eq) {
        const netElixir = (eq.totalWithdrawnElixir || 0) + (eq.lockedVestingElixir || 0) +
            ((eq.totalHiLoGrossWinsElixir || 0) - (eq.totalHiLoGrossLossesElixir || 0)) -
            (eq.totalDepositedElixir || 0) - (eq.circulationTaxAccumulated || 0);
        return netElixir / 10000;
    }
    onUserWithdrawSuccess(eq, withdrawnElixir, feeElixir) {
        eq.totalWithdrawnElixir = (eq.totalWithdrawnElixir || 0) + withdrawnElixir;
        const today = this.dateKey(new Date());
        if (eq.withdrawnDayKey !== today) {
            eq.withdrawnDayKey = today;
            eq.withdrawnTodayElixir = 0;
        }
        eq.withdrawnTodayElixir += withdrawnElixir + feeElixir;
    }
    async getDashboardStats() {
        const t = await this.ensureBootstrapped();
        const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
        const netProfitElixir = t.adminTreasuryElixir - t.adminTreasuryStartCycle;
        const netProfitPercent = t.adminTreasuryStartCycle > 0 ? (netProfitElixir / t.adminTreasuryStartCycle) * 100 : 0;
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
                thresholdRefillStopAbove: t.paramRefillStopAbove
            },
            circularPool: {
                value: t.circularLossPoolElixir,
                usdEquivalent: t.circularLossPoolElixir / 10000
            },
            burned: {
                total: t.burnedTotalElixir,
                usd: t.burnedTotalElixir / 10000
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
                whalePatternRefillLoss: t.paramWhalePatternRefillTargetLoss
            },
            liveImpactLog: (t.liveImpactLog || []).slice(-30).reverse(),
            dailySnapshots30D: t.dailySnapshots30D || [],
            monthlyBook: book ? {
                cycleId: book.cycleId,
                startDate: book.startDate,
                startAdminTreasury: book.startAdminTreasury,
                endAdminTreasury: book.endAdminTreasury,
                totalTaxCollected: book.totalTaxCollected,
                totalBurned: book.totalBurned,
                totalWithdrawalFees: book.totalWithdrawalFees,
                totalAdsRevenueElixirEquivalent: book.totalAdsRevenueElixirEquivalent,
                totalBets: book.totalBets,
                totalBetsVolume: book.totalBetsVolume,
                refillModeTriggeredCount: book.refillModeTriggeredCount,
                dailySeries: book.dailySeries || [],
                netProfitPercent: book.netProfitPercent
            } : null
        };
    }
    async getTop5WhalesByNetEquity() {
        const all = await this.equityModel.find({ totalBetsLifetime: { $gt: 5 } }).exec();
        const withEquity = all.map(eq => {
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
                lastActiveAt: eq.lastActiveAt
            };
        }).sort((a, b) => b.netEquityUsd - a.netEquityUsd);
        return withEquity.slice(0, 5);
    }
    async updateParams(updates) {
        const t = await this.ensureBootstrapped();
        const map = {
            adminTreasuryStart: 'paramAdminTreasuryStart',
            refillTriggerBelow: 'paramRefillTriggerBelow',
            refillStopAbove: 'paramRefillStopAbove',
            adminTaxNormal: 'paramAdminTaxNormal',
            adminTaxRefill: 'paramAdminTaxRefill',
            circularShareNormal: 'paramCircularShareNormal',
            circularShareRefill: 'paramCircularShareRefill',
            burnRate: 'paramBurnRate',
            maxAdminPayoutPercentPerBet: 'paramMaxAdminPayoutPercentPerBet',
            whaleThreshold: 'paramWhaleBetThresholdElixir',
            whalePatternNormalLoss: 'paramWhalePatternNormalTargetLoss',
            whalePatternRefillLoss: 'paramWhalePatternRefillTargetLoss'
        };
        for (const k of Object.keys(updates)) {
            if (map[k] !== undefined && typeof updates[k] === 'number' && Number.isFinite(updates[k])) {
                t[map[k]] = updates[k];
            }
        }
        if (typeof updates.adminTreasuryCurrent === 'number' && Number.isFinite(updates.adminTreasuryCurrent)) {
            t.adminTreasuryElixir = Math.max(0, updates.adminTreasuryCurrent);
        }
        if (typeof updates.circularPoolCurrent === 'number' && Number.isFinite(updates.circularPoolCurrent)) {
            t.circularLossPoolElixir = Math.max(0, updates.circularPoolCurrent);
        }
        await t.save();
    }
    async closeCurrentCycleAndStartNew() {
        const t = await this.ensureBootstrapped();
        const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
        if (book) {
            book.isActive = false;
            book.endDate = new Date();
            book.endAdminTreasury = t.adminTreasuryElixir;
            book.netProfitPercent = book.startAdminTreasury > 0
                ? ((book.endAdminTreasury - book.startAdminTreasury) / book.startAdminTreasury) * 100
                : null;
            await book.save();
        }
        const now = new Date();
        const cycleId = `CYCLE_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${now.getTime()}`;
        const next = new this.bookCycleModel({
            cycleId,
            startDate: now,
            isActive: true,
            startAdminTreasury: t.adminTreasuryElixir
        });
        await next.save();
        t.adminTreasuryStartCycle = t.adminTreasuryElixir;
        t.totalTaxCollectedThisCycle = 0;
        t.refillTriggerCountThisCycle = 0;
        await t.save();
    }
    async addAdsRevenue(elixirEquivalent) {
        if (elixirEquivalent <= 0)
            return;
        const t = await this.ensureBootstrapped();
        t.adminTreasuryElixir += elixirEquivalent;
        t.totalTaxCollectedThisCycle += elixirEquivalent;
        const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
        if (book)
            book.totalAdsRevenueElixirEquivalent = (book.totalAdsRevenueElixirEquivalent || 0) + elixirEquivalent;
        await book?.save();
        await t.save();
    }
    async addWithdrawalFee(elixirFee) {
        if (elixirFee <= 0)
            return;
        const t = await this.ensureBootstrapped();
        t.adminTreasuryElixir += elixirFee;
        t.totalTaxCollectedThisCycle += elixirFee;
        const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
        if (book)
            book.totalWithdrawalFees = (book.totalWithdrawalFees || 0) + elixirFee;
        await book?.save();
        await t.save();
    }
    async appendImpactLog(t, entry) {
        const arr = Array.isArray(t.liveImpactLog) ? t.liveImpactLog : [];
        arr.push(entry);
        while (arr.length > 60)
            arr.shift();
        t.liveImpactLog = arr;
    }
    async updateMonthlyBookOnBet(t, betAmount, taxDelta, burnDelta) {
        const book = await this.bookCycleModel.findOne({ isActive: true }).exec();
        if (!book)
            return;
        book.totalBets = (book.totalBets || 0) + 1;
        book.totalBetsVolume = (book.totalBetsVolume || 0) + betAmount;
        book.totalTaxCollected = (book.totalTaxCollected || 0) + Math.max(0, taxDelta);
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
                betsVolume: betAmount
            });
        }
        else {
            last.adminTreasury = t.adminTreasuryElixir;
            last.taxCollected += Math.max(0, taxDelta);
            last.betsVolume += betAmount;
        }
        while (series.length > 31)
            series.shift();
        book.dailySeries = series;
        await book.save();
    }
    async maybeTakeDailySnapshot(t) {
        const today = this.dateKey(new Date());
        const lastSnap = (t.dailySnapshots30D || [])[(t.dailySnapshots30D || []).length - 1];
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
            betsToday: 1
        });
        while (snaps.length > 30)
            snaps.shift();
        t.dailySnapshots30D = snaps;
        t.lastDailySnapshot = new Date();
    }
    dateKey(d) {
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }
};
exports.CircularCasinoService = CircularCasinoService;
exports.CircularCasinoService = CircularCasinoService = CircularCasinoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(circular_treasury_schema_1.CircularTreasury.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_net_equity_schema_1.UserNetEquity.name)),
    __param(2, (0, mongoose_1.InjectModel)(monthly_book_cycle_schema_1.MonthlyBookCycle.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], CircularCasinoService);
//# sourceMappingURL=circular-casino.service.js.map