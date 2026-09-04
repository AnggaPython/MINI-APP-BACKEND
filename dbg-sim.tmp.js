"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pickaxe_upgrade_service_1 = require("./src/pickaxe-upgraded/pickaxe-upgrade.service");
const leveling_service_1 = require("./src/leveling-miner/leveling.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const SIM_ID = "SIM_DBG_003";
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const leveling = new leveling_service_1.LevelingService(userModel);
    const svc = new pickaxe_upgrade_service_1.PickaxeUpgradeService(userModel, leveling);
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    await userModel.create({ telegramId: SIM_ID, level: 30, ownedPickaxes: ["Common", "Rare"] });
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: {
            "cryptoBalances.SILVER": 100000, "cryptoBalances.GOLD": 100000,
            "materials.Steel Alloy": 100
        } }).exec();
    const [a, b] = await Promise.all([svc.upgradePickaxe(SIM_ID, "Rare"), svc.upgradePickaxe(SIM_ID, "Rare")]);
    console.log("A:", JSON.stringify(a));
    console.log("B:", JSON.stringify(b));
    const u = await userModel.findOne({ telegramId: SIM_ID }).lean().exec();
    console.log("final Rare level:", u.pickaxeUpgrades?.Rare, "SILVER:", u.cryptoBalances?.SILVER);
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    await mongoose_1.default.disconnect();
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=dbg-sim.tmp.js.map