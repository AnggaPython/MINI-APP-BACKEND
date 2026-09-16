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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeSpotController = void 0;
const common_1 = require("@nestjs/common");
const trade_spot_service_1 = require("./trade-spot.service");
const trade_pairs_1 = require("./trade-pairs");
const sse_service_1 = require("./sse.service");
const telegram_user_decorator_1 = require("../auth/telegram-user.decorator");
const place_order_dto_1 = require("./dto/place-order.dto");
let TradeSpotController = class TradeSpotController {
    tradeSpotService;
    sseService;
    constructor(tradeSpotService, sseService) {
        this.tradeSpotService = tradeSpotService;
        this.sseService = sseService;
    }
    async pairs() {
        const pairs = Object.keys(trade_pairs_1.MINERAL_INITIAL_RATES).sort();
        return { success: true, pairs };
    }
    async ticker(pair) {
        return this.tradeSpotService.getTicker(pair);
    }
    async tickers(body) {
        if (!body?.pairs || !Array.isArray(body.pairs))
            return { success: false, tickers: [] };
        const tickers = await this.tradeSpotService.getTickers(body.pairs);
        return { success: true, tickers };
    }
    async orderbook(telegramId, depth, pair) {
        return this.tradeSpotService.getOrderBook(Number(depth) || 10, pair, telegramId);
    }
    async trades(limit, pair) {
        return this.tradeSpotService.getTrades(Number(limit) || 30, pair);
    }
    async candles(pair, interval, limit) {
        return this.tradeSpotService.getCandles(pair, interval, Number(limit) || 120);
    }
    async stats(pair) {
        return this.tradeSpotService.getStats(pair);
    }
    async info(pair) {
        return this.tradeSpotService.getInfo(pair);
    }
    async holdings(telegramId, pair) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.tradeSpotService.getHoldings(telegramId, pair);
    }
    async maxTradeable(telegramId, pair, side) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.tradeSpotService.getMaxTradeable(telegramId, pair, side);
    }
    async openOrders(telegramId, pair) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.tradeSpotService.getOpenOrders(telegramId, pair);
    }
    async userTrades(telegramId, page, limit, pair) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        return this.tradeSpotService.getUserTrades(telegramId, Number(page) || 1, Number(limit) || 5, pair);
    }
    async placeOrder(telegramId, body) {
        if (!telegramId)
            return { success: false, error: "Missing telegramId" };
        const parseRes = place_order_dto_1.PlaceOrderSchema.safeParse(body);
        if (!parseRes.success) {
            const issue = parseRes.error.issues[0];
            return { success: false, error: issue?.message || "Invalid order payload" };
        }
        return this.tradeSpotService.placeOrder(telegramId, parseRes.data);
    }
    async cancelOrder(telegramId, body) {
        if (!telegramId || !body?.orderId) {
            return { success: false, error: "Missing orderId" };
        }
        return this.tradeSpotService.cancelOrder(telegramId, String(body.orderId));
    }
    events(pair, res) {
        const pairName = pair || "ELIXCOIN/ELIXIR";
        this.sseService.subscribe(pairName, res);
        this.tradeSpotService.getTicker(pairName).then((ticker) => {
            try {
                res.write(`event: ticker\ndata: ${JSON.stringify(ticker)}\n\n`);
            }
            catch { }
        }).catch(() => { });
    }
};
exports.TradeSpotController = TradeSpotController;
__decorate([
    (0, common_1.Get)("pairs"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "pairs", null);
__decorate([
    (0, common_1.Get)("ticker"),
    __param(0, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "ticker", null);
__decorate([
    (0, common_1.Post)("tickers"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "tickers", null);
__decorate([
    (0, common_1.Get)("orderbook"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)("depth")),
    __param(2, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "orderbook", null);
__decorate([
    (0, common_1.Get)("trades"),
    __param(0, (0, common_1.Query)("limit")),
    __param(1, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "trades", null);
__decorate([
    (0, common_1.Get)("candles"),
    __param(0, (0, common_1.Query)("pair")),
    __param(1, (0, common_1.Query)("interval")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "candles", null);
__decorate([
    (0, common_1.Get)("stats"),
    __param(0, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)("info"),
    __param(0, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "info", null);
__decorate([
    (0, common_1.Get)("holdings"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "holdings", null);
__decorate([
    (0, common_1.Get)("max-tradeable"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)("pair")),
    __param(2, (0, common_1.Query)("side")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "maxTradeable", null);
__decorate([
    (0, common_1.Get)("open-orders"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "openOrders", null);
__decorate([
    (0, common_1.Get)("user-trades"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("pair")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "userTrades", null);
__decorate([
    (0, common_1.Post)("order"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "placeOrder", null);
__decorate([
    (0, common_1.Post)("cancel-order"),
    __param(0, (0, telegram_user_decorator_1.User)("telegramId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TradeSpotController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Get)("events"),
    __param(0, (0, common_1.Query)("pair")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TradeSpotController.prototype, "events", null);
exports.TradeSpotController = TradeSpotController = __decorate([
    (0, common_1.Controller)("trade-spot"),
    __metadata("design:paramtypes", [trade_spot_service_1.TradeSpotService,
        sse_service_1.SseService])
], TradeSpotController);
//# sourceMappingURL=trade-spot.controller.js.map