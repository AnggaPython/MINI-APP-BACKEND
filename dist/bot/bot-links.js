"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramBotUsername = telegramBotUsername;
exports.miniAppShortName = miniAppShortName;
exports.miniAppLink = miniAppLink;
exports.botChatLink = botChatLink;
function telegramBotUsername() {
    return process.env.TELEGRAM_BOT_USERNAME || "ElixirHunter_bot";
}
function miniAppShortName() {
    return process.env.TELEGRAM_MINIAPP_SHORT || "Elixir";
}
function miniAppLink(startapp) {
    const base = `https://t.me/${telegramBotUsername()}/${miniAppShortName()}`;
    return startapp ? `${base}?startapp=${startapp}` : base;
}
function botChatLink(start) {
    const base = `https://t.me/${telegramBotUsername()}`;
    return start ? `${base}?start=${start}` : base;
}
//# sourceMappingURL=bot-links.js.map