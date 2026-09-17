import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model } from "mongoose";
import {
  MinerStoneService,
  ELIX_RATES,
} from "../miner-stone/miner-stone.service";
import { CaseBoxService } from "../case-box/case-box.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
import { User, UserDocument } from "../users/schemas/user.schema";
import {
  MiningStone,
  MiningStoneDocument,
} from "../miner-stone/schemas/mining-stone.schema";
import { CaseBox, CaseBoxDocument } from "../case-box/schemas/case-box.schema";
import {
  AutoMiningSub,
  AutoMiningSubDocument,
  AutoMiningDay,
  AutoMiningDayDocument,
} from "./schemas/auto-mining.schema";

// ── Plan constants ─────────────────────────────────────────────────────────
export const AUTO_PLAN_FEE_ELIXIR = 250_000;
export const AUTO_PLAN_DAYS = 30;
export const AUTO_DAILY_QUOTA = 500;
/** Fresh-spawn guard: a spawned session older than this belongs to the user. */
const FRESH_SPAWN_MAX_AGE_MS = 30_000;
/** Extra buffer on top of the games' anti-instant-destroy time gates. */
const DESTROY_BUFFER_MS = 1200;
/** ELIXCOIN → ELIXIR anchor for *estimated* earnings (display only). */
const ELIXCOIN_TO_ELIXIR = 0.09674384;

export type AutoTarget = "stone" | "casebox" | "split";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function dateKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Destroy time-gate wait so the run is indistinguishable from real play. */
function destroyWaitMs(maxHp: number, hitIntervalMs: number): number {
  const minHits = Math.ceil(Math.max(0, maxHp) / 120);
  return Math.max(0, (minHits - 1) * hitIntervalMs - 500) + DESTROY_BUFFER_MS;
}

@Injectable()
export class AutoMiningService {
  private readonly logger = new Logger(AutoMiningService.name);

  constructor(
    @InjectModel(AutoMiningSub.name)
    private subModel: Model<AutoMiningSubDocument>,
    @InjectModel(AutoMiningDay.name)
    private dayModel: Model<AutoMiningDayDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(MiningStone.name)
    private stoneModel: Model<MiningStoneDocument>,
    @InjectModel(CaseBox.name)
    private caseModel: Model<CaseBoxDocument>,
    private minerStoneService: MinerStoneService,
    private caseBoxService: CaseBoxService,
    private buffService: BuffItemCollectionsService,
  ) {}

  // ── Subscribe ──────────────────────────────────────────────────────────
  async subscribe(
    telegramId: string,
    opts: {
      target?: string;
      splitStonePct?: number;
      // startDate/stopDate are no longer honored (accepted for backward
      // compatibility with old clients, always ignored).
      startDate?: string;
      stopDate?: string;
      claimMode?: string;
      favPickaxe?: string;
      buffIds?: string[];
    },
  ) {
    const target = (opts.target || "stone") as AutoTarget;
    if (!["stone", "casebox", "split"].includes(target)) {
      return {
        success: false,
        error: "Invalid target (stone | casebox | split)",
      };
    }
    const claimMode = "save"; // forced: autopilot never auto-sells (see runStone)
    let splitStonePct = 50;
    if (target === "split") {
      splitStonePct = Math.round(Number(opts.splitStonePct ?? 50));
      if (
        !Number.isFinite(splitStonePct) ||
        splitStonePct < 10 ||
        splitStonePct > 90
      ) {
        return {
          success: false,
          error: "Split must be 10–90% for miner-stone",
        };
      }
    }

    // ── Plan window: fixed. Starts immediately, runs for the full plan. ────
    // (The old selectable start/stop schedule was removed — it produced
    // confusing failures like "Start date cannot be in the past" when the
    // user's local day/rounding disagreed with the server. Autopilot now
    // always begins the moment it is paid for.)
    const now = Date.now();
    const start = new Date(now);
    const end = new Date(now + AUTO_PLAN_DAYS * 24 * 3600 * 1000);

    const existing = await this.subModel.findOne({ telegramId }).lean().exec();
    if (
      existing &&
      (existing.status === "active" || existing.status === "paused") &&
      new Date(existing.endDate).getTime() > now
    ) {
      return {
        success: false,
        error: "Plan already active — cancel it first to start a new one",
      };
    }

    // ── Reserve the plan slot atomically ────────────────────────────────────
    // The check above is a read, so two parallel subscribes both passed it and
    // both charged the fee (measured: 500,000 ELIXIR debited for a single
    // 250,000 ELIXIR plan, one stored plan, no refund path). `telegramId` is
    // unique on this schema, so a second concurrent request cannot take the
    // slot: it fails the filter, the upsert hits the unique index and the loser
    // is rejected before any money moves.
    let reserved = false;
    try {
      const reservation = await this.subModel
        .findOneAndUpdate(
          {
            telegramId,
            $or: [
              { status: { $in: ["cancelled", "expired"] } },
              { endDate: { $lte: new Date(now) } },
              // A reservation abandoned by a crashed request may be reclaimed.
              { status: "reserving", reservedAt: { $lte: new Date(now - 60_000) } },
              { status: { $exists: false } },
            ],
          },
          { $set: { status: "reserving", reservedAt: new Date(now), feePaid: 0 } },
          { upsert: true, returnDocument: "after" },
        )
        .exec();
      reserved = Boolean(reservation);
    } catch (err: any) {
      // Duplicate key on telegramId: somebody else holds an active reservation.
      if (err?.code === 11000) {
        return {
          success: false,
          error: "Plan already active — cancel it first to start a new one",
        };
      }
      throw err;
    }
    if (!reserved) {
      return {
        success: false,
        error: "Plan already active — cancel it first to start a new one",
      };
    }

    // ── Loadout validation ─────────────────────────────────────────────
    const wantBuffs = Array.isArray(opts.buffIds)
      ? [...new Set(opts.buffIds.map(String))].slice(0, 6)
      : [];
    if (Array.isArray(opts.buffIds) && opts.buffIds.length > 6) {
      return { success: false, error: "At most 6 buffs per plan" };
    }
    let favPickaxe: string | null = null;
    if (opts.favPickaxe) {
      const owner = (await this.userModel
        .findOne({ telegramId })
        .lean()
        .exec()) as unknown as {
        ownedPickaxes?: string[];
      } | null;
      const owned: string[] = owner?.ownedPickaxes?.length
        ? owner.ownedPickaxes
        : ["Common"];
      if (!owned.includes(String(opts.favPickaxe))) {
        return { success: false, error: "Pickaxe not owned" };
      }
      favPickaxe = String(opts.favPickaxe);
    }
    // Pre-validate buff ownership BEFORE charging (application happens after).
    // Only ECONOMY (bigger stone/case payouts) and DROPRATE (better case
    // loot) do anything for autopilot — ATK/DURABILITY need real-time hits
    // and durability wear, which instant auto-runs don't have. Rejecting them
    // keeps those categories trading on the market instead of parked here.
    const PLAN_BUFF_TYPES = ["ECONOMY", "DROPRATE"];
    if (wantBuffs.length > 0) {
      try {
        const col = (await this.buffService.getUserCollection(
          telegramId,
        )) as unknown as {
          ownedItems?: Array<{ baseItemId: string; buffType?: string }>;
        };
        const ownedSet = new Set(
          ((col?.ownedItems || []) as Array<{ baseItemId: string }>).map(
            (i) => i.baseItemId,
          ),
        );
        const typeOf = new Map(
          (
            (col?.ownedItems || []) as Array<{
              baseItemId: string;
              buffType?: string;
            }>
          ).map((i) => [i.baseItemId, i.buffType] as const),
        );
        for (const b of wantBuffs) {
          if (!ownedSet.has(b))
            return { success: false, error: `Buff not owned: ${b}` };
          if (!PLAN_BUFF_TYPES.includes(typeOf.get(b) || "")) {
            return {
              success: false,
              error: `Only ECONOMY and DROPRATE buffs work with autopilot: ${b}`,
            };
          }
        }
      } catch (e) {
        return {
          success: false,
          error: `Buff check failed: ${(e as Error)?.message || "unknown"}`,
        };
      }
    }

    // Atomic charge: 250,000 ELIXIR, fails when balance is short.
    const charged = await this.userModel
      .findOneAndUpdate(
        { telegramId, elixirBalance: { $gte: AUTO_PLAN_FEE_ELIXIR } },
        { $inc: { elixirBalance: -AUTO_PLAN_FEE_ELIXIR } },
        { returnDocument: "after" },
      )
      .exec();
    if (!charged) {
      // Release the reservation so the user can retry once funded.
      await this.subModel
        .updateOne(
          { telegramId, status: "reserving" },
          { $set: { status: "cancelled" } },
        )
        .exec();
      return {
        success: false,
        error: `Need ${AUTO_PLAN_FEE_ELIXIR.toLocaleString()} ELIXIR to start`,
      };
    }

    await this.subModel
      .findOneAndUpdate(
        { telegramId },
        {
          $set: {
            status: "active",
            planDays: AUTO_PLAN_DAYS,
            feePaid: AUTO_PLAN_FEE_ELIXIR,
            claimMode,
            target,
            splitStonePct,
            startDate: start,
            endDate: end,
            dailyQuota: AUTO_DAILY_QUOTA,
            autopilotOn: true,
            lastRunAt: null,
            totalRuns: 0,
            totalElixirValue: 0,
            favPickaxe,
            planBuffs: [],
          },
        },
        { upsert: true, returnDocument: "after" },
      )
      .exec();

    // ── Apply plan buffs AFTER charging (deactivate-all → activate chosen) ──
    if (wantBuffs.length > 0) {
      const applied = await this.setPlanBuffs(telegramId, wantBuffs);
      if (!applied.success) {
        return { success: false, error: applied.error };
      }
      await this.subModel
        .updateOne({ telegramId }, { $set: { planBuffs: applied.activated } })
        .exec();
    }

    const fresh = await this.subModel.findOne({ telegramId }).lean().exec();
    return { success: true, sub: this.publicSub(fresh) };
  }

  /** Replace active buffs with the plan set. Returns activated base-item IDs. */
  private async setPlanBuffs(
    telegramId: string,
    buffIds: string[],
  ): Promise<{ success: boolean; activated?: string[]; error?: string }> {
    try {
      const col = (await this.buffService.getUserCollection(
        telegramId,
      )) as unknown as {
        ownedItems?: Array<{ baseItemId: string }>;
        activeItems?: Array<{ baseItemId: string }>;
      };
      const owned = new Set(
        ((col?.ownedItems || []) as Array<{ baseItemId: string }>).map(
          (i) => i.baseItemId,
        ),
      );
      for (const b of buffIds) {
        if (!owned.has(b))
          return { success: false, error: `Buff not owned: ${b}` };
      }
      for (const a of (col?.activeItems || []) as Array<{
        baseItemId: string;
      }>) {
        try {
          await this.buffService.deactivateBuff(telegramId, a.baseItemId);
        } catch {
          /* best-effort */
        }
      }
      const activated: string[] = [];
      for (const b of buffIds) {
        try {
          const r = (await this.buffService.activateBuff(
            telegramId,
            b,
          )) as unknown as { success?: boolean };
          if (r?.success) activated.push(b);
        } catch {
          /* best-effort */
        }
      }
      return { success: true, activated };
    } catch (e) {
      return {
        success: false,
        error: `Buff setup failed: ${(e as Error)?.message || "unknown"}`,
      };
    }
  }

  /** Best-effort removal of plan buffs (cancel / expiry). */
  private async clearPlanBuffs(telegramId: string, planBuffs?: string[]) {
    if (!planBuffs || planBuffs.length === 0) return;
    for (const b of planBuffs) {
      try {
        await this.buffService.deactivateBuff(telegramId, b);
      } catch {
        /* best-effort */
      }
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────
  async status(telegramId: string) {
    const sub = await this.subModel.findOne({ telegramId }).lean().exec();
    if (!sub) return { success: true, sub: null };
    const now = Date.now();
    const live: Record<string, unknown> = {
      ...(sub as unknown as Record<string, unknown>),
    };
    if (
      live["status"] === "active" &&
      new Date(live["endDate"] as string).getTime() <= now
    ) {
      live["status"] = "expired";
      await this.subModel
        .updateOne(
          { telegramId },
          { $set: { status: "expired", autopilotOn: false } },
        )
        .exec();
      await this.clearPlanBuffs(
        telegramId,
        (live["planBuffs"] as string[]) || [],
      );
    }
    const today = dateKey();
    const days = await this.dayModel
      .find({ telegramId, date: today })
      .lean()
      .exec();
    const usedStone = days.find((d) => d.target === "stone")?.runs ?? 0;
    const usedCase = days.find((d) => d.target === "casebox")?.runs ?? 0;
    const used = usedStone + usedCase;
    const quota = (live["dailyQuota"] as number) || AUTO_DAILY_QUOTA;
    const startMs = new Date(live["startDate"] as string).getTime();
    const endMs = new Date(live["endDate"] as string).getTime();
    const daysLeft = Math.max(0, Math.ceil((endMs - now) / (24 * 3600 * 1000)));
    return {
      success: true,
      sub: this.publicSub(live),
      today: {
        date: today,
        usedStone,
        usedCase,
        used,
        left: Math.max(0, quota - used),
        quota,
      },
      daysLeft,
      inWindow: now >= startMs && now < endMs,
    };
  }

  // ── Pause / resume ─────────────────────────────────────────────────────
  async toggle(telegramId: string, on: boolean) {
    const sub = await this.subModel
      .findOneAndUpdate(
        { telegramId, status: { $in: ["active", "paused"] } },
        { $set: { autopilotOn: on, status: on ? "active" : "paused" } },
        { returnDocument: "after" },
      )
      .exec();
    if (!sub)
      return {
        success: false,
        error: "No plan to toggle (expired or cancelled)",
      };
    return { success: true, sub: this.publicSub(sub) };
  }

  // ── Cancel (no refund — stated in UI) ──────────────────────────────────
  async cancel(telegramId: string) {
    const sub = await this.subModel
      .findOneAndUpdate(
        { telegramId, status: { $in: ["active", "paused"] } },
        { $set: { status: "cancelled", autopilotOn: false } },
        { returnDocument: "after" },
      )
      .exec();
    if (!sub) return { success: false, error: "No active plan to cancel" };
    await this.clearPlanBuffs(
      telegramId,
      (sub as unknown as { planBuffs?: string[] }).planBuffs || [],
    );
    return { success: true, sub: this.publicSub(sub) };
  }

  // ── Stats + ROI (1 / 7 / 30 days) ──────────────────────────────────────
  async stats(telegramId: string, days: number) {
    const n = [1, 7, 30].includes(days) ? days : 7;
    const sub = await this.subModel.findOne({ telegramId }).lean().exec();
    const rows: Array<{
      date: string;
      stone: { runs: number; elixirValue: number };
      casebox: { runs: number; elixirValue: number };
      earned: Record<string, number>;
    }> = [];
    let earnedTotal = 0;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const docs = await this.dayModel
        .find({ telegramId, date: key })
        .lean()
        .exec();
      const byTarget: Record<
        string,
        { runs: number; elixirValue: number; earned: Record<string, number> }
      > = {
        stone: { runs: 0, elixirValue: 0, earned: {} },
        casebox: { runs: 0, elixirValue: 0, earned: {} },
      };
      for (const doc of docs) {
        const t: string = doc.target === "casebox" ? "casebox" : "stone";
        byTarget[t].runs += doc.runs || 0;
        byTarget[t].elixirValue += doc.elixirValue || 0;
        for (const [k, v] of Object.entries(doc.earned || {})) {
          byTarget[t].earned[k] = (byTarget[t].earned[k] || 0) + v;
        }
      }
      const merged: Record<string, number> = {};
      for (const t of ["stone", "casebox"]) {
        for (const [k, v] of Object.entries(byTarget[t].earned))
          merged[k] = (merged[k] || 0) + v;
      }
      const dayValue =
        byTarget.stone.elixirValue + byTarget.casebox.elixirValue;
      earnedTotal += dayValue;
      rows.push({
        date: key,
        stone: byTarget.stone,
        casebox: byTarget.casebox,
        earned: merged,
      });
    }
    // ROI: earned vs pro-rated fee share over the sub window ∩ requested range.
    let feeShare = 0;
    if (sub) {
      const now = Date.now();
      const rangeStart = Date.now() - n * 24 * 3600 * 1000;
      const overlapStart = Math.max(
        new Date((sub as unknown as { startDate: string }).startDate).getTime(),
        rangeStart,
      );
      const overlapEnd = Math.min(
        new Date((sub as unknown as { endDate: string }).endDate).getTime(),
        now,
      );
      const overlapDays = Math.max(
        0,
        (overlapEnd - overlapStart) / (24 * 3600 * 1000),
      );
      feeShare =
        (((sub as unknown as { feePaid: number }).feePaid || 0) /
          AUTO_PLAN_DAYS) *
        overlapDays;
    }
    const roiPct =
      feeShare > 0
        ? ((earnedTotal - feeShare) / feeShare) * 100
        : earnedTotal > 0
          ? 100
          : 0;
    return {
      success: true,
      days: n,
      rows,
      totals: {
        runs: rows.reduce((s, r) => s + r.stone.runs + r.casebox.runs, 0),
        elixirValue: Math.round(earnedTotal * 100) / 100,
        feeShare: Math.round(feeShare * 100) / 100,
        roiPct: Math.round(roiPct * 10) / 10,
      },
    };
  }

  // ── Runner (every minute) ──────────────────────────────────────────────
  @Cron(CronExpression.EVERY_MINUTE)
  async runDuePlans() {
    const now = Date.now();
    // Sweeper: expire finished plans (and release their buffs) even if the
    // user never opens the app again.
    try {
      const overdue = await this.subModel
        .find({ status: "active", endDate: { $lte: new Date(now) } })
        .lean()
        .exec();
      await Promise.allSettled(
        overdue.map(async (s) => {
          await this.clearPlanBuffs(s.telegramId, s.planBuffs || []);
          await this.subModel
            .updateOne(
              { telegramId: s.telegramId },
              { $set: { status: "expired", autopilotOn: false } },
            )
            .exec();
        }),
      );
    } catch (e) {
      this.logger.error(
        `auto-mining expiry sweep failed: ${(e as Error)?.message}`,
      );
    }
    let subs: unknown[] = [];
    try {
      subs = await this.subModel
        .find({
          status: "active",
          autopilotOn: true,
          startDate: { $lte: new Date(now) },
          endDate: { $gt: new Date(now) },
        })
        .lean()
        .exec();
    } catch (e) {
      this.logger.error(
        `auto-mining tick query failed: ${(e as Error)?.message}`,
      );
      return;
    }
    await Promise.allSettled(
      subs.map((s) => this.runDuePlan(s as Record<string, unknown>)),
    );
  }

  private async runDuePlan(sub: Record<string, unknown>) {
    const telegramId = sub["telegramId"] as string;
    const now = Date.now();
    try {
      const quota = (sub["dailyQuota"] as number) || AUTO_DAILY_QUOTA;
      const today = dateKey();
      const [stoneDoc, caseDoc] = await Promise.all([
        this.dayModel
          .findOne({ telegramId, date: today, target: "stone" })
          .lean()
          .exec(),
        this.dayModel
          .findOne({ telegramId, date: today, target: "casebox" })
          .lean()
          .exec(),
      ]);
      const usedStone = stoneDoc?.runs ?? 0;
      const usedCase = caseDoc?.runs ?? 0;
      if (usedStone + usedCase >= quota) return; // daily cap reached
      const lastRun = sub["lastRunAt"]
        ? new Date(sub["lastRunAt"] as string).getTime()
        : 0;
      if (now - lastRun < Math.ceil((24 * 3600 * 1000) / quota)) return; // spacing

      // Pick target (split honors per-target caps)
      const target = (sub["target"] as string) || "stone";
      let pick: "stone" | "casebox" =
        target === "casebox" ? "casebox" : "stone";
      if (target === "split") {
        const pct = (sub["splitStonePct"] as number) ?? 50;
        const stoneCap = Math.round((quota * pct) / 100);
        const caseCap = quota - stoneCap;
        if (usedStone < stoneCap) pick = "stone";
        else if (usedCase < caseCap) pick = "casebox";
        else pick = usedStone <= usedCase ? "stone" : "casebox"; // rounding slack
      }

      // Never touch the user's live manual session.
      if (pick === "stone") {
        const busy = await this.stoneModel.exists({
          telegramId,
          status: "active",
        });
        if (busy) {
          await this.bumpSkipped(telegramId, today, "stone");
          return;
        }
        await this.runStone(telegramId, today);
      } else {
        const busy = await this.caseModel.exists({
          telegramId,
          status: "active",
        });
        if (busy) {
          await this.bumpSkipped(telegramId, today, "casebox");
          return;
        }
        await this.runCase(telegramId, today);
      }
    } catch (e) {
      this.logger.error(
        `auto-mining run failed for ${telegramId}: ${(e as Error)?.message}`,
      );
    }
  }

  // Autopilot NEVER sells: rewards always land in the main balances
  // (cryptoBalances resources / materials / buffs / case ELIXCOIN).
  // Instant auto-cash would turn the bot into a money printer; converting
  // to liquid stays a deliberate manual step (with its own sinks).
  private async runStone(telegramId: string, today: string) {
    const spawn = (await this.minerStoneService.spawn(
      telegramId,
    )) as unknown as {
      success: boolean;
      stone?: { stoneId: string; tier: string; maxHp: number };
      error?: string;
    };
    if (!spawn?.success || !spawn?.stone?.stoneId) {
      await this.bumpSkipped(telegramId, today, "stone");
      await this.touchRun(telegramId);
      return;
    }
    // Fresh-spawn guard: abort if this session predates the run (manual).
    try {
      const doc = (await this.stoneModel
        .findById(spawn.stone.stoneId)
        .lean()
        .exec()) as unknown as {
        createdAt?: string | Date;
      } | null;
      const age = Date.now() - new Date(doc?.createdAt ?? 0).getTime();
      if (!Number.isFinite(age) || age > FRESH_SPAWN_MAX_AGE_MS) {
        await this.bumpSkipped(telegramId, today, "stone");
        await this.touchRun(telegramId);
        return;
      }
    } catch {
      /* fall through — destroy will fail safely if stale */
    }
    await sleep(destroyWaitMs(spawn.stone.maxHp ?? 0, 1500));
    const des = (await this.minerStoneService.destroy(
      telegramId,
      spawn.stone.stoneId,
    )) as unknown as {
      success: boolean;
      error?: string;
    };
    if (!des?.success) {
      await this.bumpSkipped(telegramId, today, "stone");
      await this.touchRun(telegramId);
      return;
    }
    const claim = (await this.minerStoneService.claimRewards(
      telegramId,
      spawn.stone.stoneId,
      "save",
      {
        autoRun: true,
      },
    )) as unknown as {
      success: boolean;
      credited?: Record<string, number>;
      error?: string;
    };
    if (!claim?.success) {
      await this.bumpSkipped(telegramId, today, "stone");
      await this.touchRun(telegramId);
      return;
    }
    const credited: Record<string, number> = claim.credited || {};
    await this.recordRun(telegramId, today, "stone", credited);
  }

  private async runCase(telegramId: string, today: string) {
    const spawn = (await this.caseBoxService.spawn(telegramId)) as unknown as {
      success: boolean;
      box?: { caseId: string; tier: string; maxHp: number };
      error?: string;
    };
    if (!spawn?.success || !spawn?.box?.caseId) {
      await this.bumpSkipped(telegramId, today, "casebox");
      await this.touchRun(telegramId);
      return;
    }
    try {
      const doc = (await this.caseModel
        .findById(spawn.box.caseId)
        .lean()
        .exec()) as unknown as {
        createdAt?: string | Date;
      } | null;
      const age = Date.now() - new Date(doc?.createdAt ?? 0).getTime();
      if (!Number.isFinite(age) || age > FRESH_SPAWN_MAX_AGE_MS) {
        await this.bumpSkipped(telegramId, today, "casebox");
        await this.touchRun(telegramId);
        return;
      }
    } catch {
      /* fall through */
    }
    await sleep(destroyWaitMs(spawn.box.maxHp ?? 0, 1700));
    const des = (await this.caseBoxService.destroy(
      telegramId,
      spawn.box.caseId,
    )) as unknown as {
      success: boolean;
      outcome?: string;
      loot?: Record<string, number>;
      error?: string;
    };
    if (!des?.success) {
      await this.bumpSkipped(telegramId, today, "casebox");
      await this.touchRun(telegramId);
      return;
    }
    const claim = (await this.caseBoxService.claimCase(
      spawn.box.caseId,
      telegramId,
      { autoRun: true },
    )) as unknown as {
      success: boolean;
      error?: string;
    };
    if (!claim?.success) {
      await this.bumpSkipped(telegramId, today, "casebox");
      await this.touchRun(telegramId);
      return;
    }
    // Stats from the destroy loot (claim auto-credits to bag/materials/buffs)
    const earned: Record<string, number> = {};
    const loot: Record<string, number> = des.loot || {};
    for (const [k, v] of Object.entries(loot)) {
      if (k.startsWith("__")) continue;
      earned[k] = (earned[k] || 0) + (Number(v) || 0);
    }
    if (des.outcome === "BUFF") earned["BUFF"] = (earned["BUFF"] || 0) + 1;
    await this.recordRun(telegramId, today, "casebox", earned);
  }

  // ── Ledger helpers ─────────────────────────────────────────────────────
  private elixirValueOf(credited: Record<string, number>): number {
    // Documented estimate: minerals → ELIXCOIN via ELIX_RATES, then ELIXCOIN
    // → ELIXIR at the spot anchor. Materials/buffs carry no estimate.
    let elixcoin = credited["ELIXCOIN"] || 0;
    for (const [k, v] of Object.entries(credited)) {
      if (k === "ELIXCOIN" || k === "BUFF") continue;
      const rate = ELIX_RATES[k] || 0;
      elixcoin += (Number(v) || 0) * rate;
    }
    return Math.round(elixcoin * ELIXCOIN_TO_ELIXIR * 100) / 100;
  }

  private async recordRun(
    telegramId: string,
    date: string,
    target: string,
    earned: Record<string, number>,
  ) {
    const value = this.elixirValueOf(earned);
    const inc: Record<string, number> = { runs: 1, elixirValue: value };
    for (const [k, v] of Object.entries(earned))
      inc[`earned.${k}`] = Number(v) || 0;
    await this.dayModel
      .findOneAndUpdate(
        { telegramId, date, target },
        { $inc: inc },
        { upsert: true },
      )
      .exec();
    await this.subModel
      .updateOne(
        { telegramId },
        {
          $inc: { totalRuns: 1, totalElixirValue: value },
          $set: { lastRunAt: new Date() },
        },
      )
      .exec();
  }

  private async bumpSkipped(telegramId: string, date: string, target: string) {
    await this.dayModel
      .findOneAndUpdate(
        { telegramId, date, target },
        { $inc: { skipped: 1 } },
        { upsert: true },
      )
      .exec();
  }

  private async touchRun(telegramId: string) {
    await this.subModel
      .updateOne({ telegramId }, { $set: { lastRunAt: new Date() } })
      .exec();
  }

  private publicSub(sub: unknown) {
    const s = sub as Record<string, unknown>;
    return {
      status: s["status"],
      planDays: s["planDays"],
      feePaid: s["feePaid"],
      claimMode: s["claimMode"],
      target: s["target"],
      splitStonePct: s["splitStonePct"],
      startDate: s["startDate"],
      endDate: s["endDate"],
      dailyQuota: s["dailyQuota"],
      autopilotOn: s["autopilotOn"],
      lastRunAt: s["lastRunAt"],
      totalRuns: s["totalRuns"],
      totalElixirValue: s["totalElixirValue"],
      favPickaxe: s["favPickaxe"] ?? null,
      planBuffs: s["planBuffs"] ?? [],
    };
  }
}
