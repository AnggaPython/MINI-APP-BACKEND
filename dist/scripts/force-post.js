"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const bot_service_1 = require("../bot/bot.service");
async function bootstrap() {
    console.log("[*] Initializing backend context for manual trigger...");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const botService = app.get(bot_service_1.TelegramBotService);
    console.log("[*] Manually triggering daily voucher post to Telegram Channel...");
    await botService.postDailyVoucherCode();
    console.log("[*] Delivery dispatched successfully. Terminating context.");
    process.exit(0);
}
bootstrap().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=force-post.js.map