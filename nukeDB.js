"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.MONGODB_URI;
async function run() {
    await mongoose_1.default.connect(uri);
    const trades = mongoose_1.default.connection.collection("trades");
    const pools = mongoose_1.default.connection.collection("liquiditypools");
    const trRes = await trades.deleteMany({ source: "BOT" });
    console.log(`Deleted ${trRes.deletedCount} BOT trades globally from all pairs.`);
    const ghostRes = await pools.deleteMany({ pair: "ELIXIR/ELIXCOIN" });
    console.log(`Deleted ${ghostRes.deletedCount} ghost pools.`);
    await mongoose_1.default.disconnect();
}
run().catch(console.log);
//# sourceMappingURL=nukeDB.js.map