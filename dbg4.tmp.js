"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const auto_mining_service_1 = require("./src/auto-mining/auto-mining.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const auto_mining_schema_1 = require("./src/auto-mining/schemas/auto-mining.schema");
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const subModel = mongoose_1.default.model("AutoMiningSub", auto_mining_schema_1.AutoMiningSubSchema);
    const svc = new auto_mining_service_1.AutoMiningService(subModel, {}, userModel, {}, {}, {}, {}, {
        getUserCollection: async () => ({ ownedItems: [{ baseItemId: "x" }], activeItems: [] }),
        activateBuff: async () => ({ success: true }),
        deactivateBuff: async () => ({ success: true }),
    });
    await userModel.deleteOne({ telegramId: "DBG_USER_1" }).exec();
    await userModel.create({ telegramId: "DBG_USER_1", elixirBalance: 1000000, ownedPickaxes: ["Common"] });
    const r = await svc.subscribe("DBG_USER_1", { target: "stone", favPickaxe: "Common", buffIds: ["x"] });
    console.log("result:", JSON.stringify(r));
    const d = await subModel.findOne({ telegramId: "DBG_USER_1" }).lean().exec();
    console.log("fav:", d?.favPickaxe, "buffs:", JSON.stringify(d?.planBuffs));
    await subModel.deleteOne({ telegramId: "DBG_USER_1" }).exec();
    await userModel.deleteOne({ telegramId: "DBG_USER_1" }).exec();
    await mongoose_1.default.disconnect();
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=dbg4.tmp.js.map