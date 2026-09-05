/**
 * SINGLE GATE for all Telegram bot/app URLs.
 *
 * Every bot link in the backend MUST be built with the helpers below —
 * never hardcode `t.me/...` inline again. Switching bots (or renaming the
 * Mini App short-name) is then exactly one env change:
 *
 *   TELEGRAM_BOT_USERNAME=ElixirHunter_bot
 *   TELEGRAM_MINIAPP_SHORT=ElixirNetwork
 *
 * NOTE: `@ElixirNetworkChannel` / `@ElixirNetwork` (getChatMember checks)
 * are a CHANNEL, not the bot — they are intentionally NOT part of this
 * gate and stay as-is during a bot migration.
 */

export function telegramBotUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME || "ElixirHunter_bot";
}

export function miniAppShortName(): string {
  return process.env.TELEGRAM_MINIAPP_SHORT || "Elixir";
}

/** Direct Mini App deep-link: t.me/<bot>/<app>?startapp=<payload> */
export function miniAppLink(startapp?: string): string {
  const base = `https://t.me/${telegramBotUsername()}/${miniAppShortName()}`;
  return startapp ? `${base}?startapp=${startapp}` : base;
}

/** Bot chat (deep) link: t.me/<bot>?start=<payload> */
export function botChatLink(start?: string): string {
  const base = `https://t.me/${telegramBotUsername()}`;
  return start ? `${base}?start=${start}` : base;
}
