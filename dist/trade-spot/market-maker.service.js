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
    running = new Set();
    constructor(tradeSpotService) {
        this.tradeSpotService = tradeSpotService;
    }
    onModuleInit() {
        this.tick().catch((e) => console.error("[MM Bot] initial tick failed:", e?.message));
        this.intervalId = setInterval(() => {
            this.tick().catch((e) => console.error("[MM Bot] tick failed:", e?.message));
        }, 10_000);
        console.log("[MM Bot] armed — running cycles concurrently for all botEnabled pools");
    }
    onModuleDestroy() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.intervalId = null;
    }
    async tick() {
        const pools = await this.tradeSpotService.getAllActivePools();
        for (const pool of pools) {
            if (pool.botEnabled === false)
                continue;
            const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
            const last = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : 0;
            if (Date.now() - last >= intervalMs) {
                this.runCycle(pool.pair).catch(e => console.error(`[MM Bot] cycle failed for ${pool.pair}:`, e?.message));
            }
        }
    }
    async runNow(pair = "ELIXCOIN/ELIXIR") {
        if (this.running.has(pair))
            return { ran: false, count: 0 };
        const count = await this.runCycle(pair);
        return { ran: true, count };
    }
    async runCycle(pair = "ELIXCOIN/ELIXIR") {
        if (this.running.has(pair))
            return 0;
        this.running.add(pair);
        try {
            await this.tradeSpotService.driftMid(pair);
            const fills = await this.tradeSpotService.matchOpenOrders(pair);
            const { count } = await this.tradeSpotService.botCycle(pair);
            const pool = await this.tradeSpotService.getPool(pair);
            console.log(`[MM Bot] cycle done for ${pair} — ${count} trades (mid ${pool.lastMid.toFixed(8)}), ${fills.length} user limit order(s) filled`);
            return count;
        }
        finally {
            this.running.delete(pair);
        }
    }
};
exports.MarketMakerService = MarketMakerService;
exports.MarketMakerService = MarketMakerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trade_spot_service_1.TradeSpotService])
], MarketMakerService);
//# sourceMappingURL=market-maker.service.js.map