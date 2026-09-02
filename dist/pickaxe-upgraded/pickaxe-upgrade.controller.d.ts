import { PickaxeUpgradeService } from "./pickaxe-upgrade.service";
export declare class PickaxeUpgradeController {
    private readonly upgradeService;
    constructor(upgradeService: PickaxeUpgradeService);
    getUpgradeStatus(telegramId: string): Promise<{
        success: boolean;
        upgrades: Record<string, Record<string, unknown>>;
        materialCounts: {
            common: number;
            medium: number;
            rare: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    upgradePickaxe(telegramId: string, body: {
        tier?: string;
    }): Promise<any>;
}
