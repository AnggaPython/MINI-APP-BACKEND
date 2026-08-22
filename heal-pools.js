"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mini-mini";
async function run() {
    await mongoose_1.default.connect(MONGO_URI);
    console.log("Connected to MongoDB.");
    const result = await mongoose_1.default.connection.collection("pools").updateMany({}, {
        $max: {
            baseReserve: 5000000,
            quoteReserve: 5000000,
            elixcoinReserve: 5000000,
            elixirReserve: 5000000,
            volume24h: 0,
            quoteVolume24h: 0,
        }
    });
    console.log("Healed pools:", result.modifiedCount);
    await mongoose_1.default.disconnect();
}
run().catch(console.error);
//# sourceMappingURL=heal-pools.js.map