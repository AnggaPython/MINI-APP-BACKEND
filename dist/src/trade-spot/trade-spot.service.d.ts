import { Model } from "mongoose";
import { Trade } from "./schemas/trade.schema";
import { LiquidityPool } from "./schemas/pool.schema";
import { OpenOrder } from "./schemas/open-order.schema";
import { User } from "../users/schemas/user.schema";
export declare const PAIR = "ELIXIR/ELIXCOIN";
export declare const BASE = "ELIXIR";
export declare const QUOTE = "ELIXCOIN";
export declare const BASE_PRICE = 10;
export declare const FEE_PCT = 0.025;
export declare const SPREAD_PCT = 0.004;
export declare const QUOTE_BALANCE_KEY = "ELIXCOIN";
export declare const MID_MIN = 9.5;
export declare const MID_MAX = 10.5;
export declare class TradeSpotService {
    private readonly tradeModel;
    private readonly poolModel;
    private readonly orderModel;
    private readonly userModel;
    constructor(tradeModel: Model<Trade>, poolModel: Model<LiquidityPool>, orderModel: Model<OpenOrder>, userModel: Model<User>);
    getPool(): Promise<LiquidityPool>;
    getTicker(): Promise<{
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
    getOrderBook(depth?: number): Promise<{
        success: boolean;
        pair: string;
        mid: number;
        spread: number;
        asks: {
            price: number;
            amount: number;
        }[];
        bids: {
            price: number;
            amount: number;
        }[];
        bidShare: number;
    }>;
    getTrades(limit?: number): Promise<{
        success: boolean;
        trades: any;
    }>;
    getStats(): Promise<{
        success: boolean;
        lastBotRunAt: Date;
        botRunCount: number;
        botTrades: any;
        userTrades: any;
        totalTrades: any;
        lifetimeVolume: number;
        platformFeesAccumulated: number;
        spreadProfitAccumulated: number;
        elixirReserve: number;
        elixcoinReserve: number;
        lastMid: number;
        feePct: number;
        spreadPct: number;
    }>;
    getHoldings(telegramId: string): Promise<{
        success: boolean;
        base: string;
        quote: string;
        elixir: number;
        elixcoin: number;
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
            source: "BOT" | "USER";
        };
        balances: {
            elixir: number;
            elixcoin: number;
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
            price: any;
            amount: any;
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
        order: any;
        error?: undefined;
    }>;
    matchOpenOrders(): Promise<any[]>;
    driftMid(): Promise<void>;
    botCycle(): Promise<{
        count: number;
        trades: any[];
    }>;
    private randomAmount;
}
