import { Injectable, OnModuleInit, Inject, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Admin, AdminDocument } from "./schemas/admin.schema";
import { ProfitLog, ProfitLogDocument } from "./schemas/profit-log.schema";
import { UserDocument, User } from "../users/schemas/user.schema";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

// ──────────────────────────────────────────────────────────────────────
// CoinGecko → internal symbol mapping.
// Not every asset we track on-chain has the same CoinGecko id slug.
// ELIXIR is excluded from this table because it has a FIXED business
// peg of 10_000 ELIXIR = 1 USD (never subject to market fluctuations).
// ──────────────────────────────────────────────────────────────────────
const COINGECKO_ID_BY_COIN_SYMBOL: Record<string, string> = {
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

// ──────────────────────────────────────────────────────────────────────
// Fallback prices (used when CoinGecko is rate-limited 429 or offline).
// Approximate Aug 2026 levels — refresh occasionally; these are ONLY
// used as a safety-net so the total USD never shows NaN.
// ──────────────────────────────────────────────────────────────────────
const COINGECKO_FALLBACK_PRICES_USD: Record<string, number> = {
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

const ELIXIR_PER_USD = 10000; // Business contract: 1 USD ⇄ 10 000 ELIXIR
const COINGECKO_CACHE_MS = 5 * 60 * 1000; // 5 min cache avoids 429 rate-limit
const COINGECKO_BASE = "https://api.coingecko.com/api/v3/simple/price";

const MONETAG_MILESTONES_USD = [100, 250, 500, 1000] as const;
const MONETAG_MAX_TOP_USERS = 100; // user-requested hard cap
const PROFIT_LOGS_MAX_HARD = 100; // user-requested hard cap
const PROFIT_LOGS_DEFAULT_LIMIT = 10;

@Injectable()
export class AdminService implements OnModuleInit {
  private _cgCache: {
    pricesUsd: Record<string, number>;
    fetchedAt: number;
  } | null = null;
  private _cgInflight: Promise<Record<string, number>> | null = null;

  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(ProfitLog.name)
    private profitLogModel: Model<ProfitLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    // Automatically inject the root Super Admin if none exists
    const rootAdmin = await this.adminModel.findOne({ username: "superadmin" });
    if (!rootAdmin) {
      const defaultPassword = "superadminpassword"; // In production, this should be an env var
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      await new this.adminModel({
        username: "superadmin",
        passwordHash,
      }).save();
      console.log(
        "--- ROOT SUPERADMIN GENERATED: superadmin / superadminpassword ---",
      );
    }
  }

  async authenticate(
    username: string,
    passwordString: string,
    ip: string = "",
  ) {
    const admin = await this.adminModel.findOne({ username }).exec();
    if (!admin) return { error: "Invalid credentials" };

    const isMatch = await bcrypt.compare(passwordString, admin.passwordHash);
    if (!isMatch) return { error: "Invalid credentials" };

    admin.lastLogin = new Date();
    if (ip) admin.lastIp = ip;

    // Session token: random 32 byte hex + expires 24 hours
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

  async verifySessionToken(token: string): Promise<AdminDocument | null> {
    if (!token) return null;
    const admin = await this.adminModel.findOne({ sessionToken: token }).exec();
    if (!admin) return null;
    // Token expired?
    if (!admin.tokenExpiresAt || admin.tokenExpiresAt.getTime() < Date.now()) {
      admin.sessionToken = null;
      admin.tokenExpiresAt = null;
      await admin.save();
      return null;
    }
    return admin;
  }

  async addProfit(
    coin: string,
    amount: number,
    source: string,
    telegramId: string,
  ) {
    if (amount === 0 || !coin) return;
    const rootAdmin = await this.adminModel
      .findOne({ username: "superadmin" })
      .exec();
    if (!rootAdmin) return;

    if (!rootAdmin.profitBalances) rootAdmin.profitBalances = {};
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

  // ──────────────────────────────────────────────────────────────────
  // CoinGecko LIVE price fetcher with 5 minute in-memory cache +
  // inflight coalescing (prevents duplicate concurrent HTTP calls during
  // stampedes while one request is in flight). Returns prices keyed by
  // UPPERCASE coin symbols (PEPE, ETH, MATIC, …). ELIXIR is NOT
  // included because ELIXIR rate is a strict business peg 10_000 = $1.
  // ──────────────────────────────────────────────────────────────────
  async fetchLivePricesUsd(): Promise<Record<string, number>> {
    const now = Date.now();
    if (this._cgCache && now - this._cgCache.fetchedAt < COINGECKO_CACHE_MS) {
      return { ...this._cgCache.pricesUsd };
    }
    if (this._cgInflight) return this._cgInflight;

    const ids = Array.from(
      new Set(Object.values(COINGECKO_ID_BY_COIN_SYMBOL)),
    ).join(",");
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
        if (!resp.ok) throw new Error(`CoinGecko HTTP ${resp.status}`);
        const data: Record<string, { usd?: number }> = await resp.json();

        const prices: Record<string, number> = {};
        for (const [sym, id] of Object.entries(COINGECKO_ID_BY_COIN_SYMBOL)) {
          const usd = Number(data[id]?.usd);
          if (Number.isFinite(usd) && usd > 0) prices[sym] = usd;
        }

        // Merge static fallback prices for any coins CoinGecko didn't return
        // (prevents NaN value when API omits smaller tokens).
        for (const [sym, fallback] of Object.entries(
          COINGECKO_FALLBACK_PRICES_USD,
        )) {
          if (!prices[sym]) prices[sym] = Number(fallback) || 0;
        }

        this._cgCache = { pricesUsd: { ...prices }, fetchedAt: Date.now() };
        return { ...prices };
      } catch (err) {
        console.warn(
          `[CoinGecko] Live price fetch failed, using fallback prices. ${String(err).slice(0, 160)}`,
        );
        const stale = this._cgCache?.pricesUsd || {};
        const merged: Record<string, number> = {};
        for (const [sym, fallback] of Object.entries(
          COINGECKO_FALLBACK_PRICES_USD,
        )) {
          const preferred = Number(stale[sym]);
          merged[sym] =
            Number.isFinite(preferred) && preferred > 0
              ? preferred
              : Number(fallback) || 0;
        }
        this._cgCache = { pricesUsd: merged, fetchedAt: Date.now() };
        return { ...merged };
      } finally {
        this._cgInflight = null;
      }
    })();

    return this._cgInflight;
  }

  private _bootstrapFeesTotalUsd(
    balances: Record<string, number>,
    pricesUsd: Record<string, number>,
  ): {
    totalUsd: number;
    breakdown: Record<
      string,
      { amount: number; priceUsd: number; valueUsd: number }
    >;
  } {
    const breakdown: Record<
      string,
      { amount: number; priceUsd: number; valueUsd: number }
    > = {};
    let totalUsd = 0;

    for (const [coinSym, rawAmount] of Object.entries(balances || {})) {
      const amount = Number(rawAmount) || 0;
      if (amount <= 0) continue;
      const symUp = String(coinSym || "").toUpperCase();
      let priceUsd = 0;
      if (symUp === "ELIXIR") priceUsd = 1 / ELIXIR_PER_USD;
      else if (symUp === "USD") priceUsd = 1;
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
    const balances: Record<string, number> = {
      ...(rootAdmin?.profitBalances || {}),
    };
    const pricesUsd = await this.fetchLivePricesUsd();
    const {
      totalUsd: totalProfitFeesAllCoinsUsd,
      breakdown: profitFeeValueByCoin,
    } = this._bootstrapFeesTotalUsd(balances, pricesUsd);

    // ──────────────────────────────────────────────────────────────────
    // Monetag S2S payout summary + MILESTONE ROADMAP ($100 → $250 → $500 → $1000)
    // ──────────────────────────────────────────────────────────────────
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
      if (amt <= 0) continue;
      totalMonetagRevenueUSD += amt;
      totalMonetagImpressions += 1;
      if (log.createdAt && log.createdAt.getTime() >= nowSevenDaysAgo) {
        lastSevenDaysRevenueUSD += amt;
      }
    }

    const averagePayoutPerImpression =
      totalMonetagImpressions > 0
        ? totalMonetagRevenueUSD / totalMonetagImpressions
        : 0.000185;

    // ── Milestone roadmap
    const milestones = MONETAG_MILESTONES_USD.map((target) => {
      const achieved = totalMonetagRevenueUSD >= target;
      const progress = achieved
        ? 100
        : Math.min(
            100,
            Math.round((totalMonetagRevenueUSD / target) * 10000) / 100,
          );
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
    // Find the lowest un-reached milestone. If all reached, project a $2500 virtual target auto-extended.
    let currentMilestoneIndex = milestones.findIndex((m) => !m.achieved);
    let allMilestonesReached = false;
    let finalNextTarget: {
      targetUSD: number;
      progressPercent: number;
      remainingUSD: number;
      estImpressionsRemaining: number;
    };

    if (currentMilestoneIndex === -1) {
      allMilestonesReached = true;
      currentMilestoneIndex = milestones.length;
      const extendedTarget = 2500;
      const remaining = Math.max(0, extendedTarget - totalMonetagRevenueUSD);
      finalNextTarget = {
        targetUSD: extendedTarget,
        progressPercent: Math.min(
          100,
          Math.round((totalMonetagRevenueUSD / extendedTarget) * 10000) / 100,
        ),
        remainingUSD: Number(remaining.toFixed(6)),
        estImpressionsRemaining:
          averagePayoutPerImpression > 0
            ? Math.ceil(remaining / averagePayoutPerImpression)
            : Infinity,
      };
    } else {
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
    const estimatedDaysToPrimary =
      dailyRunRateUSD > 0
        ? Math.ceil(primaryTarget.remainingUSD / dailyRunRateUSD)
        : null;

    return {
      balances,
      totalProfitFeesAllCoinsUsd: Number(totalProfitFeesAllCoinsUsd.toFixed(6)),
      profitFeeValueByCoin: Object.fromEntries(
        Object.entries(profitFeeValueByCoin).map(([k, v]) => [
          k,
          {
            amount: v.amount,
            priceUsd: Number(v.priceUsd.toFixed(8)),
            valueUsd: Number(v.valueUsd.toFixed(6)),
          },
        ]),
      ),
      livePriceUsdByCoin: Object.fromEntries(
        Object.entries(pricesUsd).map(([k, v]) => [k, Number(v.toFixed(8))]),
      ),
      monetagSummary: {
        totalRevenueUSD: Number(totalMonetagRevenueUSD.toFixed(6)),
        totalImpressions: totalMonetagImpressions,
        averagePayoutPerImpressionUSD: Number(
          averagePayoutPerImpression.toFixed(6),
        ),
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

  // ──────────────────────────────────────────────────────────────────
  // Monetag top-earning viewers leaderboard (user-requested):
  //   • aggregate MONETAG_S2S_PAYOUT logs grouped by Telegram user
  //   • sorts by total USD earned descending
  //   • HARD LIMIT 100 unique users tracked (per user requirement: if
  //     there are 101 results the 100th+ are automatically discarded)
  //   • paginated 10 rows per page, client-side "Load More" button
  //   • firstName / lastName joined live from User schema so the admin
  //     table displays readable names not just numeric IDs
  // ──────────────────────────────────────────────────────────────────
  async getMonetagTopUsers(
    page = 1,
    perPage = 10,
  ): Promise<{
    users: Array<{
      telegramId: string;
      firstName: string;
      lastName?: string | null;
      username?: string | null;
      totalEarnedUsd: number;
      impressionCount: number;
      avgEarningsPerImpressionUsd: number;
      lastImpressionAt: Date | null;
    }>;
    totalUsers: number;
    hasMore: boolean;
    page: number;
    perPage: number;
    hardLimit: number;
  }> {
    const PAGE_SAFE = Math.max(1, Math.floor(Number(page) || 1));
    const PER_SAFE = Math.max(
      1,
      Math.min(50, Math.floor(Number(perPage) || 10)),
    );
    const SKIP = (PAGE_SAFE - 1) * PER_SAFE;

    // Aggregation: scan newest S2S events first, dedupe by user, sort
    // by earnings desc, then hard-cap at MONETAG_MAX_TOP_USERS.
    const pipeline: any[] = [
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
      .exec()) as Array<{
      _id: string;
      totalEarnedUsd: number;
      impressionCount: number;
      lastImpressionAt: Date | null;
    }>;

    const totalUsers = aggregated.length;

    // Apply pagination slice AFTER aggregation cap, so page 2 truly
    // starts at the 11th-capped user, not the 11th before capping.
    const pagedRows = aggregated.slice(SKIP, SKIP + PER_SAFE);
    const hasMore = SKIP + pagedRows.length < totalUsers;

    // Resolve user metadata (names & username) in a single batch lookup.
    const ids = pagedRows.map((r) => String(r._id));
    let userDocs: UserDocument[] = [];
    if (ids.length > 0) {
      userDocs = (await this.userModel
        .find(
          { telegramId: { $in: ids } },
          { telegramId: 1, firstName: 1, lastName: 1, username: 1 },
        )
        .lean()
        .exec()) as UserDocument[];
    }
    const usersById = new Map<string, UserDocument>();
    for (const u of userDocs) usersById.set(u.telegramId, u);

    const users = pagedRows.map((r) => {
      const meta = usersById.get(String(r._id));
      const avg =
        r.impressionCount > 0 ? r.totalEarnedUsd / r.impressionCount : 0;
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

  // ──────────────────────────────────────────────────────────────────
  // Paginated origin-tracking Profit Logs — user-requested hard cap:
  //   • always shows MOST RECENT logs first
  //   • default page size = 10 (matches Monetag table for UX consistency)
  //   • absolute backend HARD LIMIT = PROFIT_LOGS_MAX_HARD (100) entries
  //     ever returned (even if page/limit ask for more; user requirement:
  //     if DB has 101 entries, old #101+ auto-discarded from response)
  // ──────────────────────────────────────────────────────────────────
  async getProfitLogsPaginated(
    coin?: string,
    page = 1,
    perPage = PROFIT_LOGS_DEFAULT_LIMIT,
  ): Promise<{
    logs: ProfitLogDocument[];
    totalLogs: number;
    page: number;
    perPage: number;
    hasMore: boolean;
    hardLimit: number;
  }> {
    const PAGE_SAFE = Math.max(1, Math.floor(Number(page) || 1));
    const PER_SAFE = Math.max(
      1,
      Math.min(
        PROFIT_LOGS_MAX_HARD,
        Math.floor(Number(perPage) || PROFIT_LOGS_DEFAULT_LIMIT),
      ),
    );
    const SKIP = (PAGE_SAFE - 1) * PER_SAFE;
    const filter = coin && coin !== "ALL" ? { coin: coin.toUpperCase() } : {};

    // Get IDs of the newest PROFIT_LOGS_MAX_HARD (100) entries, THEN
    // paginate inside that 100-entry bounded pool — this honours the
    // user's "drop anything past the latest 100, always" requirement
    // even when the raw collection still has millions of old rows.
    const boundedIds = await this.profitLogModel
      .find(filter, { _id: 1 })
      .sort({ createdAt: -1 })
      .limit(PROFIT_LOGS_MAX_HARD)
      .lean()
      .exec();
    const totalLogs = boundedIds.length;
    const pagedIds = boundedIds.slice(SKIP, SKIP + PER_SAFE).map((x) => x._id);
    const hasMore = SKIP + pagedIds.length < totalLogs;

    let logs: ProfitLogDocument[] = [];
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

  // Legacy alias (kept for forward-compat until controller switches over):
  async getProfitLogs(coin?: string) {
    const res = await this.getProfitLogsPaginated(
      coin,
      1,
      PROFIT_LOGS_DEFAULT_LIMIT,
    );
    return res.logs;
  }

  async getWithdrawLimits(): Promise<Record<string, number>> {
    const rootAdmin = await this.adminModel
      .findOne({ username: "superadmin" })
      .select("withdrawLimits")
      .exec();
    return rootAdmin?.withdrawLimits || { PEPE: 10000000, USDC: 200 };
  }

  async getTreasuryElixirLiquidity(): Promise<number> {
    const rootAdmin = await this.adminModel
      .findOne({ username: "superadmin" })
      .select("profitBalances")
      .exec();
    const feesElixir = Number(rootAdmin?.profitBalances?.["ELIXIR"] || 0);
    const fallbackTreasury = 5_000_000;
    return Math.max(fallbackTreasury, feesElixir);
  }

  async updateWithdrawLimit(
    coin: string,
    limit: number,
  ): Promise<Record<string, number>> {
    const rootAdmin = await this.adminModel
      .findOne({ username: "superadmin" })
      .exec();
    if (rootAdmin) {
      if (!rootAdmin.withdrawLimits) rootAdmin.withdrawLimits = {};
      rootAdmin.withdrawLimits[coin.toUpperCase()] = limit;
      rootAdmin.markModified("withdrawLimits");
      await rootAdmin.save();
      return rootAdmin.withdrawLimits;
    }
    return {};
  }
}
