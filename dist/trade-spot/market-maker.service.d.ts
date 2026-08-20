import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { TradeSpotService } from "./trade-spot.service";
export declare class MarketMakerService implements OnModuleInit, OnModuleDestroy {
    private readonly tradeSpotService;
    private intervalId;
    private running;
    constructor(tradeSpotService: TradeSpotService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
    runNow(): Promise<{
        ran: boolean;
        count: number;
    }>;
    runCycle(): Promise<number>;
}
