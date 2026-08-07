import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TelegramBotService } from '../bot/bot.service';

async function bootstrap() {
    console.log('[*] Initializing backend context for manual trigger...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const botService = app.get(TelegramBotService);

    console.log('[*] Manually triggering daily voucher post to Telegram Channel...');
    await botService.postDailyVoucherCode();

    console.log('[*] Delivery dispatched successfully. Terminating context.');
    process.exit(0);
}

bootstrap().catch(e => {
    console.error(e);
    process.exit(1);
});
