import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { TradeSpotService } from "./trade-spot.service";
import { AssetRegistryService } from "./asset-registry.service";
export declare class MarketMakerService implements OnModuleInit, OnModuleDestroy {
    private readonly tradeSpotService;
    private readonly assetRegistry;
    private readonly logger;
    private intervalId;
    private running;
    private schedules;
    private hourWindows;
    private hourCounts;
    constructor(tradeSpotService: TradeSpotService, assetRegistry: AssetRegistryService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private generateHourSchedule;
    private ensureSchedule;
    private tick;
    getSchedules(): Record<string, {
        hourWindowStart: number;
        tradesDone: number;
        tradesTotal: number;
        nextExecutions: number[];
    }>;
    runNow(pair?: string): Promise<{
        ran: boolean;
        count: number;
    }>;
    runCycle(pair?: string): Promise<number>;
}
