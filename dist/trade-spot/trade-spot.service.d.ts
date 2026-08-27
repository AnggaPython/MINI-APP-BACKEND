import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { User } from "../users/schemas/user.schema";
import { AssetRegistryService } from "./asset-registry.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
export declare const DEFAULT_PAIR = "ELIXCOIN/ELIXIR";
export declare const FEE_PCT = 0.015;
export declare const SPREAD_PCT = 0.004;
export declare const CORE_BOT_PAIRS: Set<string>;
export declare const MINERAL_INITIAL_RATES: Record<string, number>;
export declare class TradeSpotService {
    private readonly tradeModel;
    private readonly poolModel;
    private readonly orderModel;
    private readonly userModel;
    private readonly assetRegistry;
    private readonly buffCollectionsService;
    private readonly orderTimestamps;
    private readonly cancelTimestamps;
    private tickerCache;
    private bookCache;
    private tradesCache;
    private readonly logger;
    constructor(tradeModel: Model<Trade>, poolModel: Model<LiquidityPool>, orderModel: Model<OpenOrder>, userModel: Model<User>, assetRegistry: AssetRegistryService, buffCollectionsService: BuffItemCollectionsService);
    private evictRateLimit;
    private checkRateLimit;
    getAllActivePools(): Promise<LiquidityPool[]>;
    getAllPools(): Promise<LiquidityPool[]>;
    setAdminPriceControl(pair: string, bidFloor: number, askCeiling: number): Promise<any>;
    clearAdminPriceControl(pair: string): Promise<any>;
    setAdminWalls(pair: string, sellWalls?: {
        price: number;
        amount: number;
    }[], buyWalls?: {
        price: number;
        amount: number;
    }[]): Promise<any>;
    clearAdminWalls(pair: string): Promise<any>;
    getPool(pair?: string): Promise<LiquidityPool>;
    getTicker(pair?: string): Promise<any>;
    getTickers(pairs: string[]): Promise<any[]>;
    getOrderBook(depth?: number, pair?: string, telegramId?: string): Promise<any>;
    getTrades(limit?: number, pair?: string): Promise<any>;
    getStats(pair?: string): Promise<{
        success: boolean;
        lastBotRunAt: Date;
        botRunCount: number;
        botTrades: number;
        userTrades: number;
        totalTrades: number;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        quoteReserve: number;
        baseReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    getInfo(pair?: string): Promise<{
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
            trades: number;
            botTrades: number;
            userTrades: number;
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
        hourly: any[];
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
        botTrades: number;
        userTrades: number;
        totalTrades: number;
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
        botTrades: number;
        userTrades: number;
        totalTrades: number;
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
    }): Promise<{
        message: string;
        autoGranted?: number | undefined;
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
            source: "BOT" | "USER";
        };
        balances: {
            baseBalance: number;
            quoteBalance: number;
            elixir: number;
            elixcoin: number;
        };
        error?: undefined;
    } | {
        message: string;
        buffRemoved?: number | undefined;
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
            source: "BOT" | "USER";
        };
        balances: {
            baseBalance: number;
            quoteBalance: number;
            elixir: number;
            elixcoin: number;
        };
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
            price: number;
            amount: number;
            status: string;
        };
        message: string;
        error?: undefined;
    }>;
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
        order: import("mongoose").Document<unknown, {}, OpenOrder, {}, import("mongoose").DefaultSchemaOptions> & OpenOrder & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    }>;
    getUserTrades(telegramId: string, page?: number, limit?: number, pair?: string): Promise<{
        success: boolean;
        trades: any;
        page: number;
        limit: number;
        hasMore: boolean;
        total: number;
    }>;
    matchOpenOrders(pair?: string): Promise<any[]>;
    private static readonly STABLE_ASSETS;
    private driftedThisCycle;
    driftMid(pair?: string): Promise<void>;
    clearDriftCycle(): void;
    botCycle(pair?: string): Promise<{
        count: number;
        trades: any[];
    }>;
}
