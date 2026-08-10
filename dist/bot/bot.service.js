"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramBotService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBotService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const messages_constant_1 = require("./messages.constant");
let TelegramBotService = TelegramBotService_1 = class TelegramBotService {
    configService;
    logger = new common_1.Logger(TelegramBotService_1.name);
    botToken;
    lastUpdateId = 0;
    constructor(configService) {
        this.configService = configService;
        this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN') || '';
    }
    onModuleInit() {
        if (this.botToken) {
            this.startPolling();
        }
    }
    async startPolling() {
        this.logger.log('Native Telegram Long-Polling engine ignited for Deep Links...');
        const poll = async () => {
            try {
                const res = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId}&timeout=30`);
                const data = await res.json();
                if (data.ok && data.result.length > 0) {
                    for (const update of data.result) {
                        this.lastUpdateId = update.update_id + 1;
                        this.handleIncomingMessage(update);
                    }
                }
            }
            catch (e) {
            }
            setTimeout(poll, 1000);
        };
        poll();
    }
    async handleIncomingMessage(update) {
        if (!update.message || !update.message.text)
            return;
        const text = update.message.text.trim();
        const chatId = update.message.chat.id;
        if (text.startsWith('/start') || text.startsWith('/play')) {
            const parts = text.split(' ');
            let referralParam = '';
            if (parts.length > 1 && text.startsWith('/start')) {
                referralParam = '?startapp=' + parts[1];
            }
            const welcomeMsg = `<b>👋 Welcome to the Elixir Network! 💧</b>\n\nTap the button below to launch the Mini App window, farm Elixir natively from Telegram, and bind your crypto wallet!`;
            const payload = {
                chat_id: chatId,
                text: welcomeMsg,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚀 PLAY ELIXIR NOW", url: `https://t.me/ElixirAds_bot/ElixirNetwork${referralParam}` }]
                    ]
                }
            };
            await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => { });
        }
    }
    async postDailyVoucherCode() {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.warn('Safeguard Active: Skipping Daily Telegram Push because the server is running in Local/Dev Mode.');
            return;
        }
        if (!this.botToken) {
            this.logger.warn('Bot token not configured. Skipping daily telegram push.');
            return;
        }
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const todayCode = `ELIX-${dateStr}`;
        const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const messageIndex = epochDays % 30;
        let rawMessageTemplate = messages_constant_1.DAILY_DROP_TEMPLATES[messageIndex];
        const message = rawMessageTemplate.replace(/{{CODE}}/g, todayCode);
        const animationUrl = messages_constant_1.DAILY_DROP_ANIMATIONS[epochDays % messages_constant_1.DAILY_DROP_ANIMATIONS.length];
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
            }
            else {
                this.logger.warn(`Failed to broadcast animation: ${data.description}. Activating Failsafe Text Mode...`);
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
            this.massBroadcastDM(animationUrl, message);
        }
        catch (error) {
            this.logger.error(`Error sending telegram broadcast`, error);
        }
    }
    async massBroadcastDM(animationUrl, message) {
        try {
            this.logger.log('Initiating Background Mass DM Broadcast... fetching targets.');
            const mongoose = require('mongoose');
            const userModel = mongoose.model('User');
            const users = await userModel.find({ isBanned: { $ne: true } }, { telegramId: 1 }).lean().exec();
            let successCounter = 0;
            this.logger.log(`Total Targets Acquired: ${users.length}. Beginning silent dispatch...`);
            for (const user of users) {
                if (!user.telegramId)
                    continue;
                const payload = {
                    chat_id: user.telegramId,
                    animation: animationUrl,
                    caption: message,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🚀 OPEN APP & REDEEM DROP", url: "https://t.me/ElixirAds_bot/ElixirNetwork?startapp=bonus" }]
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
                }
                catch (e) {
                }
                await new Promise(r => setTimeout(r, 50));
            }
            this.logger.log(`Mass Broadcast Concluded. Successfully hit ${successCounter} / ${users.length} DMs.`);
        }
        catch (e) {
            this.logger.error('Critical Failure during Mass Broadcast', e);
        }
    }
};
exports.TelegramBotService = TelegramBotService;
__decorate([
    (0, schedule_1.Cron)('0 12 * * *', { timeZone: 'UTC' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TelegramBotService.prototype, "postDailyVoucherCode", null);
exports.TelegramBotService = TelegramBotService = TelegramBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], TelegramBotService);
//# sourceMappingURL=bot.service.js.map