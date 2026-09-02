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
var MarketMakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMakerService = void 0;
const common_1 = require("@nestjs/common");
const trade_spot_service_1 = require("./trade-spot.service");
const asset_registry_service_1 = require("./asset-registry.service");
let MarketMakerService = MarketMakerService_1 = class MarketMakerService {
    tradeSpotService;
    assetRegistry;
    logger = new common_1.Logger(MarketMakerService_1.name);
    intervalId = null;
    running = new Set();
    schedules = new Map();
    hourWindows = new Map();
    hourCounts = new Map();
    constructor(tradeSpotService, assetRegistry) {
        this.tradeSpotService = tradeSpotService;
        this.assetRegistry = assetRegistry;
    }
    async onModuleInit() {
        try {
            await this.assetRegistry.bootstrap();
            this.logger.log("[AssetRegistry] Bootstrap complete — cross-pair sync active");
        }
        catch (e) {
            this.logger.error(`[AssetRegistry] Bootstrap failed: ${e?.message}`);
        }
        this.tick().catch((e) => this.logger.error(`[MM Bot] initial tick failed: ${e?.message}`));
        this.intervalId = setInterval(() => {
            this.tick().catch((e) => this.logger.error(`[MM Bot] tick failed: ${e?.message}`));
        }, 10_000);
        this.logger.log("[MM Bot] armed — random-timing model active for all botEnabled pools");
    }
    onModuleDestroy() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.intervalId = null;
    }
    generateHourSchedule(tradesPerHour) {
        const now = Date.now();
        const hourMs = 60 * 60 * 1000;
        const times = [];
        for (let i = 0; i < tradesPerHour; i++) {
            times.push(now + Math.random() * hourMs);
        }
        times.sort((a, b) => a - b);
        return times;
    }
    ensureSchedule(pair, tradesPerHour) {
        const windowStart = this.hourWindows.get(pair) ?? 0;
        const now = Date.now();
        const hourMs = 60 * 60 * 1000;
        if (!this.schedules.has(pair) || now - windowStart >= hourMs) {
            this.schedules.set(pair, this.generateHourSchedule(tradesPerHour));
            this.hourWindows.set(pair, now);
            this.hourCounts.set(pair, 0);
            this.logger.log(`[MM Bot] ${pair}: new hour schedule — ${tradesPerHour} random trades in 60min`);
        }
    }
    async tick() {
        this.tradeSpotService.clearDriftCycle();
        const pools = await this.tradeSpotService.getAllActivePools();
        for (const pool of pools) {
            if (pool.botEnabled === false)
                continue;
            const tradesPerHour = pool.botTradesPerCycle ?? 10;
            this.ensureSchedule(pool.pair, tradesPerHour);
            const schedule = this.schedules.get(pool.pair) ?? [];
            const done = this.hourCounts.get(pool.pair) ?? 0;
            const now = Date.now();
            let idx = done;
            while (idx < schedule.length && now >= schedule[idx]) {
                this.hourCounts.set(pool.pair, idx + 1);
                this.runCycle(pool.pair).catch(e => console.error(`[MM Bot] cycle failed for ${pool.pair}:`, e?.message));
                idx++;
            }
        }
    }
    getSchedules() {
        const result = {};
        for (const [pair, schedule] of this.schedules) {
            const windowStart = this.hourWindows.get(pair) ?? 0;
            const done = this.hourCounts.get(pair) ?? 0;
            const now = Date.now();
            const upcoming = schedule.filter(t => t > now).map(t => t - now);
            result[pair] = {
                hourWindowStart: windowStart,
                tradesDone: done,
                tradesTotal: schedule.length,
                nextExecutions: upcoming,
            };
        }
        return result;
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
            const done = this.hourCounts.get(pair) ?? 0;
            const total = (this.schedules.get(pair) ?? []).length;
            this.logger.log(`[MM Bot] ${pair} — ${count} trades (mid ${pool.lastMid.toFixed(8)}), ${fills.length} user order(s) filled [hour ${done}/${total}]`);
            return count;
        }
        finally {
            this.running.delete(pair);
        }
    }
};
exports.MarketMakerService = MarketMakerService;
exports.MarketMakerService = MarketMakerService = MarketMakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trade_spot_service_1.TradeSpotService,
        asset_registry_service_1.AssetRegistryService])
], MarketMakerService);
//# sourceMappingURL=market-maker.service.js.map