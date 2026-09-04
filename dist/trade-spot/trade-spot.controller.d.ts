import type { Response } from "express";
import { TradeSpotService } from "./trade-spot.service";
import { SseService } from "./sse.service";
export declare class TradeSpotController {
    private readonly tradeSpotService;
    private readonly sseService;
    constructor(tradeSpotService: TradeSpotService, sseService: SseService);
    pairs(): Promise<{
        success: boolean;
        pairs: string[];
    }>;
    ticker(pair?: string): Promise<Record<string, unknown> | {
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
    tickers(body: {
        pairs?: string[];
    }): Promise<{
        success: boolean;
        tickers: (Record<string, unknown> | {
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
        })[];
    }>;
    orderbook(telegramId: string, depth?: string, pair?: string): Promise<Record<string, unknown> | {
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
    trades(limit?: string, pair?: string): Promise<Record<string, unknown> | {
        success: boolean;
        trades: {
            id: string;
            side: "BUY" | "SELL";
            price: number;
            amount: number;
            total: number;
            fee: number;
            source: "BOT" | "USER";
            time: Date;
        }[];
    }>;
    stats(pair?: string): Promise<{
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
    info(pair?: string): Promise<Record<string, unknown> | {
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
        hourly: {
            hour: number;
            label: string;
            volume: number;
            count: number;
        }[];
    }>;
    holdings(telegramId: string, pair?: string): Promise<{
        success: boolean;
        base: string;
        quote: string;
        baseBalance: number;
        quoteBalance: number;
        elixcoin: number;
        elixir: number;
    } | {
        success: boolean;
        error: string;
    }>;
    maxTradeable(telegramId: string, pair?: string, side?: string): Promise<{
        success: boolean;
        maxBase: number;
        maxQuote: number;
        price: number;
        base: string;
        quote: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    openOrders(telegramId: string, pair?: string): Promise<{
        success: boolean;
        orders: {
            id: string;
            side: "BUY" | "SELL";
            price: number;
            amount: number;
            status: "OPEN" | "FILLED" | "CANCELLED";
            createdAt: Date;
        }[];
    } | {
        success: boolean;
        error: string;
    }>;
    userTrades(telegramId: string, page?: string, limit?: string, pair?: string): Promise<{
        success: boolean;
        trades: {
            id: string;
            side: "BUY" | "SELL";
            price: number;
            amount: number;
            total: number;
            fee: number;
            feeCurrency: string;
            source: "BOT" | "USER";
            time: Date;
        }[];
        page: number;
        limit: number;
        hasMore: boolean;
        total: number;
    } | {
        success: boolean;
        error: string;
    }>;
    placeOrder(telegramId: string, body: {
        side?: string;
        type?: string;
        amount?: number;
        price?: number;
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
            source: "BOT" | "USER";
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
            source: "BOT" | "USER";
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
        order: {
            id: string;
            side: string;
            price: number;
            amount: number;
            status: string;
            iceberg: boolean;
            icebergTotal: number | undefined;
            icebergChunkSize: number | undefined;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    cancelOrder(telegramId: string, body: {
        orderId?: string;
    }): Promise<{
        success: boolean;
        order: import("mongoose").Document<unknown, {}, import("./schemas/open-order.schema").OpenOrder, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/open-order.schema").OpenOrder & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    events(pair: string, res: Response): void;
}
