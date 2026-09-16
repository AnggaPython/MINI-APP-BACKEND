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
var AutoMiningService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoMiningService = exports.AUTO_DAILY_QUOTA = exports.AUTO_PLAN_DAYS = exports.AUTO_PLAN_FEE_ELIXIR = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const schedule_1 = require("@nestjs/schedule");
const mongoose_2 = require("mongoose");
const miner_stone_service_1 = require("../miner-stone/miner-stone.service");
const case_box_service_1 = require("../case-box/case-box.service");
const buff_item_collections_service_1 = require("../buff-item-collections/buff-item-collections.service");
const user_schema_1 = require("../users/schemas/user.schema");
const mining_stone_schema_1 = require("../miner-stone/schemas/mining-stone.schema");
const case_box_schema_1 = require("../case-box/schemas/case-box.schema");
const auto_mining_schema_1 = require("./schemas/auto-mining.schema");
exports.AUTO_PLAN_FEE_ELIXIR = 250_000;
exports.AUTO_PLAN_DAYS = 30;
exports.AUTO_DAILY_QUOTA = 500;
const FRESH_SPAWN_MAX_AGE_MS = 30_000;
const DESTROY_BUFFER_MS = 1200;
const ELIXCOIN_TO_ELIXIR = 0.09674384;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function dateKey(d = new Date()) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function destroyWaitMs(maxHp, hitIntervalMs) {
    const minHits = Math.ceil(Math.max(0, maxHp) / 120);
    return Math.max(0, (minHits - 1) * hitIntervalMs - 500) + DESTROY_BUFFER_MS;
}
let AutoMiningService = AutoMiningService_1 = class AutoMiningService {
    subModel;
    dayModel;
    userModel;
    stoneModel;
    caseModel;
    minerStoneService;
    caseBoxService;
    buffService;
    logger = new common_1.Logger(AutoMiningService_1.name);
    constructor(subModel, dayModel, userModel, stoneModel, caseModel, minerStoneService, caseBoxService, buffService) {
        this.subModel = subModel;
        this.dayModel = dayModel;
        this.userModel = userModel;
        this.stoneModel = stoneModel;
        this.caseModel = caseModel;
        this.minerStoneService = minerStoneService;
        this.caseBoxService = caseBoxService;
        this.buffService = buffService;
    }
    async subscribe(telegramId, opts) {
        const target = (opts.target || "stone");
        if (!["stone", "casebox", "split"].includes(target)) {
            return {
                success: false,
                error: "Invalid target (stone | casebox | split)",
            };
        }
        const claimMode = "save";
        let splitStonePct = 50;
        if (target === "split") {
            splitStonePct = Math.round(Number(opts.splitStonePct ?? 50));
            if (!Number.isFinite(splitStonePct) ||
                splitStonePct < 10 ||
                splitStonePct > 90) {
                return {
                    success: false,
                    error: "Split must be 10–90% for miner-stone",
                };
            }
        }
        const now = Date.now();
        const start = opts.startDate ? new Date(opts.startDate) : new Date(now);
        if (isNaN(start.getTime()))
            return { success: false, error: "Invalid start date" };
        if (start.getTime() < now - 5 * 60 * 1000) {
            return { success: false, error: "Start date cannot be in the past" };
        }
        if (start.getTime() > now + 7 * 24 * 3600 * 1000) {
            return { success: false, error: "Start date is at most 7 days ahead" };
        }
        const maxEnd = start.getTime() + exports.AUTO_PLAN_DAYS * 24 * 3600 * 1000;
        const end = opts.stopDate ? new Date(opts.stopDate) : new Date(maxEnd);
        if (isNaN(end.getTime()))
            return { success: false, error: "Invalid stop date" };
        if (end.getTime() <= start.getTime()) {
            return { success: false, error: "Stop date must be after start date" };
        }
        if (end.getTime() > maxEnd + 60 * 1000) {
            return {
                success: false,
                error: `Plan covers at most ${exports.AUTO_PLAN_DAYS} days from start`,
            };
        }
        const existing = await this.subModel.findOne({ telegramId }).lean().exec();
        if (existing &&
            (existing.status === "active" || existing.status === "paused") &&
            new Date(existing.endDate).getTime() > now) {
            return {
                success: false,
                error: "Plan already active — cancel it first to start a new one",
            };
        }
        let reserved = false;
        try {
            const reservation = await this.subModel
                .findOneAndUpdate({
                telegramId,
                $or: [
                    { status: { $in: ["cancelled", "expired"] } },
                    { endDate: { $lte: new Date(now) } },
                    { status: "reserving", reservedAt: { $lte: new Date(now - 60_000) } },
                    { status: { $exists: false } },
                ],
            }, { $set: { status: "reserving", reservedAt: new Date(now), feePaid: 0 } }, { upsert: true, returnDocument: "after" })
                .exec();
            reserved = Boolean(reservation);
        }
        catch (err) {
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
        const wantBuffs = Array.isArray(opts.buffIds)
            ? [...new Set(opts.buffIds.map(String))].slice(0, 6)
            : [];
        if (Array.isArray(opts.buffIds) && opts.buffIds.length > 6) {
            return { success: false, error: "At most 6 buffs per plan" };
        }
        let favPickaxe = null;
        if (opts.favPickaxe) {
            const owner = (await this.userModel
                .findOne({ telegramId })
                .lean()
                .exec());
            const owned = owner?.ownedPickaxes?.length
                ? owner.ownedPickaxes
                : ["Common"];
            if (!owned.includes(String(opts.favPickaxe))) {
                return { success: false, error: "Pickaxe not owned" };
            }
            favPickaxe = String(opts.favPickaxe);
        }
        const PLAN_BUFF_TYPES = ["ECONOMY", "DROPRATE"];
        if (wantBuffs.length > 0) {
            try {
                const col = (await this.buffService.getUserCollection(telegramId));
                const ownedSet = new Set((col?.ownedItems || []).map((i) => i.baseItemId));
                const typeOf = new Map((col?.ownedItems || []).map((i) => [i.baseItemId, i.buffType]));
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
            }
            catch (e) {
                return {
                    success: false,
                    error: `Buff check failed: ${e?.message || "unknown"}`,
                };
            }
        }
        const charged = await this.userModel
            .findOneAndUpdate({ telegramId, elixirBalance: { $gte: exports.AUTO_PLAN_FEE_ELIXIR } }, { $inc: { elixirBalance: -exports.AUTO_PLAN_FEE_ELIXIR } }, { returnDocument: "after" })
            .exec();
        if (!charged) {
            await this.subModel
                .updateOne({ telegramId, status: "reserving" }, { $set: { status: "cancelled" } })
                .exec();
            return {
                success: false,
                error: `Need ${exports.AUTO_PLAN_FEE_ELIXIR.toLocaleString()} ELIXIR to start`,
            };
        }
        await this.subModel
            .findOneAndUpdate({ telegramId }, {
            $set: {
                status: "active",
                planDays: exports.AUTO_PLAN_DAYS,
                feePaid: exports.AUTO_PLAN_FEE_ELIXIR,
                claimMode,
                target,
                splitStonePct,
                startDate: start,
                endDate: end,
                dailyQuota: exports.AUTO_DAILY_QUOTA,
                autopilotOn: true,
                lastRunAt: null,
                totalRuns: 0,
                totalElixirValue: 0,
                favPickaxe,
                planBuffs: [],
            },
        }, { upsert: true, returnDocument: "after" })
            .exec();
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
    async setPlanBuffs(telegramId, buffIds) {
        try {
            const col = (await this.buffService.getUserCollection(telegramId));
            const owned = new Set((col?.ownedItems || []).map((i) => i.baseItemId));
            for (const b of buffIds) {
                if (!owned.has(b))
                    return { success: false, error: `Buff not owned: ${b}` };
            }
            for (const a of (col?.activeItems || [])) {
                try {
                    await this.buffService.deactivateBuff(telegramId, a.baseItemId);
                }
                catch {
                }
            }
            const activated = [];
            for (const b of buffIds) {
                try {
                    const r = (await this.buffService.activateBuff(telegramId, b));
                    if (r?.success)
                        activated.push(b);
                }
                catch {
                }
            }
            return { success: true, activated };
        }
        catch (e) {
            return {
                success: false,
                error: `Buff setup failed: ${e?.message || "unknown"}`,
            };
        }
    }
    async clearPlanBuffs(telegramId, planBuffs) {
        if (!planBuffs || planBuffs.length === 0)
            return;
        for (const b of planBuffs) {
            try {
                await this.buffService.deactivateBuff(telegramId, b);
            }
            catch {
            }
        }
    }
    async status(telegramId) {
        const sub = await this.subModel.findOne({ telegramId }).lean().exec();
        if (!sub)
            return { success: true, sub: null };
        const now = Date.now();
        const live = {
            ...sub,
        };
        if (live["status"] === "active" &&
            new Date(live["endDate"]).getTime() <= now) {
            live["status"] = "expired";
            await this.subModel
                .updateOne({ telegramId }, { $set: { status: "expired", autopilotOn: false } })
                .exec();
            await this.clearPlanBuffs(telegramId, live["planBuffs"] || []);
        }
        const today = dateKey();
        const days = await this.dayModel
            .find({ telegramId, date: today })
            .lean()
            .exec();
        const usedStone = days.find((d) => d.target === "stone")?.runs ?? 0;
        const usedCase = days.find((d) => d.target === "casebox")?.runs ?? 0;
        const used = usedStone + usedCase;
        const quota = live["dailyQuota"] || exports.AUTO_DAILY_QUOTA;
        const startMs = new Date(live["startDate"]).getTime();
        const endMs = new Date(live["endDate"]).getTime();
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
    async toggle(telegramId, on) {
        const sub = await this.subModel
            .findOneAndUpdate({ telegramId, status: { $in: ["active", "paused"] } }, { $set: { autopilotOn: on, status: on ? "active" : "paused" } }, { returnDocument: "after" })
            .exec();
        if (!sub)
            return {
                success: false,
                error: "No plan to toggle (expired or cancelled)",
            };
        return { success: true, sub: this.publicSub(sub) };
    }
    async cancel(telegramId) {
        const sub = await this.subModel
            .findOneAndUpdate({ telegramId, status: { $in: ["active", "paused"] } }, { $set: { status: "cancelled", autopilotOn: false } }, { returnDocument: "after" })
            .exec();
        if (!sub)
            return { success: false, error: "No active plan to cancel" };
        await this.clearPlanBuffs(telegramId, sub.planBuffs || []);
        return { success: true, sub: this.publicSub(sub) };
    }
    async stats(telegramId, days) {
        const n = [1, 7, 30].includes(days) ? days : 7;
        const sub = await this.subModel.findOne({ telegramId }).lean().exec();
        const rows = [];
        let earnedTotal = 0;
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = dateKey(d);
            const docs = await this.dayModel
                .find({ telegramId, date: key })
                .lean()
                .exec();
            const byTarget = {
                stone: { runs: 0, elixirValue: 0, earned: {} },
                casebox: { runs: 0, elixirValue: 0, earned: {} },
            };
            for (const doc of docs) {
                const t = doc.target === "casebox" ? "casebox" : "stone";
                byTarget[t].runs += doc.runs || 0;
                byTarget[t].elixirValue += doc.elixirValue || 0;
                for (const [k, v] of Object.entries(doc.earned || {})) {
                    byTarget[t].earned[k] = (byTarget[t].earned[k] || 0) + v;
                }
            }
            const merged = {};
            for (const t of ["stone", "casebox"]) {
                for (const [k, v] of Object.entries(byTarget[t].earned))
                    merged[k] = (merged[k] || 0) + v;
            }
            const dayValue = byTarget.stone.elixirValue + byTarget.casebox.elixirValue;
            earnedTotal += dayValue;
            rows.push({
                date: key,
                stone: byTarget.stone,
                casebox: byTarget.casebox,
                earned: merged,
            });
        }
        let feeShare = 0;
        if (sub) {
            const now = Date.now();
            const rangeStart = Date.now() - n * 24 * 3600 * 1000;
            const overlapStart = Math.max(new Date(sub.startDate).getTime(), rangeStart);
            const overlapEnd = Math.min(new Date(sub.endDate).getTime(), now);
            const overlapDays = Math.max(0, (overlapEnd - overlapStart) / (24 * 3600 * 1000));
            feeShare =
                ((sub.feePaid || 0) /
                    exports.AUTO_PLAN_DAYS) *
                    overlapDays;
        }
        const roiPct = feeShare > 0
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
    async runDuePlans() {
        const now = Date.now();
        try {
            const overdue = await this.subModel
                .find({ status: "active", endDate: { $lte: new Date(now) } })
                .lean()
                .exec();
            await Promise.allSettled(overdue.map(async (s) => {
                await this.clearPlanBuffs(s.telegramId, s.planBuffs || []);
                await this.subModel
                    .updateOne({ telegramId: s.telegramId }, { $set: { status: "expired", autopilotOn: false } })
                    .exec();
            }));
        }
        catch (e) {
            this.logger.error(`auto-mining expiry sweep failed: ${e?.message}`);
        }
        let subs = [];
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
        }
        catch (e) {
            this.logger.error(`auto-mining tick query failed: ${e?.message}`);
            return;
        }
        await Promise.allSettled(subs.map((s) => this.runDuePlan(s)));
    }
    async runDuePlan(sub) {
        const telegramId = sub["telegramId"];
        const now = Date.now();
        try {
            const quota = sub["dailyQuota"] || exports.AUTO_DAILY_QUOTA;
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
            if (usedStone + usedCase >= quota)
                return;
            const lastRun = sub["lastRunAt"]
                ? new Date(sub["lastRunAt"]).getTime()
                : 0;
            if (now - lastRun < Math.ceil((24 * 3600 * 1000) / quota))
                return;
            const target = sub["target"] || "stone";
            let pick = target === "casebox" ? "casebox" : "stone";
            if (target === "split") {
                const pct = sub["splitStonePct"] ?? 50;
                const stoneCap = Math.round((quota * pct) / 100);
                const caseCap = quota - stoneCap;
                if (usedStone < stoneCap)
                    pick = "stone";
                else if (usedCase < caseCap)
                    pick = "casebox";
                else
                    pick = usedStone <= usedCase ? "stone" : "casebox";
            }
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
            }
            else {
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
        }
        catch (e) {
            this.logger.error(`auto-mining run failed for ${telegramId}: ${e?.message}`);
        }
    }
    async runStone(telegramId, today) {
        const spawn = (await this.minerStoneService.spawn(telegramId));
        if (!spawn?.success || !spawn?.stone?.stoneId) {
            await this.bumpSkipped(telegramId, today, "stone");
            await this.touchRun(telegramId);
            return;
        }
        try {
            const doc = (await this.stoneModel
                .findById(spawn.stone.stoneId)
                .lean()
                .exec());
            const age = Date.now() - new Date(doc?.createdAt ?? 0).getTime();
            if (!Number.isFinite(age) || age > FRESH_SPAWN_MAX_AGE_MS) {
                await this.bumpSkipped(telegramId, today, "stone");
                await this.touchRun(telegramId);
                return;
            }
        }
        catch {
        }
        await sleep(destroyWaitMs(spawn.stone.maxHp ?? 0, 1500));
        const des = (await this.minerStoneService.destroy(telegramId, spawn.stone.stoneId));
        if (!des?.success) {
            await this.bumpSkipped(telegramId, today, "stone");
            await this.touchRun(telegramId);
            return;
        }
        const claim = (await this.minerStoneService.claimRewards(telegramId, spawn.stone.stoneId, "save", {
            autoRun: true,
        }));
        if (!claim?.success) {
            await this.bumpSkipped(telegramId, today, "stone");
            await this.touchRun(telegramId);
            return;
        }
        const credited = claim.credited || {};
        await this.recordRun(telegramId, today, "stone", credited);
    }
    async runCase(telegramId, today) {
        const spawn = (await this.caseBoxService.spawn(telegramId));
        if (!spawn?.success || !spawn?.box?.caseId) {
            await this.bumpSkipped(telegramId, today, "casebox");
            await this.touchRun(telegramId);
            return;
        }
        try {
            const doc = (await this.caseModel
                .findById(spawn.box.caseId)
                .lean()
                .exec());
            const age = Date.now() - new Date(doc?.createdAt ?? 0).getTime();
            if (!Number.isFinite(age) || age > FRESH_SPAWN_MAX_AGE_MS) {
                await this.bumpSkipped(telegramId, today, "casebox");
                await this.touchRun(telegramId);
                return;
            }
        }
        catch {
        }
        await sleep(destroyWaitMs(spawn.box.maxHp ?? 0, 1700));
        const des = (await this.caseBoxService.destroy(telegramId, spawn.box.caseId));
        if (!des?.success) {
            await this.bumpSkipped(telegramId, today, "casebox");
            await this.touchRun(telegramId);
            return;
        }
        const claim = (await this.caseBoxService.claimCase(spawn.box.caseId, telegramId, { autoRun: true }));
        if (!claim?.success) {
            await this.bumpSkipped(telegramId, today, "casebox");
            await this.touchRun(telegramId);
            return;
        }
        const earned = {};
        const loot = des.loot || {};
        for (const [k, v] of Object.entries(loot)) {
            if (k.startsWith("__"))
                continue;
            earned[k] = (earned[k] || 0) + (Number(v) || 0);
        }
        if (des.outcome === "BUFF")
            earned["BUFF"] = (earned["BUFF"] || 0) + 1;
        await this.recordRun(telegramId, today, "casebox", earned);
    }
    elixirValueOf(credited) {
        let elixcoin = credited["ELIXCOIN"] || 0;
        for (const [k, v] of Object.entries(credited)) {
            if (k === "ELIXCOIN" || k === "BUFF")
                continue;
            const rate = miner_stone_service_1.ELIX_RATES[k] || 0;
            elixcoin += (Number(v) || 0) * rate;
        }
        return Math.round(elixcoin * ELIXCOIN_TO_ELIXIR * 100) / 100;
    }
    async recordRun(telegramId, date, target, earned) {
        const value = this.elixirValueOf(earned);
        const inc = { runs: 1, elixirValue: value };
        for (const [k, v] of Object.entries(earned))
            inc[`earned.${k}`] = Number(v) || 0;
        await this.dayModel
            .findOneAndUpdate({ telegramId, date, target }, { $inc: inc }, { upsert: true })
            .exec();
        await this.subModel
            .updateOne({ telegramId }, {
            $inc: { totalRuns: 1, totalElixirValue: value },
            $set: { lastRunAt: new Date() },
        })
            .exec();
    }
    async bumpSkipped(telegramId, date, target) {
        await this.dayModel
            .findOneAndUpdate({ telegramId, date, target }, { $inc: { skipped: 1 } }, { upsert: true })
            .exec();
    }
    async touchRun(telegramId) {
        await this.subModel
            .updateOne({ telegramId }, { $set: { lastRunAt: new Date() } })
            .exec();
    }
    publicSub(sub) {
        const s = sub;
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
};
exports.AutoMiningService = AutoMiningService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutoMiningService.prototype, "runDuePlans", null);
exports.AutoMiningService = AutoMiningService = AutoMiningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(auto_mining_schema_1.AutoMiningSub.name)),
    __param(1, (0, mongoose_1.InjectModel)(auto_mining_schema_1.AutoMiningDay.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, mongoose_1.InjectModel)(mining_stone_schema_1.MiningStone.name)),
    __param(4, (0, mongoose_1.InjectModel)(case_box_schema_1.CaseBox.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        miner_stone_service_1.MinerStoneService,
        case_box_service_1.CaseBoxService,
        buff_item_collections_service_1.BuffItemCollectionsService])
], AutoMiningService);
//# sourceMappingURL=auto-mining.service.js.map