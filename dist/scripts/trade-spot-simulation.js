"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const trade_spot_service_1 = require("../trade-spot/trade-spot.service");
const mongoose_1 = require("@nestjs/mongoose");
async function runSimulation() {
    console.log("\n--- 💹 TRADE SPOT ENGINE SIMULATION 💹 ---");
    console.log("[*] Initializing NestJS Backend Context...");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const tradeSpotService = app.get(trade_spot_service_1.TradeSpotService);
    const userModel = app.get((0, mongoose_1.getModelToken)("User"));
    const TRADER_1 = "SIM_TRADER_1";
    const TRADER_2 = "SIM_TRADER_2";
    console.log("\n[1] Purging old tests and spawning Test User Profiles...");
    await userModel.deleteMany({ telegramId: { $in: [TRADER_1, TRADER_2] } });
    await userModel.create({
        telegramId: TRADER_1,
        username: "TraderOne",
        elixirBalance: 5000000,
        cryptoBalances: { IRON: 500000, COPPER: 50000, ELIXCOIN: 5000000, USDC: 5000000 }
    });
    await userModel.create({
        telegramId: TRADER_2,
        username: "TraderTwo",
        elixirBalance: 200000,
        cryptoBalances: { IRON: 20000, COPPER: 5000, ELIXCOIN: 1000000, USDC: 1000000 }
    });
    const pair = "IRON/ELIXCOIN";
    const pool = await tradeSpotService.getPool(pair);
    console.log(`\n[2] Placing Limit BUY Order on ${pair}...`);
    let resBuy = await tradeSpotService.placeOrder(TRADER_1, {
        pair,
        side: "BUY",
        type: "limit",
        amount: 10000,
        price: 0.0045
    });
    console.log(` └> Trade Engine Output:`, resBuy);
    console.log(`\n[3] Checking User 1 Balances After Limit Order...`);
    let u1 = await userModel.findOne({ telegramId: TRADER_1 }).lean().exec();
    console.log(` └> Expected ELIXCOIN = 5000000 - 45 = 4999955`);
    console.log(` └> Actual ELIXCOIN = ${u1.cryptoBalances.ELIXCOIN}`);
    console.log(`\n[4] User 2 places Market SELL to hit the market...`);
    let resSell = await tradeSpotService.placeOrder(TRADER_2, {
        pair,
        side: "SELL",
        type: "market",
        amount: 5000
    });
    console.log(` └> Trade Engine Output:`, resSell.success ? "Success" : resSell.error);
    console.log(`\n[5] Forcing market price down below 0.0045 limit to simulate Bot activity / Volatility...`);
    const poolModel = app.get((0, mongoose_1.getModelToken)("LiquidityPool"));
    await poolModel.updateOne({ pair }, { $set: { lastMid: 0.0044 } });
    console.log(` └> Checking matchOpenOrders execution:`);
    let matchRes = await tradeSpotService.matchOpenOrders(pair);
    console.log(` └> Fills generated:`, matchRes);
    console.log(`\n[6] Checking Match Status...`);
    let openRes = await tradeSpotService.getOpenOrders(TRADER_1, pair);
    let openOrders = openRes.orders || [];
    console.log(` └> Open Orders remaining for Trader 1:`, openOrders.length);
    console.log(`\n[7] Cancelling any remaining Orders...`);
    if (openOrders.length > 0) {
        const cancelRes = await tradeSpotService.cancelOrder(TRADER_1, openOrders[0].id);
        console.log(` └> Cancel Output:`, cancelRes.success ? "Success" : cancelRes.error);
    }
    console.log(`\n[8] Final Balances Verification...`);
    u1 = await userModel.findOne({ telegramId: TRADER_1 }).lean().exec();
    const u2 = await userModel.findOne({ telegramId: TRADER_2 }).lean().exec();
    console.log(` └> TRADER 1 (Limit Buyer)`);
    console.log(`   - ELIXCOIN (Quote): ${u1.cryptoBalances.ELIXCOIN}`);
    console.log(`   - IRON (Base): ${u1.cryptoBalances.IRON}`);
    console.log(` └> TRADER 2 (Market Seller)`);
    console.log(`   - ELIXCOIN (Quote): ${u2.cryptoBalances.ELIXCOIN}`);
    console.log(`   - IRON (Base): ${u2.cryptoBalances.IRON}`);
    await poolModel.updateOne({ pair }, { $set: { lastMid: 0.005 } });
    console.log("\n--- ✅ TRADE SPOT SIMULATION COMPLETE ✅ ---");
    process.exit(0);
}
runSimulation();
//# sourceMappingURL=trade-spot-simulation.js.map