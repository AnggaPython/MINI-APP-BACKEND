import { TradeSpotService } from "./trade-spot.service";
export declare class TradeSpotController {
    private readonly tradeSpotService;
    constructor(tradeSpotService: TradeSpotService);
    ticker(pair?: string): Promise<any>;
    tickers(body: {
        pairs?: string[];
    }): Promise<{
        success: boolean;
        tickers: any[];
    }>;
    orderbook(telegramId: string, depth?: string, pair?: string): Promise<any>;
    trades(limit?: string, pair?: string): Promise<any>;
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
    info(pair?: string): Promise<{
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
}
