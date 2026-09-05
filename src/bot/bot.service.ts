import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import {
  DAILY_DROP_TEMPLATES,
  DAILY_DROP_ANIMATIONS,
} from "./messages.constant";

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private botToken: string;
  private lastUpdateId = 0;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN") || "";
  }

  onModuleInit() {
    // Single-consumer guard: Telegram delivers each getUpdates update to
    // only ONE poller. Never run two instances (local + production, or two
    // Railway replicas) with the same TELEGRAM_BOT_TOKEN — they steal
    // /start updates from each other and referral deep-links get lost.
    // Set BOT_POLLING_ENABLED=false on every instance except the one that
    // should answer /start messages.
    const pollingEnabled = this.configService.get<string>("BOT_POLLING_ENABLED");
    if (!this.botToken) {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN not set — bot /start replies (referral deep-links) are DISABLED.",
      );
      return;
    }
    if (pollingEnabled === "false") {
      this.logger.log(
        "Bot polling disabled via BOT_POLLING_ENABLED=false — another instance owns getUpdates.",
      );
      return;
    }
    this.startPolling();
  }

  private async startPolling() {
    this.logger.log(
      "Native Telegram Long-Polling engine ignited for Deep Links...",
    );

    // Recursive polling daemon
    const poll = async () => {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId}&timeout=30`,
        );
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            this.lastUpdateId = update.update_id + 1;
            this.handleIncomingMessage(update);
          }
        }
      } catch (e) {
        // Ignore silent timeouts
      }
      // Loop cleanly
      setTimeout(poll, 1000);
    };
    poll();
  }

  private async handleIncomingMessage(update: any) {
    if (!update.message || !update.message.text) return;

    const text = update.message.text.trim();
    const chatId = update.message.chat.id;

    if (text.startsWith("/start") || text.startsWith("/play")) {
      const parts = text.split(" ");
      let referralParam = "";
      if (parts.length > 1 && text.startsWith("/start")) {
        referralParam = "?startapp=" + parts[1];
      }

      const welcomeMsg = `<b>👋 Welcome to the Elixir Network! 💧</b>\n\nTap the button below to launch the Mini App window, farm Elixir natively from Telegram, and bind your crypto wallet!`;

      const payload = {
        chat_id: chatId,
        text: welcomeMsg,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 PLAY ELIXIR NOW",
                url: `https://t.me/ElixirAds_bot/ElixirNetwork${referralParam}`,
              },
            ],
          ],
        },
      };

      await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  }

  // Cron syntax '0 12 * * *' = triggers every day exactly at 12:00 PM UTC (which maps to 19:00 WIB in Indonesia)
  @Cron("0 12 * * *", { timeZone: "UTC" })
  async postDailyVoucherCode() {
    if (process.env.NODE_ENV !== "production") {
      this.logger.warn(
        "Safeguard Active: Skipping Daily Telegram Push because the server is running in Local/Dev Mode.",
      );
      return;
    }

    if (!this.botToken) {
      this.logger.warn(
        "Bot token not configured. Skipping daily telegram push.",
      );
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const todayCode = `ELIX-${dateStr}`;

    // Cycle through the 30 unique messages algorithmically mapped to Epoch time
    const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const messageIndex = epochDays % 30; // 0 to 29

    const rawMessageTemplate = DAILY_DROP_TEMPLATES[messageIndex];
    const message = rawMessageTemplate.replace(/{{CODE}}/g, todayCode);

    // Grab a cyclical GIF url. We modulo against GIF array length to be safe.
    const animationUrl =
      DAILY_DROP_ANIMATIONS[epochDays % DAILY_DROP_ANIMATIONS.length];

    const payload = {
      chat_id: "@ElixirNetworkChannel",
      animation: animationUrl,
      caption: message,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 OPEN ELIXIR APP",
              url: "https://t.me/ElixirAds_bot?start",
            },
          ],
        ],
      },
    };

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendAnimation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (data.ok) {
        this.logger.log(
          `Successfully broadcasted Code Drop [${todayCode}] with Animation to @ElixirNetworkChannel.`,
        );
      } else {
        this.logger.warn(
          `Failed to broadcast animation: ${data.description}. Activating Failsafe Text Mode...`,
        );
        // Fallback Engine if specific GIF links 404 or get blacklisted.
        const fallbackPayload = {
          chat_id: "@ElixirNetworkChannel",
          text: message,
          parse_mode: "HTML",
          reply_markup: payload.reply_markup,
        };
        await fetch(
          `https://api.telegram.org/bot${this.botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fallbackPayload),
          },
        );
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
      this.logger.log(
        "Initiating Background Mass DM Broadcast... fetching targets.",
      );
      if (!this.botToken) return;
      const mongoose = require("mongoose");
      const userModel = mongoose.model("User");

      // Cursor streaming to avoid OOM on 50k users — batch 500, throttle 100ms (10 rps safe)
      const cursor = userModel
        .find({ isBanned: { $ne: true } }, { telegramId: 1 })
        .lean()
        .cursor();

      let successCounter = 0;
      let total = 0;
      this.logger.log(`Mass DM: streaming targets via cursor...`);

      for await (const user of cursor) {
        if (!user.telegramId) continue;
        total++;

        const payload = {
          chat_id: user.telegramId,
          animation: animationUrl,
          caption: message,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 OPEN APP & REDEEM DROP",
                  url: "https://t.me/ElixirAds_bot/ElixirNetwork?startapp=bonus",
                },
              ],
            ],
          },
        };

        try {
          await fetch(
            `https://api.telegram.org/bot${this.botToken}/sendAnimation`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          successCounter++;
        } catch (e) {
          // Suppress individual failures to keep the loop intact
        }

        // Throttle: 10 rps safe (Telegram limit 30, avoid 429)
        await new Promise((r) => setTimeout(r, 100));
      }
      this.logger.log(
        `Mass Broadcast Concluded. Successfully hit ${successCounter} / ${total} DMs.`,
      );
    } catch (e) {
      this.logger.error("Critical Failure during Mass Broadcast", e);
    }
  }
}
