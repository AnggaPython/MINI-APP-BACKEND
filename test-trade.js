"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const trade_spot_service_1 = require("./src/trade-spot/trade-spot.service");
async function run() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const s = app.get(trade_spot_service_1.TradeSpotService);
    await s.getPool("USDC/ELIXCOIN").catch(() => { });
    await s.getPool("ELIXCOIN/USDC").catch(() => { });
    const pool = await s.getPool("ELIXCOIN/USDC");
    const mid = pool.lastMid;
    const half = pool.spreadPct / 2;
    const ask = mid * (1 + half);
    const bid = mid * (1 - half);
    console.log("MID=", mid, "HALF=", half);
    console.log("MARKET BUY -> ask ->", ask);
    console.log("MARKET SELL -> bid ->", bid);
    process.exit(0);
}
run();
//# sourceMappingURL=test-trade.js.map