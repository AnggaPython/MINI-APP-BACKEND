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
    const trades = await mongoose_1.default.connection.collection("trades").find({ amount: { $lt: 2 } }).toArray();
    console.log(`Found ${trades.length} trades with amount < 2`);
    if (trades.length > 0) {
        console.log(trades.map(t => ({ pair: t.pair, side: t.side, amount: t.amount, price: t.price, source: t.source })));
    }
    await mongoose_1.default.disconnect();
}
run().catch(console.log);
//# sourceMappingURL=check-trades.js.map