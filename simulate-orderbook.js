"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SPREAD_PCT = 0.004;
const step_pct = 0.0012;
const DEPTH = 10;
const PAIRS = {
    "ELIXCOIN/ELIXIR": 0.09674384,
    "ELIXCOIN/USDC": 0.00000967,
    "IRON/ELIXCOIN": 0.00508425,
    "COPPER/ELIXCOIN": 0.0101637,
    "SILVER/ELIXCOIN": 0.09800673,
    "GOLD/ELIXCOIN": 1.01999445,
    "IRON/USDC": 0.00000003,
    "COPPER/USDC": 0.00000006,
    "SILVER/USDC": 0.00000068,
    "GOLD/USDC": 0.0000068,
};
const round8 = (n) => Math.round(n * 1e8) / 1e8;
let totalPassed = 0;
let totalFailed = 0;
for (const [pair, mid] of Object.entries(PAIRS)) {
    const half = SPREAD_PCT / 2;
    const asks = [];
    const bids = [];
    for (let i = 0; i < DEPTH; i++) {
        const askPrice = round8(mid * (1 + half + step_pct * i));
        asks.push({ price: askPrice });
        const bidPrice = round8(mid * (1 - half - step_pct * i));
        bids.push({ price: bidPrice });
    }
    const askPrices = asks.map((a) => a.price);
    const bidPrices = bids.map((b) => b.price);
    const uniqueAsks = new Set(askPrices).size === askPrices.length;
    const uniqueBids = new Set(bidPrices).size === bidPrices.length;
    const askSet = new Set(askPrices);
    const crossedPrices = bidPrices.filter((p) => askSet.has(p));
    const noCrossing = crossedPrices.length === 0;
    const spreadOk = asks[0].price > bids[0].price;
    const minTick = 0.00000001;
    const spreadSize = asks[0].price - bids[0].price;
    const spreadVisible = spreadSize >= minTick;
    const passed = uniqueAsks && uniqueBids && noCrossing && spreadOk && spreadVisible;
    if (passed) {
        totalPassed++;
        console.log(`✅ [${pair}] mid=${mid} — ALL TESTS PASS | spread=${round8(spreadSize)}`);
    }
    else {
        totalFailed++;
        console.log(`❌ [${pair}] mid=${mid} — ANOMALY DETECTED!`);
        if (!uniqueAsks)
            console.log(`   ⚠️  ASK prices have duplicates: ${askPrices.join(", ")}`);
        if (!uniqueBids)
            console.log(`   ⚠️  BID prices have duplicates: ${bidPrices.join(", ")}`);
        if (!noCrossing)
            console.log(`   ⚠️  CROSSED prices (same ask & bid): ${crossedPrices.join(", ")}`);
        if (!spreadOk)
            console.log(`   ⚠️  BEST ASK (${asks[0].price}) <= BEST BID (${bids[0].price})`);
        if (!spreadVisible)
            console.log(`   ⚠️  Spread too small: ${spreadSize} (below 1 tick = ${minTick})`);
    }
}
console.log(`\n── Summary ──────────────────────────────────────────────`);
console.log(`  ✅ Passed:  ${totalPassed} pairs`);
console.log(`  ❌ Failed:  ${totalFailed} pairs`);
console.log(`────────────────────────────────────────────────────────`);
if (totalFailed > 0) {
    console.log(`\n💡 ROOT CAUSE: Percentage-based step (${step_pct * 100}%) is too small`);
    console.log(`   for micro-price pairs at 8-decimal precision.`);
    console.log(`   FIX: Use a minimum absolute tick size derived from price magnitude.\n`);
}
//# sourceMappingURL=simulate-orderbook.js.map