import { CaseBoxService } from "./case-box.service";
export declare class CaseBoxController {
    private readonly caseBoxService;
    constructor(caseBoxService: CaseBoxService);
    spawn(telegramId: string): Promise<{
        success: boolean;
        error: string;
        cooldownLeft: number;
        durabilityCost?: undefined;
        box?: undefined;
    } | {
        success: boolean;
        durabilityCost: number;
        box: {
            caseId: string;
            tier: import("./schemas/case-box.schema").CaseTier;
            maxHp: number;
        };
        error?: undefined;
        cooldownLeft?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    checkStatus(telegramId: string, caseId: string): Promise<{
        success: boolean;
        exists: boolean;
        status: null;
        tier?: undefined;
        maxHp?: undefined;
    } | {
        success: boolean;
        exists: boolean;
        status: string;
        tier: import("./schemas/case-box.schema").CaseTier;
        maxHp: number;
    } | {
        success: boolean;
        error: string;
    }>;
    destroyCase(telegramId: string, caseId: string): Promise<{
        success: boolean;
        caseId: string;
        tier: import("./schemas/case-box.schema").CaseTier;
        outcome: import("./schemas/case-box.schema").CaseOutcome;
        rarity: import("./schemas/case-box.schema").CaseTier | null;
        loot: Record<string, number> | null;
        buffGranted: unknown;
        economyMultiplier: number | undefined;
        droprateBonus: number | undefined;
        starCount: number;
        xpAwarded: number;
        level: number;
        levelUp: boolean;
        newLevel: number;
        pickaxeGrants: string[];
        pendingStars: number;
        lockedLevel: number | null;
        levelMultiplier: number;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    claimCase(telegramId: string, caseId: string): Promise<{
        success: boolean;
        adRequired: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
        adRequired?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    history(telegramId: string): Promise<{
        success: boolean;
        history: {
            caseId: string;
            tier: import("./schemas/case-box.schema").CaseTier;
            maxHp: number;
            outcome: import("./schemas/case-box.schema").CaseOutcome | null;
            rarity: import("./schemas/case-box.schema").CaseTier | null;
            loot: Record<string, number>;
            openedAt: Date | null;
        }[];
    } | {
        success: boolean;
        error: string;
    }>;
}
