import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { PendingTpSlDocument } from "./schemas/pending-tp-sl.schema";
import { User } from "../users/schemas/user.schema";
import { AssetRegistryService } from "./asset-registry.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
import { SseService } from "./sse.service";
import { ItemTradeService } from "./item-trade.service";
export { isItemBase } from "./item-sync";
export { DEFAULT_PAIR, FEE_PCT, SPREAD_PCT, CORE_BOT_PAIRS, MINERAL_INITIAL_RATES } from "./trade-pairs";
export declare class TradeSpotService {
    private readonly tradeModel;
    private readonly poolModel;
    private readonly orderModel;
    private readonly userModel;
    private readonly assetRegistry;
    private readonly buffCollectionsService;
    private readonly sseService;
    private readonly itemTradeService;
    private readonly pendingTpSlModel;
    private readonly orderTimestamps;
    private readonly cancelTimestamps;
    private tickerCache;
    private bookCache;
    private tradesCache;
    private infoCache;
    private readonly INFO_CACHE_MS;
    private lastUserTradeImpact;
    private previousMid;
    private readonly logger;
    constructor(tradeModel: Model<Trade>, poolModel: Model<LiquidityPool>, orderModel: Model<OpenOrder>, userModel: Model<User>, assetRegistry: AssetRegistryService, buffCollectionsService: BuffItemCollectionsService, sseService: SseService, itemTradeService: ItemTradeService, pendingTpSlModel: Model<PendingTpSlDocument>);
    private sweepMemory;
    private evictRateLimit;
    private checkRateLimit;
    getAllActivePools(): Promise<LiquidityPool[]>;
    getAllPools(): Promise<LiquidityPool[]>;
    setAdminPriceControl(pair: string, bidFloor: number, askCeiling: number): Promise<Record<string, unknown>>;
    clearAdminPriceControl(pair: string): Promise<Record<string, unknown>>;
    setAdminWalls(pair: string, sellWalls?: {
        price: number;
        amount: number;
    }[], buyWalls?: {
        price: number;
        amount: number;
    }[]): Promise<Record<string, unknown>>;
    clearAdminWalls(pair: string): Promise<Record<string, unknown>>;
    getPool(pair?: string): Promise<LiquidityPool>;
    getTicker(pair?: string): Promise<Record<string, unknown> | {
        success: boolean;
        pair: string;
        base: string;
        quote: string;
        last: number;
        changePct: number;
        high: number;
        low: number;
        volume: number;
        quoteVolume: number;
        feePct: number;
        spreadPct: number;
    }>;
    getTickers(pairs: string[]): Promise<(Record<string, unknown> | {
        success: boolean;
        pair: string;
        base: string;
        quote: string;
        last: number;
        changePct: number;
        high: number;
        low: number;
        volume: number;
        quoteVolume: number;
        feePct: number;
        spreadPct: number;
    })[]>;
    getOrderBook(depth?: number, pair?: string, telegramId?: string): Promise<Record<string, unknown> | {
        success: boolean;
        pair: string;
        mid: number;
        prevMid: number;
        spread: number;
        asks: {
            price: number;
            amount: number;
            isMine?: boolean;
        }[];
        bids: {
            price: number;
            amount: number;
            isMine?: boolean;
        }[];
        bidShare: number;
    }>;
    getTrades(limit?: number, pair?: string): Promise<Record<string, unknown> | {
        success: boolean;
        trades: any;
    }>;
    getStats(pair?: string): Promise<{
        success: boolean;
        lastBotRunAt: Date;
        botRunCount: number;
        botTrades: any;
        userTrades: any;
        totalTrades: any;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        quoteReserve: number;
        baseReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    getInfo(pair?: string): Promise<Record<string, unknown> | {
        success: boolean;
        pair: string;
        base: string;
        quote: string;
        last: number;
        day: {
            trades: any;
            volume: number;
            quoteVolume: number;
            fees: number;
            buyVolume: number;
            sellVolume: number;
            botVolume: number;
            userVolume: number;
        };
        lifetime: {
            trades: any;
            botTrades: any;
            userTrades: any;
            volume: number;
            fees: number;
            spreadProfit: number;
        };
        pool: {
            quoteReserve: number;
            baseReserve: number;
            lastMid: number;
            feePct: number;
            spreadPct: number;
        };
        hourly: {
            hour: number;
            label: string;
            volume: number;
            count: number;
        }[];
    }>;
    getBotStatus(pair?: string): Promise<{
        pair: string;
        enabled: boolean;
        intervalMinutes: number;
        tradesPerCycle: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        success: boolean;
        botRunCount: number;
        botTrades: any;
        userTrades: any;
        totalTrades: any;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        quoteReserve: number;
        baseReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    updateBotConfig(body: {
        pair?: string;
        enabled?: boolean;
        intervalMinutes?: number;
        tradesPerCycle?: number;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        pair: string;
        enabled: boolean;
        intervalMinutes: number;
        tradesPerCycle: number;
        lastBotRunAt: Date;
        nextBotRunAt: Date;
        botRunCount: number;
        botTrades: any;
        userTrades: any;
        totalTrades: any;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        quoteReserve: number;
        baseReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
        error?: undefined;
    }>;
    getHoldings(telegramId: string, pair?: string): Promise<{
        success: boolean;
        base: string;
        quote: string;
        baseBalance: number;
        quoteBalance: number;
        elixcoin: number;
        elixir: number;
    }>;
    getMaxTradeable(telegramId: string, pair?: string, side?: string): Promise<{
        success: boolean;
        error: string;
        maxBase?: undefined;
        maxQuote?: undefined;
        price?: undefined;
        base?: undefined;
        quote?: undefined;
    } | {
        success: boolean;
        maxBase: number;
        maxQuote: number;
        price: number;
        base: string;
        quote: string;
        error?: undefined;
    }>;
    placeOrder(telegramId: string, body: {
        pair?: string;
        side?: string;
        type?: string;
        amount?: number;
        price?: number;
        tpPrice?: number;
        slPrice?: number;
        iceberg?: boolean;
        icebergChunkSize?: number;
    }): Promise<{
        success: boolean;
        resting: boolean;
        trade: {
            id: string;
            side: "BUY";
            price: number;
            amount: number;
            total: number;
            fee: number;
            feeCurrency: string;
            source: "USER" | "BOT";
        };
        balances: {
            quoteBalance: number;
            elixir: number;
            elixcoin: number;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        resting: boolean;
        trade: {
            id: string;
            side: "SELL";
            price: number;
            amount: number;
            total: number;
            fee: number;
            feeCurrency: string;
            source: "USER" | "BOT";
        };
        balances: {
            quoteBalance: number;
            elixir: number;
            elixcoin: number;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        resting?: undefined;
        order?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        resting: boolean;
        order: {
            id: string;
            side: string;
            price: any;
            amount: any;
            status: string;
            iceberg: boolean;
            icebergTotal: number | undefined;
            icebergChunkSize: number | undefined;
        };
        message: string;
        error?: undefined;
    }>;
    private createTpSlOrder;
    private checkTpSlOrders;
    private executeFill;
    getOpenOrders(telegramId: string, pair?: string): Promise<{
        success: boolean;
        orders: any;
    }>;
    cancelOrder(telegramId: string, orderId: string): Promise<{
        success: boolean;
        error: string;
        order?: undefined;
    } | {
        success: boolean;
        order: any;
        error?: undefined;
    }>;
    getUserTrades(telegramId: string, page?: number, limit?: number, pair?: string): Promise<{
        success: boolean;
        trades: any;
        page: number;
        limit: number;
        hasMore: boolean;
        total: any;
    }>;
    matchOpenOrders(pair?: string): Promise<{
        orderId: string;
        trade: unknown;
    }[]>;
    private driftedThisCycle;
    driftMid(pair?: string): Promise<void>;
    clearDriftCycle(): void;
    botCycle(pair?: string): Promise<{
        count: number;
        trades: Trade[];
    }>;
}
