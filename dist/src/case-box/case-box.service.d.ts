import { Model } from "mongoose";
import { CaseBoxDocument, CaseTier, CaseOutcome } from "./schemas/case-box.schema";
import { UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
export declare const CASE_TIER_WEIGHTS: Record<CaseTier, number>;
export declare const OUTCOME_WEIGHTS: Record<CaseOutcome, number>;
export declare const LOOT_RARITY_WEIGHTS: Record<CaseTier, number>;
export declare const ELIXCOIN_BANDS: Record<CaseTier, [number, number]>;
export declare const MATERIAL_AMOUNTS: Record<CaseTier, [number, number]>;
export declare const CASE_HP_BANDS: Record<CaseTier, [number, number]>;
export declare const CASE_DURABILITY_COST = 3;
export declare const CASE_MATERIALS: Record<CaseTier, string[]>;
export declare class CaseBoxService {
    private readonly caseBoxModel;
    private readonly userModel;
    private readonly usersService;
    private readonly lastSpawnAt;
    constructor(caseBoxModel: Model<CaseBoxDocument>, userModel: Model<UserDocument>, usersService: UsersService);
    private roll01;
    private weightedPick;
    spawn(telegramId: string): Promise<{
        success: boolean;
        error: string;
        durabilityCost?: undefined;
        box?: undefined;
    } | {
        success: boolean;
        durabilityCost: number;
        box: {
            caseId: string;
            tier: CaseTier;
            maxHp: number;
        };
        error?: undefined;
    }>;
    destroy(telegramId: string, caseId: string): Promise<{
        success: boolean;
        error: string;
        caseId?: undefined;
        tier?: undefined;
        outcome?: undefined;
        rarity?: undefined;
        loot?: undefined;
    } | {
        success: boolean;
        caseId: string;
        tier: CaseTier;
        outcome: CaseOutcome;
        rarity: CaseTier | null;
        loot: Record<string, number> | null;
        error?: undefined;
    }>;
    claimCase(caseId: string, telegramId: string): Promise<{
        success: boolean;
        error: string;
        adRequired?: undefined;
    } | {
        success: boolean;
        adRequired: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
        adRequired?: undefined;
    }>;
    history(telegramId: string): Promise<{
        success: boolean;
        history: {
            caseId: string;
            tier: CaseTier;
            maxHp: number;
            outcome: CaseOutcome | null;
            rarity: CaseTier | null;
            loot: Record<string, number>;
            openedAt: Date | null;
        }[];
    }>;
}
