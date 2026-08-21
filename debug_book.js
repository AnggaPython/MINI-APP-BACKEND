"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const trade_spot_service_1 = require("./src/trade-spot/trade-spot.service");
async function run() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const svc = app.get(trade_spot_service_1.TradeSpotService);
    const book = await svc.getOrderBook(10, 'ELIXCOIN/ELIXIR');
    console.log(JSON.stringify(book, null, 2));
    await app.close();
    process.exit(0);
}
run();
//# sourceMappingURL=debug_book.js.map