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
