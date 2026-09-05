import { Model } from "mongoose";
import { UserDocument } from "../users/schemas/user.schema";
import { MineSwipeSessionDocument } from "./schemas/mine-swipe-session.schema";
export interface SpinWheelReward {
    type: string;
    amount: number;
    label: string;
    color: string;
}
export declare class FragmentService {
    private userModel;
    private mineSwipeModel;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, mineSwipeModel: Model<MineSwipeSessionDocument>);
    getBalance(telegramId: string): Promise<{
        success: boolean;
        error: string;
        spinWheel?: undefined;
        mineSwipe?: undefined;
        holdingBalance?: undefined;
    } | {
        success: boolean;
        spinWheel: number;
        mineSwipe: number;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        error?: undefined;
    }>;
    rollFragmentDrops(telegramId: string, stoneTier: string): Promise<{
        spinWheel: number;
        mineSwipe: number;
    }>;
    spinWheel(telegramId: string): Promise<{
        success: boolean;
        error: string;
        reward?: undefined;
        fragmentsRemaining?: undefined;
        holdingBalance?: undefined;
    } | {
        success: boolean;
        reward: SpinWheelReward;
        fragmentsRemaining: any;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        error?: undefined;
    }>;
    mineSwipeStart(telegramId: string): Promise<{
        success: boolean;
        error: string;
        sessionId?: undefined;
        boardSize?: undefined;
        mineCount?: undefined;
        rewardPerTile?: undefined;
        fragmentsRemaining?: undefined;
    } | {
        success: boolean;
        sessionId: any;
        boardSize: number;
        mineCount: number;
        rewardPerTile: number;
        fragmentsRemaining: number;
        error?: undefined;
    }>;
    mineSwipeReveal(telegramId: string, sessionId: string, row: number, col: number): Promise<{
        success: boolean;
        error: string;
        hitMine?: undefined;
        gameOver?: undefined;
        accumulatedReward?: undefined;
        minePositions?: undefined;
        revealed?: undefined;
        won?: undefined;
        holdingBalance?: undefined;
        tilesRevealed?: undefined;
        tilesRemaining?: undefined;
    } | {
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
    }>;
    mineSwipeClaim(telegramId: string, sessionId: string): Promise<{
        success: boolean;
        error: string;
        reward?: undefined;
        tilesRevealed?: undefined;
        holdingBalance?: undefined;
    } | {
        success: boolean;
        reward: any;
        tilesRevealed: any;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        error?: undefined;
    }>;
    claimSpinWheelBalance(telegramId: string): Promise<{
        success: boolean;
        error: string;
        claimed?: undefined;
        holdingBalance?: undefined;
        cryptoBalances?: undefined;
    } | {
        success: boolean;
        claimed: number;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        cryptoBalances: Record<string, number>;
        error?: undefined;
    }>;
    claimMineSwipeBalance(telegramId: string): Promise<{
        success: boolean;
        error: string;
        claimed?: undefined;
        holdingBalance?: undefined;
        cryptoBalances?: undefined;
    } | {
        success: boolean;
        claimed: number;
        holdingBalance: {
            spinWheels: number;
            mineSwipe: number;
        };
        cryptoBalances: Record<string, number>;
        error?: undefined;
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
    }>;
}
