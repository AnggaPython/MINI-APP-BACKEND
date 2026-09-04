"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pickaxe_upgrade_service_1 = require("./src/pickaxe-upgraded/pickaxe-upgrade.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const DEV_ID = "123456789";
const NEED = { IRON: 2500, COPPER: 1000, MATERIAL: "Rusty Nail" };
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const svc = new pickaxe_upgrade_service_1.PickaxeUpgradeService(userModel);
    const show = async (tag) => {
        const u = await userModel.findOne({ telegramId: DEV_ID }).lean().exec();
        console.log(`--- ${tag} ---`);
        console.log("owned:", u?.ownedPickaxes);
        console.log("levels:", JSON.stringify(u?.pickaxeUpgrades ?? {}));
        console.log("IRON:", u?.cryptoBalances?.IRON, "| COPPER:", u?.cryptoBalances?.COPPER);
        const mats = u?.materials ?? {};
        console.log("materials[COMMON-list]:", Object.entries(mats).filter(([, c]) => c > 0).slice(0, 10));
        console.log("typeof level Common:", typeof u?.pickaxeUpgrades?.Common, "| typeof IRON:", typeof u?.cryptoBalances?.IRON);
    };
    await show("BEFORE");
    const u0 = await userModel.findOne({ telegramId: DEV_ID }).lean().exec();
    const inc = {};
    if ((u0?.cryptoBalances?.IRON ?? 0) < NEED.IRON)
        inc["cryptoBalances.IRON"] = NEED.IRON - (u0?.cryptoBalances?.IRON ?? 0);
    if ((u0?.cryptoBalances?.COPPER ?? 0) < NEED.COPPER)
        inc["cryptoBalances.COPPER"] = NEED.COPPER - (u0?.cryptoBalances?.COPPER ?? 0);
    if (((u0?.materials?.[NEED.MATERIAL]) ?? 0) < 1)
        inc[`materials.${NEED.MATERIAL}`] = 1 - ((u0?.materials?.[NEED.MATERIAL]) ?? 0);
    if (Object.keys(inc).length > 0) {
        console.log("TOP-UP dev:", JSON.stringify(inc));
        await userModel.updateOne({ telegramId: DEV_ID }, { $inc: inc }).exec();
    }
    else {
        console.log("TOP-UP: tidak perlu (semua cukup)");
    }
    const st = await svc.getUpgradeStatus(DEV_ID);
    console.log("STATUS Common:", JSON.stringify(st?.upgrades?.Common ?? st, null, 1).slice(0, 800));
    console.log(">>> upgradePickaxe('Common') ...");
    const res = await svc.upgradePickaxe(DEV_ID, "Common");
    console.log("RESULT:", JSON.stringify(res, null, 1));
    await show("AFTER");
    await mongoose_1.default.disconnect();
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-upgrade.tmp.js.map