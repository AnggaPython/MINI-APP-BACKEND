import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { User } from "../users/schemas/user.schema";
export declare const DEFAULT_PAIR = "ELIXCOIN/ELIXIR";
export declare const FEE_PCT = 0.015;
export declare const SPREAD_PCT = 0.004;
export declare class TradeSpotService {
    private readonly tradeModel;
    private readonly poolModel;
    private readonly orderModel;
    private readonly userModel;
    private readonly orderTimestamps;
    private readonly cancelTimestamps;
    private tickerCache;
    private bookCache;
    private tradesCache;
    constructor(tradeModel: Model<Trade>, poolModel: Model<LiquidityPool>, orderModel: Model<OpenOrder>, userModel: Model<User>);
    private evictRateLimit;
    private checkRateLimit;
    getAllActivePools(): Promise<LiquidityPool[]>;
    getPool(pair?: string): Promise<LiquidityPool>;
    getTicker(pair?: string): Promise<any>;
    getOrderBook(depth?: number, pair?: string): Promise<any>;
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
        enabled: boolean;
        intervalMinutes: number;
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
    }): Promise<{
        enabled: boolean;
        intervalMinutes: number;
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
    } | {
        success: boolean;
        error: string;
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
    placeOrder(telegramId: string, body: {
        pair?: string;
        side?: string;
        type?: string;
        amount?: number;
        price?: number;
    }): Promise<{
        success: boolean;
        trade: {
            id: string;
            side: "BUY" | "SELL";
            price: number;
            amount: number;
            total: number;
            fee: number;
            feeCurrency: string;
            source: "USER" | "BOT";
        };
        balances: {
            baseBalance: number;
            quoteBalance: number;
            elixcoin: number;
            elixir: number;
        };
        message: string | undefined;
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
    driftMid(pair?: string): Promise<void>;
    botCycle(pair?: string): Promise<{
        count: number;
        trades: any[];
    }>;
}
