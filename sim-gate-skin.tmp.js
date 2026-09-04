"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pickaxe_upgrade_service_1 = require("./src/pickaxe-upgraded/pickaxe-upgrade.service");
const leveling_service_1 = require("./src/leveling-miner/leveling.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const DEV_ID = "123456789";
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const leveling = new leveling_service_1.LevelingService(userModel);
    const svc = new pickaxe_upgrade_service_1.PickaxeUpgradeService(userModel, leveling);
    const snap = await userModel.findOne({ telegramId: DEV_ID }).lean().exec();
    const snapshot = {
        level: snap.level, ownedPickaxes: [...(snap.ownedPickaxes || [])],
        pickaxeUpgrades: { ...(snap.pickaxeUpgrades || {}) },
        cryptoBalances: { ...(snap.cryptoBalances || {}) },
        materials: { ...(snap.materials || {}) },
        unlockedPickaxeSkins: [...(snap.unlockedPickaxeSkins || [])],
        activePickaxeSkins: { ...(snap.activePickaxeSkins || {}) },
    };
    console.log("SNAP level:", snapshot.level, "owned:", snapshot.ownedPickaxes, "upg:", snapshot.pickaxeUpgrades);
    await userModel.updateOne({ telegramId: DEV_ID }, { $set: { level: 15, "pickaxeUpgrades.Common": 1 } }).exec();
    const g1 = await leveling.grantPendingPickaxes(DEV_ID);
    console.log("TEST1 gate unmet -> grants:", JSON.stringify(g1), g1.length === 0 ? "PASS" : "FAIL");
    await userModel.updateOne({ telegramId: DEV_ID }, { $set: { "pickaxeUpgrades.Common": 5 } }).exec();
    const g2 = await leveling.grantPendingPickaxes(DEV_ID);
    const owned2 = await userModel.findOne({ telegramId: DEV_ID }).lean().exec();
    console.log("TEST2 gate met -> grants:", JSON.stringify(g2), "| owned has Uncommon:", owned2.ownedPickaxes?.includes("Uncommon") ? "PASS" : "FAIL");
    await userModel.updateOne({ telegramId: DEV_ID }, {
        $set: { "pickaxeUpgrades.Common": 9, "cryptoBalances.IRON": 10000, "cryptoBalances.COPPER": 10000, "materials.Rusty Nail": 5 },
    }).exec();
    const r3 = await svc.upgradePickaxe(DEV_ID, "Common");
    console.log("TEST3 upgrade->10:", JSON.stringify({ success: r3.success, newLevel: r3.newLevel, skin: r3.skinUnlocked }), r3.success && r3.newLevel === 10 && r3.skinUnlocked === "common-10" ? "PASS" : "FAIL");
    const after3 = await userModel.findOne({ telegramId: DEV_ID }).lean().exec();
    console.log("TEST3 auto-equip:", after3.activePickaxeSkins?.Common === "common-10" ? "PASS" : "FAIL", "| unlocked:", JSON.stringify(after3.unlockedPickaxeSkins));
    await userModel.updateOne({ telegramId: DEV_ID }, {
        $set: {
            level: snapshot.level, ownedPickaxes: snapshot.ownedPickaxes,
            pickaxeUpgrades: snapshot.pickaxeUpgrades, cryptoBalances: snapshot.cryptoBalances,
            materials: snapshot.materials, unlockedPickaxeSkins: snapshot.unlockedPickaxeSkins,
            activePickaxeSkins: snapshot.activePickaxeSkins,
        },
    }).exec();
    console.log("RESTORED dev account");
    await mongoose_1.default.disconnect();
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-gate-skin.tmp.js.map