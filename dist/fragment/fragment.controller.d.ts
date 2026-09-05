import { FragmentService } from "./fragment.service";
export declare class FragmentController {
    private readonly fragmentService;
    constructor(fragmentService: FragmentService);
    getBalance(telegramId: string): Promise<{
        success: boolean;
        spinWheel: number;
        mineSwipe: number;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    spinWheel(telegramId: string): Promise<{
        success: boolean;
        reward: import("./fragment.service").SpinWheelReward;
        fragmentsRemaining: any;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    claimSpinWheel(telegramId: string): Promise<{
        success: boolean;
        claimed: number;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        cryptoBalances: Record<string, number>;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    claimMineSwipe(telegramId: string): Promise<{
        success: boolean;
        claimed: number;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        cryptoBalances: Record<string, number>;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    mineSwipeStart(telegramId: string): Promise<{
        success: boolean;
        sessionId: any;
        boardSize: number;
        mineCount: number;
        rewardPerTile: number;
        fragmentsRemaining: number;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    mineSwipeReveal(telegramId: string, body: {
        sessionId?: string;
        row?: number;
        col?: number;
    }): Promise<{
        success: boolean;
        hitMine: boolean;
        gameOver: boolean;
        accumulatedReward: number;
        minePositions: any;
        revealed: any;
        error?: undefined;
        won?: undefined;
        holdingBalance?: undefined;
        tilesRevealed?: undefined;
        tilesRemaining?: undefined;
    } | {
        success: boolean;
        hitMine: boolean;
        gameOver: boolean;
        won: boolean;
        accumulatedReward: any;
        revealed: any;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        error?: undefined;
        minePositions?: undefined;
        tilesRevealed?: undefined;
        tilesRemaining?: undefined;
    } | {
        success: boolean;
        hitMine: boolean;
        gameOver: boolean;
        accumulatedReward: any;
        tilesRevealed: any;
        tilesRemaining: number;
        error?: undefined;
        minePositions?: undefined;
        revealed?: undefined;
        won?: undefined;
        holdingBalance?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    mineSwipeClaim(telegramId: string, body: {
        sessionId?: string;
    }): Promise<{
        success: boolean;
        reward: any;
        tilesRevealed: any;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    mineSwipeStatus(telegramId: string): Promise<{
        success: boolean;
        active: boolean;
        sessionId?: undefined;
        boardSize?: undefined;
        mineCount?: undefined;
        revealed?: undefined;
        accumulatedReward?: undefined;
        rewardPerTile?: undefined;
        status?: undefined;
    } | {
        success: boolean;
        active: boolean;
        sessionId: any;
        boardSize: any;
        mineCount: any;
        revealed: any;
        accumulatedReward: any;
        rewardPerTile: any;
        status: any;
    } | {
        success: boolean;
        error: string;
    }>;
}
