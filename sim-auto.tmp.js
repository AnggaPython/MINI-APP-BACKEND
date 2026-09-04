"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const auto_mining_service_1 = require("./src/auto-mining/auto-mining.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const mining_stone_schema_1 = require("./src/miner-stone/schemas/mining-stone.schema");
const case_box_schema_1 = require("./src/case-box/schemas/case-box.schema");
const auto_mining_schema_1 = require("./src/auto-mining/schemas/auto-mining.schema");
const SIM = "SIM_AUTO_006";
const fails = [];
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c)
    fails.push(m); };
const OLD = (ms) => new Date(Date.now() - ms);
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const stoneModel = mongoose_1.default.model("MiningStone", mining_stone_schema_1.MiningStoneSchema);
    const caseModel = mongoose_1.default.model("CaseBox", case_box_schema_1.CaseBoxSchema);
    const subModel = mongoose_1.default.model("AutoMiningSub", auto_mining_schema_1.AutoMiningSubSchema);
    const dayModel = mongoose_1.default.model("AutoMiningDay", auto_mining_schema_1.AutoMiningDaySchema);
    const rawStone = mongoose_1.default.connection.db.collection("miningstones");
    const rawCase = mongoose_1.default.connection.db.collection("caseboxes");
    await rawStone.deleteMany({ telegramId: SIM });
    await rawCase.deleteMany({ telegramId: SIM });
    const fakeMiner = {
        spawn: async () => {
            const id = new mongoose_1.default.Types.ObjectId();
            await rawStone.insertOne({ _id: id, telegramId: SIM, status: "active", tier: "Common", maxHp: 40, createdAt: new Date() });
            return { success: true, stone: { stoneId: id.toString(), tier: "Common", maxHp: 40 } };
        },
        destroy: async () => {
            await rawStone.deleteMany({ telegramId: SIM, status: "active" });
            return { success: true };
        },
        claimRewards: async () => ({ success: true, credited: { IRON: 55, COPPER: 27 } }),
    };
    const fakeCase = {
        spawn: async () => {
            const id = new mongoose_1.default.Types.ObjectId();
            await rawCase.insertOne({ _id: id, telegramId: SIM, status: "active", tier: "COMMON", maxHp: 90, createdAt: new Date() });
            return { success: true, box: { caseId: id.toString(), tier: "COMMON", maxHp: 90 } };
        },
        destroy: async () => {
            await rawCase.deleteMany({ telegramId: SIM, status: "active" });
            return { success: true, outcome: "MATERIAL", loot: { "Rusty Nail": 2 } };
        },
        claimCase: async () => ({ success: true }),
    };
    const svc = new auto_mining_service_1.AutoMiningService(subModel, dayModel, userModel, stoneModel, caseModel, fakeMiner, fakeCase);
    await userModel.deleteOne({ telegramId: SIM }).exec();
    await subModel.deleteOne({ telegramId: SIM }).exec();
    await dayModel.deleteMany({ telegramId: SIM }).exec();
    await userModel.create({ telegramId: SIM, level: 10, elixirBalance: 1000 });
    let r = await svc.subscribe(SIM, { target: "nope" });
    ok(!r.success, "T1 bad target rejected");
    r = await svc.subscribe(SIM, { target: "split", splitStonePct: 5 });
    ok(!r.success, "T1 split pct 5 rejected");
    r = await svc.subscribe(SIM, { target: "stone", startDate: new Date().toISOString(), stopDate: new Date(Date.now() - 1000).toISOString() });
    ok(!r.success, "T1 stop<=start rejected");
    r = await svc.subscribe(SIM, { target: "stone" });
    ok(!r.success && /ELIXIR/.test(r.error || ""), `T2 insufficient funds (got: ${r.error})`);
    await userModel.updateOne({ telegramId: SIM }, { $set: { elixirBalance: 300000 } }).exec();
    r = await svc.subscribe(SIM, { target: "stone", claimMode: "save" });
    ok(r.success && r.sub?.status === "active", "T2 subscribed");
    const u2 = await userModel.findOne({ telegramId: SIM }).lean().exec();
    ok(u2.elixirBalance === 50000, `T2 charged exactly 250000 (bal=${u2.elixirBalance})`);
    r = await svc.subscribe(SIM, { target: "casebox" });
    ok(!r.success, "T3 double subscribe rejected");
    const st = await svc.status(SIM);
    ok(st.sub && st.today.quota === 500 && st.today.left === 500 && st.daysLeft >= 29, "T3 status quota/days");
    await svc.toggle(SIM, false);
    await svc.runDuePlans();
    const d4 = await dayModel.find({ telegramId: SIM }).lean().exec();
    ok(d4.reduce((s, x) => s + x.runs, 0) === 0, "T4 paused -> no runs");
    const ton = await svc.toggle(SIM, true);
    ok(ton.success && ton.sub?.status === "active", "T4 re-enable works");
    await svc.runDuePlans();
    const s5 = await svc.status(SIM);
    ok(s5.today.used === 1 && s5.today.usedStone === 1, `T5 one stone run (used=${s5.today.used})`);
    await svc.runDuePlans();
    const s5b = await svc.status(SIM);
    ok(s5b.today.used === 1, "T5 spacing blocks immediate rerun");
    await subModel.updateOne({ telegramId: SIM }, { $set: { lastRunAt: OLD(600000) } }).exec();
    await rawStone.insertOne({ telegramId: SIM, status: "active", tier: "Common", maxHp: 40, createdAt: new Date() });
    await svc.runDuePlans();
    const d6 = await dayModel.findOne({ telegramId: SIM, target: "stone" }).lean().exec();
    const s6 = await svc.status(SIM);
    ok(s6.today.used === 1 && (d6?.skipped ?? 0) >= 1, `T6 busy session skipped (used=${s6.today.used}, skipped=${d6?.skipped})`);
    await rawStone.deleteMany({ telegramId: SIM });
    await svc.cancel(SIM);
    await userModel.updateOne({ telegramId: SIM }, { $set: { elixirBalance: 300000 } }).exec();
    r = await svc.subscribe(SIM, { target: "split", splitStonePct: 50 });
    ok(r.success, "T7 split subscribed");
    await subModel.updateOne({ telegramId: SIM }, { $set: { dailyQuota: 4 } }).exec();
    await dayModel.deleteMany({ telegramId: SIM }).exec();
    const seq = [];
    for (let i = 0; i < 5; i++) {
        await subModel.updateOne({ telegramId: SIM }, { $set: { lastRunAt: OLD(30_000_000) } }).exec();
        await svc.runDuePlans();
        const docs = await dayModel.find({ telegramId: SIM }).lean().exec();
        const su = docs.filter((x) => x.target === "stone").reduce((s, x) => s + x.runs, 0);
        const cu = docs.filter((x) => x.target === "casebox").reduce((s, x) => s + x.runs, 0);
        seq.push(`${su}/${cu}`);
    }
    console.log("T7 quota fill sequence (stone/case):", seq.join(" "));
    const fin = await dayModel.find({ telegramId: SIM }).lean().exec();
    const fs = fin.filter((x) => x.target === "stone").reduce((s, x) => s + x.runs, 0);
    const fc = fin.filter((x) => x.target === "casebox").reduce((s, x) => s + x.runs, 0);
    ok(fs === 2 && fc === 2, `T7 split 2/2 then capped at quota 4 (got ${fs}/${fc})`);
    const stats = await svc.stats(SIM, 7);
    const totRuns = stats.totals.runs;
    ok(totRuns === 4, `T8 totals runs=4 (got ${totRuns})`);
    const feeShare = 250000 / 30;
    const earned = stats.totals.elixirValue;
    const expectRoi = ((earned - feeShare) / feeShare) * 100;
    ok(Math.abs(stats.totals.roiPct - Math.round(expectRoi * 10) / 10) < 0.05, `T8 ROI math (earned=${earned}, roi=${stats.totals.roiPct})`);
    const allEarn = {};
    for (const row of stats.rows)
        for (const [k, v] of Object.entries(row.earned))
            allEarn[k] = (allEarn[k] || 0) + v;
    ok((allEarn["IRON"] || 0) === 110 && (allEarn["Rusty Nail"] || 0) === 4, `T8 earned merged ${JSON.stringify(allEarn)}`);
    await svc.cancel(SIM);
    await subModel.updateOne({ telegramId: SIM }, { $set: { lastRunAt: OLD(30_000_000) } }).exec();
    await svc.runDuePlans();
    const s9 = await svc.status(SIM);
    ok(s9.sub?.status === "cancelled", "T9 cancelled, runner skips");
    await userModel.deleteOne({ telegramId: SIM }).exec();
    await subModel.deleteOne({ telegramId: SIM }).exec();
    await dayModel.deleteMany({ telegramId: SIM }).exec();
    await rawStone.deleteMany({ telegramId: SIM });
    await rawCase.deleteMany({ telegramId: SIM });
    console.log(`FAILS=${fails.length}`);
    if (fails.length)
        process.exit(2);
    console.log("AUTO SIM ALL PASSED");
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-auto.tmp.js.map