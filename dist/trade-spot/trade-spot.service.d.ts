import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { User } from "../users/schemas/user.schema";
export declare const PAIR = "ELIXCOIN/ELIXIR";
export declare const BASE = "ELIXCOIN";
export declare const QUOTE = "ELIXIR";
export declare const BASE_PRICE = 0.14872647389;
export declare const FEE_PCT = 0.015;
export declare const SPREAD_PCT = 0.004;
export declare const ELIXCOIN_KEY = "ELIXCOIN";
export declare const MID_MIN = 0.148;
export declare const MID_MAX = 0.151;
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
    getPool(): Promise<LiquidityPool>;
    getTicker(): Promise<any>;
    getOrderBook(depth?: number): Promise<any>;
    getTrades(limit?: number): Promise<any>;
    getStats(): Promise<{
        success: boolean;
        lastBotRunAt: Date;
        botRunCount: number;
        botTrades: number;
        userTrades: number;
        totalTrades: number;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        elixirReserve: number;
        elixcoinReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    getInfo(): Promise<{
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
            elixirReserve: number;
            elixcoinReserve: number;
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
    getBotStatus(): Promise<{
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
        elixirReserve: number;
        elixcoinReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    updateBotConfig(body: {
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
        elixirReserve: number;
        elixcoinReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    } | {
        success: boolean;
        error: string;
    }>;
    getHoldings(telegramId: string): Promise<{
        success: boolean;
        base: string;
        quote: string;
        elixcoin: number;
        elixir: number;
    }>;
    placeOrder(telegramId: string, body: {
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
            feeCurrency: "ELIXIR" | "ELIXCOIN";
            source: "USER" | "BOT";
        };
        balances: {
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
    getOpenOrders(telegramId: string): Promise<{
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
    getUserTrades(telegramId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        trades: any;
        page: number;
        limit: number;
        hasMore: boolean;
        total: number;
    }>;
    matchOpenOrders(): Promise<any[]>;
    driftMid(): Promise<void>;
    botCycle(): Promise<{
        count: number;
        trades: any[];
    }>;
    private randomAmount;
}
