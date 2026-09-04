"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const auto_mining_service_1 = require("./src/auto-mining/auto-mining.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const auto_mining_schema_1 = require("./src/auto-mining/schemas/auto-mining.schema");
const SIM = "SIM_BUFFTYPE_009";
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const subModel = mongoose_1.default.model("AutoMiningSub", auto_mining_schema_1.AutoMiningSubSchema);
    const svc = new auto_mining_service_1.AutoMiningService(subModel, {}, userModel, {}, {}, {}, {}, {
        getUserCollection: async () => ({
            ownedItems: [{ baseItemId: "roman-coin", buffType: "ATK" }, { baseItemId: "sumerian-tablet", buffType: "ECONOMY" }],
            activeItems: [],
        }),
        activateBuff: async () => ({ success: true }),
        deactivateBuff: async () => ({ success: true }),
    });
    await userModel.deleteOne({ telegramId: SIM }).exec();
    await subModel.deleteOne({ telegramId: SIM }).exec();
    await userModel.create({ telegramId: SIM, elixirBalance: 1000000, ownedPickaxes: ["Common"] });
    let r = await svc.subscribe(SIM, { target: "stone", buffIds: ["roman-coin"] });
    console.log((!r.success && /Only ECONOMY/.test(r.error || "")) ? "PASS ATK rejected" : `FAIL ATK (got: ${r.error})`);
    r = await svc.subscribe(SIM, { target: "stone", buffIds: ["sumerian-tablet"] });
    console.log(r.success ? "PASS ECONOMY accepted" : `FAIL ECONOMY (got: ${r.error})`);
    await userModel.deleteOne({ telegramId: SIM }).exec();
    await subModel.deleteOne({ telegramId: SIM }).exec();
    await mongoose_1.default.disconnect();
    console.log("DONE");
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-bufftype.tmp.js.map