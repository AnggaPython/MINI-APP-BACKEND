import { TradeSpotService } from "./trade-spot.service";
export declare class TradeSpotController {
    private readonly tradeSpotService;
    constructor(tradeSpotService: TradeSpotService);
    ticker(): Promise<any>;
    orderbook(depth?: string): Promise<any>;
    trades(limit?: string): Promise<any>;
    stats(): Promise<{
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
            trades: any;
            botTrades: any;
            userTrades: any;
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
            price: any;
            amount: any;
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
        order: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
}
