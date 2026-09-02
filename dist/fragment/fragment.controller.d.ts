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
        fragmentsRemaining: number;
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
        sessionId: string;
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
        minePositions: string[];
        revealed: string[];
        error?: undefined;
        won?: undefined;
        tilesRevealed?: undefined;
        tilesRemaining?: undefined;
    } | {
        success: boolean;
        hitMine: boolean;
        gameOver: boolean;
        won: boolean;
        accumulatedReward: number;
        revealed: string[];
        error?: undefined;
        minePositions?: undefined;
        tilesRevealed?: undefined;
        tilesRemaining?: undefined;
    } | {
        success: boolean;
        hitMine: boolean;
        gameOver: boolean;
        accumulatedReward: number;
        tilesRevealed: number;
        tilesRemaining: number;
        error?: undefined;
        minePositions?: undefined;
        revealed?: undefined;
        won?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    mineSwipeClaim(telegramId: string, body: {
        sessionId?: string;
    }): Promise<{
        success: boolean;
        reward: number;
        tilesRevealed: number;
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
        sessionId: string;
        boardSize: number;
        mineCount: number;
        revealed: string[];
        accumulatedReward: number;
        rewardPerTile: number;
        status: string;
    } | {
        success: boolean;
        error: string;
    }>;
}
