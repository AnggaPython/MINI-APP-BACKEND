import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DAILY_DROP_TEMPLATES, DAILY_DROP_ANIMATIONS } from './messages.constant';

@Injectable()
export class TelegramBotService {
    private readonly logger = new Logger(TelegramBotService.name);
    private botToken: string;

    constructor(private configService: ConfigService) {
        this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    }

    // Cron syntax '0 12 * * *' = triggers every day exactly at 12:00 PM UTC (which maps to 19:00 WIB in Indonesia)
    @Cron('0 12 * * *', { timeZone: 'UTC' })
    async postDailyVoucherCode() {
        if (!this.botToken) {
            this.logger.warn('Bot token not configured. Skipping daily telegram push.');
            return;
        }

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const todayCode = `ELIX-${dateStr}`;

        // Cycle through the 30 unique messages algorithmically mapped to Epoch time
        const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const messageIndex = epochDays % 30; // 0 to 29

        let rawMessageTemplate = DAILY_DROP_TEMPLATES[messageIndex];
        const message = rawMessageTemplate.replace(/{{CODE}}/g, todayCode);

        // Grab a cyclical GIF url. We modulo against GIF array length to be safe.
        const animationUrl = DAILY_DROP_ANIMATIONS[epochDays % DAILY_DROP_ANIMATIONS.length];

        const payload = {
            chat_id: '@ElixirNetworkChannel',
            animation: animationUrl,
            caption: message,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 OPEN ELIXIR APP", url: "https://t.me/ElixirAds_bot?start" }]
                ]
            }
        };

        try {
            const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendAnimation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.ok) {
                this.logger.log(`Successfully broadcasted Code Drop [${todayCode}] with Animation to @ElixirNetworkChannel.`);
            } else {
                this.logger.warn(`Failed to broadcast animation: ${data.description}. Activating Failsafe Text Mode...`);
                // Fallback Engine if specific GIF links 404 or get blacklisted.
                const fallbackPayload = {
                    chat_id: '@ElixirNetworkChannel',
                    text: message,
                    parse_mode: 'HTML',
                    reply_markup: payload.reply_markup
                };
                await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fallbackPayload)
                });
            }

            // Phase 42: MASS DM BROADCAST TO ALL USERS (Non-Blocking Daemon)
            this.massBroadcastDM(animationUrl, message);

        } catch (error) {
            this.logger.error(`Error sending telegram broadcast`, error);
        }
    }

    private async massBroadcastDM(animationUrl: string, message: string) {
        // Run safely in the background decoupled from main thread
        try {
            this.logger.log('Initiating Background Mass DM Broadcast... fetching targets.');
            const mongoose = require('mongoose');
            const userModel = mongoose.model('User');

            // Cursor through all active telegram IDs, ignoring 100% DB load via .lean()
            const users = await userModel.find({ isBanned: { $ne: true } }, { telegramId: 1 }).lean().exec();

            let successCounter = 0;
            this.logger.log(`Total Targets Acquired: ${users.length}. Beginning silent dispatch...`);

            for (const user of users) {
                if (!user.telegramId) continue;

                const payload = {
                    chat_id: user.telegramId,
                    animation: animationUrl,
                    caption: message,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🚀 OPEN APP & REDEEM DROP", url: "https://t.me/ElixirAds_bot/app?startapp=bonus" }]
                        ]
                    }
                };

                try {
                    await fetch(`https://api.telegram.org/bot${this.botToken}/sendAnimation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    successCounter++;
                } catch (e) {
                    // Suppress individual failures to keep the loop intact
                }

                // Throttle: Max 20 Requests Per Second (Telegram limits bot DMs strictly to 30)
                await new Promise(r => setTimeout(r, 50));
            }
            this.logger.log(`Mass Broadcast Concluded. Successfully hit ${successCounter} / ${users.length} DMs.`);
        } catch (e) {
            this.logger.error('Critical Failure during Mass Broadcast', e);
        }
    }
}
