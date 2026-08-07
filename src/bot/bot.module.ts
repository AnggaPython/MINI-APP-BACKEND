import { Module } from '@nestjs/common';
import { TelegramBotService } from './bot.service';

@Module({
    providers: [TelegramBotService],
    exports: [TelegramBotService],
})
export class BotModule { }
