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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMakerService = void 0;
const common_1 = require("@nestjs/common");
const trade_spot_service_1 = require("./trade-spot.service");
let MarketMakerService = class MarketMakerService {
    tradeSpotService;
    intervalId = null;
    running = false;
    constructor(tradeSpotService) {
        this.tradeSpotService = tradeSpotService;
    }
    onModuleInit() {
        this.tick().catch((e) => console.error("[MM Bot] initial tick failed:", e?.message));
        this.intervalId = setInterval(() => {
            this.tick().catch((e) => console.error("[MM Bot] tick failed:", e?.message));
        }, 10_000);
        console.log("[MM Bot] armed — 10 trades (5 buy / 5 sell) per cycle, config-driven cooldown (default 15 min), trades priced at the real-time mid");
    }
    onModuleDestroy() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.intervalId = null;
    }
    async tick() {
        const pool = await this.tradeSpotService.getPool();
        if (pool.botEnabled === false)
            return;
        const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
        const last = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : 0;
        if (Date.now() - last >= intervalMs) {
            await this.runCycle();
        }
    }
    async runNow() {
        if (this.running)
            return { ran: false, count: 0 };
        const count = await this.runCycle();
        return { ran: true, count };
    }
    async runCycle() {
        if (this.running)
            return 0;
        this.running = true;
        try {
            await this.tradeSpotService.driftMid();
            const fills = await this.tradeSpotService.matchOpenOrders();
            const { count } = await this.tradeSpotService.botCycle();
            console.log(`[MM Bot] cycle done — ${count} trades (mid ${(await this.tradeSpotService.getPool()).lastMid.toFixed(8)}), ${fills.length} user limit order(s) filled`);
            return count;
        }
        finally {
            this.running = false;
        }
    }
};
exports.MarketMakerService = MarketMakerService;
exports.MarketMakerService = MarketMakerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trade_spot_service_1.TradeSpotService])
], MarketMakerService);
//# sourceMappingURL=market-maker.service.js.map