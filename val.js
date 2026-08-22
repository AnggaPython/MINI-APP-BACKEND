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
    const pools = await mongoose_1.default.connection.collection("liquiditypools").find({ pair: "ELIXCOIN/ELIXIR" }).toArray();
    console.log("Pool in DB:", pools.map(p => ({ pair: p.pair, lastMid: p.lastMid })));
    await mongoose_1.default.disconnect();
}
run().catch(console.log);
//# sourceMappingURL=val.js.map