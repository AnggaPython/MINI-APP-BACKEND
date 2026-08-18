"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const admin_schema_1 = require("./schemas/admin.schema");
const profit_log_schema_1 = require("./schemas/profit-log.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const COINGECKO_ID_BY_COIN_SYMBOL = {
    USDT: "tether",
    USDC: "usd-coin",
    DAI: "dai",
    BUSD: "binance-usd",
    ETH: "ethereum",
    MATIC: "matic-network",
    POL: "polygon-ecosystem-token",
    SOL: "solana",
    PEPE: "pepe",
    ARB: "arbitrum",
    OP: "optimism",
    LINK: "chainlink",
    UNI: "uniswap",
    INJ: "injective-protocol",
    TIA: "celestia",
    DYM: "dymension",
    DOT: "polkadot",
    CRO: "crypto-com-chain",
    BTC: "bitcoin",
    BNB: "binancecoin",
    AVAX: "avalanche-2",
    SUI: "sui",
    APT: "aptos",
    SEI: "sei-network",
};
const COINGECKO_FALLBACK_PRICES_USD = {
    USDT: 1,
    USDC: 1,
    DAI: 1,
    BUSD: 1,
    ETH: 2850,
    SOL: 150,
    MATIC: 0.72,
    POL: 0.72,
    PEPE: 0.0000145,
    ARB: 1.05,
    OP: 2.4,
    LINK: 16,
    UNI: 8.2,
    INJ: 26,
    TIA: 7.8,
    DYM: 4.3,
    DOT: 7.1,
    CRO: 0.082,
    BTC: 62000,
    BNB: 590,
    AVAX: 34,
    SUI: 1.4,
    APT: 8.2,
    SEI: 0.62,
};
const ELIXIR_PER_USD = 10000;
const COINGECKO_CACHE_MS = 5 * 60 * 1000;
const COINGECKO_BASE = "https://api.coingecko.com/api/v3/simple/price";
const MONETAG_MILESTONES_USD = [100, 250, 500, 1000];
const MONETAG_MAX_TOP_USERS = 100;
const PROFIT_LOGS_MAX_HARD = 100;
const PROFIT_LOGS_DEFAULT_LIMIT = 10;
let AdminService = class AdminService {
    adminModel;
    profitLogModel;
    userModel;
    _cgCache = null;
    _cgInflight = null;
    constructor(adminModel, profitLogModel, userModel) {
        this.adminModel = adminModel;
        this.profitLogModel = profitLogModel;
        this.userModel = userModel;
    }
    async onModuleInit() {
        const rootAdmin = await this.adminModel.findOne({ username: "superadmin" });
        if (!rootAdmin) {
            const defaultPassword = "superadminpassword";
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(defaultPassword, salt);
            await new this.adminModel({
                username: "superadmin",
                passwordHash,
            }).save();
            console.log("--- ROOT SUPERADMIN GENERATED: superadmin / superadminpassword ---");
        }
    }
    async authenticate(username, passwordString, ip = "") {
        const admin = await this.adminModel.findOne({ username }).exec();
        if (!admin)
            return { error: "Invalid credentials" };
        const isMatch = await bcrypt.compare(passwordString, admin.passwordHash);
        if (!isMatch)
            return { error: "Invalid credentials" };
        admin.lastLogin = new Date();
        if (ip)
            admin.lastIp = ip;
        const sessionToken = crypto.randomBytes(32).toString("hex");
        admin.sessionToken = sessionToken;
        admin.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await admin.save();
        return {
            success: true,
            token: sessionToken,
            role: admin.role,
        };
    }
    async verifySessionToken(token) {
        if (!token)
            return null;
        const admin = await this.adminModel.findOne({ sessionToken: token }).exec();
        if (!admin)
            return null;
        if (!admin.tokenExpiresAt || admin.tokenExpiresAt.getTime() < Date.now()) {
            admin.sessionToken = null;
            admin.tokenExpiresAt = null;
            await admin.save();
            return null;
        }
        return admin;
    }
    async addProfit(coin, amount, source, telegramId) {
        if (amount === 0 || !coin)
            return;
        const rootAdmin = await this.adminModel
            .findOne({ username: "superadmin" })
            .exec();
        if (!rootAdmin)
            return;
        if (!rootAdmin.profitBalances)
            rootAdmin.profitBalances = {};
        const current = rootAdmin.profitBalances[coin.toUpperCase()] || 0;
        rootAdmin.profitBalances[coin.toUpperCase()] = current + amount;
        rootAdmin.markModified("profitBalances");
        await rootAdmin.save();
        if (source && telegramId) {
            await new this.profitLogModel({
                coin: coin.toUpperCase(),
                amount,
                source,
                telegramId,
            }).save();
        }
    }
    async fetchLivePricesUsd() {
        const now = Date.now();
        if (this._cgCache && now - this._cgCache.fetchedAt < COINGECKO_CACHE_MS) {
            return { ...this._cgCache.pricesUsd };
        }
        if (this._cgInflight)
            return this._cgInflight;
        const ids = Array.from(new Set(Object.values(COINGECKO_ID_BY_COIN_SYMBOL))).join(",");
        const url = `${COINGECKO_BASE}?ids=${encodeURIComponent(ids)}&vs_currencies=usd`;
        this._cgInflight = (async () => {
            try {
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), 6000);
                const resp = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        Accept: "application/json",
                        "User-Agent": "MiniMiniApp/1.0 (S2S Admin)",
                    },
                });
                clearTimeout(t);
                if (!resp.ok)
                    throw new Error(`CoinGecko HTTP ${resp.status}`);
                const data = await resp.json();
                const prices = {};
                for (const [sym, id] of Object.entries(COINGECKO_ID_BY_COIN_SYMBOL)) {
                    const usd = Number(data[id]?.usd);
                    if (Number.isFinite(usd) && usd > 0)
                        prices[sym] = usd;
                }
                for (const [sym, fallback] of Object.entries(COINGECKO_FALLBACK_PRICES_USD)) {
                    if (!prices[sym])
                        prices[sym] = Number(fallback) || 0;
                }
                this._cgCache = { pricesUsd: { ...prices }, fetchedAt: Date.now() };
                return { ...prices };
            }
            catch (err) {
                console.warn(`[CoinGecko] Live price fetch failed, using fallback prices. ${String(err).slice(0, 160)}`);
                const stale = this._cgCache?.pricesUsd || {};
                const merged = {};
                for (const [sym, fallback] of Object.entries(COINGECKO_FALLBACK_PRICES_USD)) {
                    const preferred = Number(stale[sym]);
                    merged[sym] =
                        Number.isFinite(preferred) && preferred > 0
                            ? preferred
                            : Number(fallback) || 0;
                }
                this._cgCache = { pricesUsd: merged, fetchedAt: Date.now() };
                return { ...merged };
            }
            finally {
                this._cgInflight = null;
            }
        })();
        return this._cgInflight;
    }
    _bootstrapFeesTotalUsd(balances, pricesUsd) {
        const breakdown = {};
        let totalUsd = 0;
        for (const [coinSym, rawAmount] of Object.entries(balances || {})) {
            const amount = Number(rawAmount) || 0;
            if (amount <= 0)
                continue;
            const symUp = String(coinSym || "").toUpperCase();
            let priceUsd = 0;
            if (symUp === "ELIXIR")
                priceUsd = 1 / ELIXIR_PER_USD;
            else if (symUp === "USD")
                priceUsd = 1;
            else
                priceUsd =
                    Number(pricesUsd[symUp]) ||
                        Number(COINGECKO_FALLBACK_PRICES_USD[symUp]) ||
                        0;
            const valueUsd = amount * priceUsd;
            breakdown[symUp] = { amount, priceUsd, valueUsd };
            totalUsd += valueUsd;
        }
        return { totalUsd, breakdown };
    }
    async getProfitBalances() {
        const rootAdmin = await this.adminModel
            .findOne({ username: "superadmin" })
            .select("profitBalances")
            .exec();
        const balances = {
            ...(rootAdmin?.profitBalances || {}),
        };
        const pricesUsd = await this.fetchLivePricesUsd();
        const { totalUsd: totalProfitFeesAllCoinsUsd, breakdown: profitFeeValueByCoin, } = this._bootstrapFeesTotalUsd(balances, pricesUsd);
        const monetagLogs = await this.profitLogModel
            .find({
            source: "MONETAG_S2S_PAYOUT",
            coin: "USD",
        })
            .select("amount createdAt")
            .sort({ createdAt: -1 })
            .limit(2000)
            .exec();
        let totalMonetagRevenueUSD = 0;
        let totalMonetagImpressions = 0;
        let lastSevenDaysRevenueUSD = 0;
        const nowSevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        for (const log of monetagLogs) {
            const amt = Number(log.amount) || 0;
            if (amt <= 0)
                continue;
            totalMonetagRevenueUSD += amt;
            totalMonetagImpressions += 1;
            if (log.createdAt && log.createdAt.getTime() >= nowSevenDaysAgo) {
                lastSevenDaysRevenueUSD += amt;
            }
        }
        const averagePayoutPerImpression = totalMonetagImpressions > 0
            ? totalMonetagRevenueUSD / totalMonetagImpressions
            : 0.000185;
        const milestones = MONETAG_MILESTONES_USD.map((target) => {
            const achieved = totalMonetagRevenueUSD >= target;
            const progress = achieved
                ? 100
                : Math.min(100, Math.round((totalMonetagRevenueUSD / target) * 10000) / 100);
            const remaining = achieved
                ? 0
                : Math.max(0, target - totalMonetagRevenueUSD);
            let estImpressions = 0;
            if (!achieved) {
                estImpressions =
                    averagePayoutPerImpression > 0
                        ? Math.ceil(remaining / averagePayoutPerImpression)
                        : Infinity;
            }
            return {
                targetUSD: target,
                achieved,
                progressPercent: progress,
                remainingUSD: Number(remaining.toFixed(6)),
                estImpressionsRemaining: estImpressions,
            };
        });
        let currentMilestoneIndex = milestones.findIndex((m) => !m.achieved);
        let allMilestonesReached = false;
        let finalNextTarget;
        if (currentMilestoneIndex === -1) {
            allMilestonesReached = true;
            currentMilestoneIndex = milestones.length;
            const extendedTarget = 2500;
            const remaining = Math.max(0, extendedTarget - totalMonetagRevenueUSD);
            finalNextTarget = {
                targetUSD: extendedTarget,
                progressPercent: Math.min(100, Math.round((totalMonetagRevenueUSD / extendedTarget) * 10000) / 100),
                remainingUSD: Number(remaining.toFixed(6)),
                estImpressionsRemaining: averagePayoutPerImpression > 0
                    ? Math.ceil(remaining / averagePayoutPerImpression)
                    : Infinity,
            };
        }
        else {
            const t = milestones[currentMilestoneIndex];
            finalNextTarget = {
                targetUSD: t.targetUSD,
                progressPercent: t.progressPercent,
                remainingUSD: t.remainingUSD,
                estImpressionsRemaining: t.estImpressionsRemaining,
            };
        }
        const primaryTarget = milestones[0];
        const dailyRunRateUSD = lastSevenDaysRevenueUSD / 7;
        const estimatedDaysToPrimary = dailyRunRateUSD > 0
            ? Math.ceil(primaryTarget.remainingUSD / dailyRunRateUSD)
            : null;
        return {
            balances,
            totalProfitFeesAllCoinsUsd: Number(totalProfitFeesAllCoinsUsd.toFixed(6)),
            profitFeeValueByCoin: Object.fromEntries(Object.entries(profitFeeValueByCoin).map(([k, v]) => [
                k,
                {
                    amount: v.amount,
                    priceUsd: Number(v.priceUsd.toFixed(8)),
                    valueUsd: Number(v.valueUsd.toFixed(6)),
                },
            ])),
            livePriceUsdByCoin: Object.fromEntries(Object.entries(pricesUsd).map(([k, v]) => [k, Number(v.toFixed(8))])),
            monetagSummary: {
                totalRevenueUSD: Number(totalMonetagRevenueUSD.toFixed(6)),
                totalImpressions: totalMonetagImpressions,
                averagePayoutPerImpressionUSD: Number(averagePayoutPerImpression.toFixed(6)),
                lastSevenDaysRevenueUSD: Number(lastSevenDaysRevenueUSD.toFixed(6)),
                dailyRunRateUSD: Number(dailyRunRateUSD.toFixed(6)),
                primaryMilestoneUsd: primaryTarget.targetUSD,
                remainingUSD: Number(primaryTarget.remainingUSD.toFixed(6)),
                progressPercent: primaryTarget.progressPercent,
                estimatedImpressionsRemaining: primaryTarget.estImpressionsRemaining,
                estimatedDaysToPrimaryWithdraw: estimatedDaysToPrimary,
                allMilestonesReached,
                currentMilestoneIndex,
                nextMilestone: finalNextTarget,
                milestonesRoadmap: milestones,
                extendedTargetIfAllReachedUsd: 2500,
                source: "MONETAG_S2S_PAYOUT",
                coin: "USD",
            },
        };
    }
    async getMonetagTopUsers(page = 1, perPage = 10) {
        const PAGE_SAFE = Math.max(1, Math.floor(Number(page) || 1));
        const PER_SAFE = Math.max(1, Math.min(50, Math.floor(Number(perPage) || 10)));
        const SKIP = (PAGE_SAFE - 1) * PER_SAFE;
        const pipeline = [
            { $match: { source: "MONETAG_S2S_PAYOUT", coin: "USD" } },
            { $sort: { createdAt: -1 } },
            { $limit: 5000 },
            {
                $group: {
                    _id: "$telegramId",
                    totalEarnedUsd: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } },
                    impressionCount: { $sum: 1 },
                    lastImpressionAt: { $max: "$createdAt" },
                },
            },
            { $sort: { totalEarnedUsd: -1, lastImpressionAt: -1 } },
            { $limit: MONETAG_MAX_TOP_USERS },
        ];
        const aggregated = (await this.profitLogModel
            .aggregate(pipeline)
            .allowDiskUse(true)
            .exec());
        const totalUsers = aggregated.length;
        const pagedRows = aggregated.slice(SKIP, SKIP + PER_SAFE);
        const hasMore = SKIP + pagedRows.length < totalUsers;
        const ids = pagedRows.map((r) => String(r._id));
        let userDocs = [];
        if (ids.length > 0) {
            userDocs = (await this.userModel
                .find({ telegramId: { $in: ids } }, { telegramId: 1, firstName: 1, lastName: 1, username: 1 })
                .lean()
                .exec());
        }
        const usersById = new Map();
        for (const u of userDocs)
            usersById.set(u.telegramId, u);
        const users = pagedRows.map((r) => {
            const meta = usersById.get(String(r._id));
            const avg = r.impressionCount > 0 ? r.totalEarnedUsd / r.impressionCount : 0;
            return {
                telegramId: String(r._id),
                firstName: meta?.firstName || "Unknown",
                lastName: meta?.lastName || null,
                username: meta?.username || null,
                totalEarnedUsd: Number(r.totalEarnedUsd.toFixed(6)),
                impressionCount: Number(r.impressionCount) || 0,
                avgEarningsPerImpressionUsd: Number(avg.toFixed(8)),
                lastImpressionAt: r.lastImpressionAt || null,
            };
        });
        return {
            users,
            totalUsers,
            hasMore,
            page: PAGE_SAFE,
            perPage: PER_SAFE,
            hardLimit: MONETAG_MAX_TOP_USERS,
        };
    }
    async getProfitLogsPaginated(coin, page = 1, perPage = PROFIT_LOGS_DEFAULT_LIMIT) {
        const PAGE_SAFE = Math.max(1, Math.floor(Number(page) || 1));
        const PER_SAFE = Math.max(1, Math.min(PROFIT_LOGS_MAX_HARD, Math.floor(Number(perPage) || PROFIT_LOGS_DEFAULT_LIMIT)));
        const SKIP = (PAGE_SAFE - 1) * PER_SAFE;
        const filter = coin && coin !== "ALL" ? { coin: coin.toUpperCase() } : {};
        const boundedIds = await this.profitLogModel
            .find(filter, { _id: 1 })
            .sort({ createdAt: -1 })
            .limit(PROFIT_LOGS_MAX_HARD)
            .lean()
            .exec();
        const totalLogs = boundedIds.length;
        const pagedIds = boundedIds.slice(SKIP, SKIP + PER_SAFE).map((x) => x._id);
        const hasMore = SKIP + pagedIds.length < totalLogs;
        let logs = [];
        if (pagedIds.length > 0) {
            logs = await this.profitLogModel
                .find({ _id: { $in: pagedIds } })
                .sort({ createdAt: -1 })
                .exec();
        }
        return {
            logs,
            totalLogs,
            page: PAGE_SAFE,
            perPage: PER_SAFE,
            hasMore,
            hardLimit: PROFIT_LOGS_MAX_HARD,
        };
    }
    async getProfitLogs(coin) {
        const res = await this.getProfitLogsPaginated(coin, 1, PROFIT_LOGS_DEFAULT_LIMIT);
        return res.logs;
    }
    async getWithdrawLimits() {
        const rootAdmin = await this.adminModel
            .findOne({ username: "superadmin" })
            .select("withdrawLimits")
            .exec();
        return rootAdmin?.withdrawLimits || { PEPE: 10000000, USDC: 200 };
    }
    async getTreasuryElixirLiquidity() {
        const rootAdmin = await this.adminModel
            .findOne({ username: "superadmin" })
            .select("profitBalances")
            .exec();
        const feesElixir = Number(rootAdmin?.profitBalances?.["ELIXIR"] || 0);
        const fallbackTreasury = 5_000_000;
        return Math.max(fallbackTreasury, feesElixir);
    }
    async updateWithdrawLimit(coin, limit) {
        const rootAdmin = await this.adminModel
            .findOne({ username: "superadmin" })
            .exec();
        if (rootAdmin) {
            if (!rootAdmin.withdrawLimits)
                rootAdmin.withdrawLimits = {};
            rootAdmin.withdrawLimits[coin.toUpperCase()] = limit;
            rootAdmin.markModified("withdrawLimits");
            await rootAdmin.save();
            return rootAdmin.withdrawLimits;
        }
        return {};
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __param(1, (0, mongoose_1.InjectModel)(profit_log_schema_1.ProfitLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AdminService);
//# sourceMappingURL=admin.service.js.map