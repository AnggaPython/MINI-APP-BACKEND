"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pickaxe_upgrade_service_1 = require("./src/pickaxe-upgraded/pickaxe-upgrade.service");
const leveling_service_1 = require("./src/leveling-miner/leveling.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const SIM_ID = "SIM_FULL_001";
const fails = [];
const ok = (cond, msg) => {
    console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
    if (!cond)
        fails.push(msg);
};
const TIERS = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const leveling = new leveling_service_1.LevelingService(userModel);
    const svc = new pickaxe_upgrade_service_1.PickaxeUpgradeService(userModel, leveling);
    const U = () => userModel.findOne({ telegramId: SIM_ID }).lean().exec();
    let mathOk = true;
    for (const t of TIERS) {
        for (let L = -5; L <= 25; L++) {
            const s = (0, pickaxe_upgrade_service_1.getUpgradeStats)(t, L);
            const c = Math.max(0, Math.min(L, 20));
            const expP = Math.round((pickaxe_upgrade_service_1.PICKAXE_BASE_STATS[t].power + pickaxe_upgrade_service_1.PICKAXE_UPGRADE_PER_LEVEL[t].powerPerLevel * c) * 100) / 100;
            const expD = pickaxe_upgrade_service_1.PICKAXE_BASE_STATS[t].maxDurability + Math.round(pickaxe_upgrade_service_1.PICKAXE_UPGRADE_PER_LEVEL[t].durabilityPerLevel * c);
            if (s.power !== expP || s.maxDurability !== expD) {
                mathOk = false;
                console.log("  math mismatch", t, L, s);
            }
        }
        const tot = (0, pickaxe_upgrade_service_1.getTotalUpgradeCost)(t, 7);
        const per = pickaxe_upgrade_service_1.PICKAXE_BASE_STATS;
        void per;
    }
    ok(mathOk, "PH0 getUpgradeStats exact 6 tiers x L(-5..25) + clamp");
    const tc = (0, pickaxe_upgrade_service_1.getTotalUpgradeCost)("Common", 7);
    ok(tc.IRON === 17500 && tc.COPPER === 7000 && !("materialRarity" in tc), "PH0 totalCost Common x7 excludes materialRarity");
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    await userModel.create({ telegramId: SIM_ID, level: 1, gameExp: 0, exp: 0, ownedPickaxes: ["Common"] });
    await userModel.updateOne({ telegramId: SIM_ID }, {
        $set: {
            "cryptoBalances.IRON": 50_000_000, "cryptoBalances.COPPER": 50_000_000,
            "cryptoBalances.SILVER": 50_000_000, "cryptoBalances.GOLD": 50_000_000,
            "cryptoBalances.DIAMOND": 50_000_000,
            "materials.Rusty Nail": 5000, "materials.Steel Alloy": 5000, "materials.Void Diamond": 5000,
        },
    }).exec();
    console.log("PH1 sim user created + funded");
    let stones = 0, crafts = 0;
    const grindTo = async (targetLevel, maxIter = 3000) => {
        let iter = 0;
        for (;;) {
            const u = await U();
            if ((u.level ?? 1) >= targetLevel)
                break;
            if (++iter > maxIter)
                throw new Error(`grindTo(${targetLevel}) exceeded iterations`);
            if (u.lockedLevel) {
                const c = await leveling.craftLevel(SIM_ID);
                if (!c.success)
                    throw new Error(`craft failed at ${u.lockedLevel}: ${c.error}`);
                crafts++;
                continue;
            }
            await leveling.awardStoneXp(SIM_ID, "Rare");
            stones++;
        }
    };
    const anomalyScan = async (tag) => {
        const u = await U();
        for (const [k, v] of Object.entries(u.cryptoBalances || {}))
            if (v < 0)
                ok(false, `${tag}: negative balance ${k}=${v}`);
        for (const [k, v] of Object.entries(u.materials || {}))
            if (v < 0)
                ok(false, `${tag}: negative material ${k}=${v}`);
        for (const [k, v] of Object.entries(u.pickaxeUpgrades || {}))
            if (v < 0 || v > 20)
                ok(false, `${tag}: level out of range ${k}=${v}`);
        for (const s of (u.unlockedPickaxeSkins || []))
            if (!/^(common|uncommon|rare|epic|legendary|mythic)-(10|15|20)$/.test(s))
                ok(false, `${tag}: bad skin id ${s}`);
        for (const [k, v] of Object.entries(u.activePickaxeSkins || {})) {
            if (!(u.unlockedPickaxeSkins || []).includes(v))
                ok(false, `${tag}: active skin not unlocked ${k}=${v}`);
        }
    };
    await grindTo(15);
    let u = await U();
    ok(!(u.ownedPickaxes || []).includes("Uncommon"), `PH2 Lv15 gate unmet -> no Uncommon (owned=${u.ownedPickaxes})`);
    ok((u.level ?? 0) >= 15, `PH2 reached Lv${u.level}`);
    await anomalyScan("PH2");
    for (let i = 1; i <= 5; i++) {
        const before = await U();
        const r = await svc.upgradePickaxe(SIM_ID, "Common");
        const after = await U();
        const expectSkin = pickaxe_upgrade_service_1.SKIN_MILESTONES.includes(i) ? `common-${i}` : null;
        ok(r.success && r.newLevel === i, `PH3 Common->${i} success`);
        ok((after.cryptoBalances.IRON ?? 0) === (before.cryptoBalances.IRON ?? 0) - 2500, `PH3 Common@${i} IRON -2500`);
        ok((after.cryptoBalances.COPPER ?? 0) === (before.cryptoBalances.COPPER ?? 0) - 1000, `PH3 Common@${i} COPPER -1000`);
        if (expectSkin)
            ok((r.skinUnlocked === expectSkin) && (after.unlockedPickaxeSkins || []).includes(expectSkin) && after.activePickaxeSkins?.Common === expectSkin, `PH3 skin ${expectSkin} unlocked+equipped`);
    }
    u = await U();
    ok((u.ownedPickaxes || []).includes("Uncommon"), "PH3 gate met on upgrade -> Uncommon granted");
    await anomalyScan("PH3");
    const gates = [
        [25, "Uncommon", "Rare", 5], [40, "Rare", "Epic", 10], [55, "Epic", "Legendary", 5], [70, "Legendary", "Mythic", 5],
    ];
    for (const [lv, prev, next, need] of gates) {
        await grindTo(lv);
        u = await U();
        ok(!(u.ownedPickaxes || []).includes(next), `PH4 Lv${lv} gate unmet -> no ${next}`);
        for (let i = 1; i <= need; i++) {
            const r = await svc.upgradePickaxe(SIM_ID, prev);
            if (!r.success) {
                ok(false, `PH4 ${prev}->${i}: ${r.error}`);
                break;
            }
            if (i === need)
                ok((r.pickaxeGrants || []).includes(next), `PH4 ${prev} Lv${need} -> ${next} granted via upgrade`);
        }
        u = await U();
        ok((u.ownedPickaxes || []).includes(next), `PH4 ${next} owned after gate`);
        await anomalyScan(`PH4-${next}`);
    }
    const COST = { IRON: 2500, COPPER: 1000 };
    for (let i = 6; i <= 20; i++) {
        const before = await U();
        const r = await svc.upgradePickaxe(SIM_ID, "Common");
        const after = await U();
        if (!r.success) {
            ok(false, `PH5 Common->${i}: ${r.error}`);
            break;
        }
        const expStats = (0, pickaxe_upgrade_service_1.getUpgradeStats)("Common", i);
        ok(r.newLevel === i && r.stats.power === expStats.power && r.stats.maxDurability === expStats.maxDurability, `PH5 Common@${i} stats match`);
        ok((after.cryptoBalances.IRON ?? 0) === (before.cryptoBalances.IRON ?? 0) - COST.IRON, `PH5 Common@${i} exact IRON`);
        if (pickaxe_upgrade_service_1.SKIN_MILESTONES.includes(i)) {
            ok(r.skinUnlocked === `common-${i}` && after.activePickaxeSkins?.Common === `common-${i}`, `PH5 skin common-${i}`);
        }
    }
    u = await U();
    ok((u.pickaxeUpgrades?.Common ?? -1) === 20, "PH5 Common reached 20");
    await anomalyScan("PH5");
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { "cryptoBalances.IRON": 0 } }).exec();
    const rf = await svc.upgradePickaxe(SIM_ID, "Uncommon");
    ok(!rf.success && /Insufficient IRON/.test(rf.error || ""), `PH6 broke-funds specific error (got: ${rf.error})`);
    const rmax = await svc.upgradePickaxe(SIM_ID, "Common");
    ok(!rmax.success && /max/i.test(rmax.error || ""), `PH6 maxed error (got: ${rmax.error})`);
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { "cryptoBalances.SILVER": 100000, "cryptoBalances.GOLD": 100000 } }).exec();
    const rlvl = ((await U()).pickaxeUpgrades?.Rare ?? 0);
    const beforeSil = ((await U()).cryptoBalances?.SILVER ?? 0);
    const [c1, c2] = await Promise.all([svc.upgradePickaxe(SIM_ID, "Rare"), svc.upgradePickaxe(SIM_ID, "Rare")]);
    const okCount = [c1, c2].filter((r) => r.success).length;
    const afterU = await U();
    ok(okCount === 1, `PH6 concurrent double-submit -> exactly 1 success (got ${okCount})`);
    ok(((afterU.pickaxeUpgrades?.Rare ?? 0) === rlvl + 1) && ((afterU.cryptoBalances?.SILVER ?? 0) === beforeSil - 2000), "PH6 no overdraft, single level gain");
    const st = await svc.getUpgradeStatus(SIM_ID);
    const uncommonInfo = st.upgrades?.Uncommon;
    const probe = uncommonInfo?.canUpgrade
        ? await svc.upgradePickaxe(SIM_ID, "Uncommon")
        : await (async () => { await userModel.updateOne({ telegramId: SIM_ID }, { $set: { "cryptoBalances.COPPER": 0, "cryptoBalances.SILVER": 0 } }).exec(); return svc.upgradePickaxe(SIM_ID, "Uncommon"); })();
    ok(uncommonInfo?.canUpgrade ? probe.success : !probe.success, "PH6 status.canUpgrade consistent with attempt");
    await anomalyScan("PH6");
    await grindTo(100);
    u = await U();
    ok((u.level ?? 0) === 100, `PH7 reached Lv100 (got ${u.level}, stones=${stones}, crafts=${crafts})`);
    let need = 0;
    for (let l = 2; l <= 100; l++)
        need += (0, leveling_service_1.xpRequiredForLevel)(l);
    ok((u.gameExp ?? 0) >= need, `PH7 total XP ${u.gameExp} covers cumulative ${need}`);
    const expectOwned = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
    ok(expectOwned.every((t) => (u.ownedPickaxes || []).includes(t)), `PH7 all tiers owned (${u.ownedPickaxes})`);
    await anomalyScan("PH7");
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    console.log(`\nSTONES=${stones} CRAFTS=${crafts} FAILS=${fails.length}`);
    if (fails.length) {
        console.log("FAILURES:\n- " + fails.join("\n- "));
        process.exit(2);
    }
    console.log("ALL SIM CHECKS PASSED");
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-full.tmp.js.map