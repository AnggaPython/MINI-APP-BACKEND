import { TradeSpotService } from "./trade-spot.service";
export declare class TradeSpotController {
    private readonly tradeSpotService;
    constructor(tradeSpotService: TradeSpotService);
    ticker(): Promise<{
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
    orderbook(depth?: string): Promise<{
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
    trades(limit?: string): Promise<{
        success: boolean;
        trades: any;
    }>;
    stats(): Promise<{
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
    info(): Promise<{
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
    holdings(telegramId: string): Promise<{
        success: boolean;
        base: string;
        quote: string;
        elixir: number;
        elixcoin: number;
    } | {
        success: boolean;
        error: string;
    }>;
    openOrders(telegramId: string): Promise<{
        success: boolean;
        orders: any;
    } | {
        success: boolean;
        error: string;
    }>;
    userTrades(telegramId: string, page?: string, limit?: string): Promise<{
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
            elixir: number;
            elixcoin: number;
        };
        message: string | undefined;
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
