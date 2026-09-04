"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pickaxe_upgrade_service_1 = require("./src/pickaxe-upgraded/pickaxe-upgrade.service");
const leveling_service_1 = require("./src/leveling-miner/leveling.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const SIM_ID = "SIM_FOCUS_002";
const fails = [];
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c)
    fails.push(m); };
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const leveling = new leveling_service_1.LevelingService(userModel);
    const svc = new pickaxe_upgrade_service_1.PickaxeUpgradeService(userModel, leveling);
    const U = () => userModel.findOne({ telegramId: SIM_ID }).lean().exec();
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    await userModel.create({ telegramId: SIM_ID, level: 30, gameExp: 0, exp: 0, ownedPickaxes: ["Common", "Uncommon", "Rare"] });
    await userModel.updateOne({ telegramId: SIM_ID }, {
        $set: {
            "cryptoBalances.COPPER": 100000, "cryptoBalances.SILVER": 100000,
            "cryptoBalances.GOLD": 100000, "cryptoBalances.IRON": 100000,
            "materials.Rusty Nail": 100, "materials.Steel Alloy": 100, "materials.Void Diamond": 100,
            "pickaxeUpgrades.Uncommon": 3,
        },
    }).exec();
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { "cryptoBalances.COPPER": 0 } }).exec();
    const r1 = await svc.upgradePickaxe(SIM_ID, "Uncommon");
    ok(!r1.success && /Insufficient COPPER/.test(r1.error || ""), `T1 broke-funds specific (got: ${r1.error})`);
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { "cryptoBalances.COPPER": 100000 } }).exec();
    const b0 = await U();
    const [a, b] = await Promise.all([svc.upgradePickaxe(SIM_ID, "Rare"), svc.upgradePickaxe(SIM_ID, "Rare")]);
    const wins = [a, b].filter((r) => r.success);
    const u2 = await U();
    ok(wins.length === 1, `T2 exactly 1 winner (got ${wins.length})`);
    ok((u2.pickaxeUpgrades?.Rare ?? -1) === ((b0.pickaxeUpgrades?.Rare ?? 0) + 1), "T2 single level gain");
    ok((u2.cryptoBalances?.SILVER ?? -1) === ((b0.cryptoBalances?.SILVER ?? 0) - 2000), "T2 single charge (no double-spend)");
    const loser = [a, b].find((r) => !r.success);
    ok(/concurrently|retry/i.test(loser?.error || ""), `T2 loser gets retry error (got: ${loser?.error})`);
    const s1 = await svc.upgradePickaxe(SIM_ID, "Rare");
    const s2 = await svc.upgradePickaxe(SIM_ID, "Rare");
    const u3 = await U();
    ok(s1.success && s2.success && (u3.pickaxeUpgrades?.Rare ?? -1) === ((b0.pickaxeUpgrades?.Rare ?? 0) + 3), "T3 sequential N+1,N+2 both succeed");
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { "pickaxeUpgrades.Common": 20 } }).exec();
    const r4 = await svc.upgradePickaxe(SIM_ID, "Common");
    ok(!r4.success && /max/i.test(r4.error || ""), `T4 maxed blocked (got: ${r4.error})`);
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    console.log(`FAILS=${fails.length}`);
    if (fails.length)
        process.exit(2);
    console.log("FOCUSED RE-TEST ALL PASSED");
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-focus.tmp.js.map