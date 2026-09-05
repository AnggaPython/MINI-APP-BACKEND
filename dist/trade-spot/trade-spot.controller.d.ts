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
        trades: any;
    }>;
    stats(pair?: string): Promise<{
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
        orders: any;
    } | {
        success: boolean;
        error: string;
    }>;
    userTrades(telegramId: string, page?: string, limit?: string, pair?: string): Promise<{
        success: boolean;
        trades: any;
        page: number;
        limit: number;
        hasMore: boolean;
        total: any;
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
    } | {
        success: boolean;
        error: string;
    }>;
    cancelOrder(telegramId: string, body: {
        orderId?: string;
    }): Promise<{
        success: boolean;
        order: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    events(pair: string, res: Response): void;
}
