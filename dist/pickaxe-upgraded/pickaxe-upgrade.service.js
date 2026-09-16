"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PickaxeUpgradeService = exports.SKIN_MILESTONES = exports.PICKAXE_UPGRADE_COST = exports.PICKAXE_UPGRADE_PER_LEVEL = exports.PICKAXE_BASE_STATS = exports.MAX_UPGRADE_LEVEL = void 0;
exports.skinIdFor = skinIdFor;
exports.getUpgradeStats = getUpgradeStats;
exports.getTotalUpgradeCost = getTotalUpgradeCost;
exports.getMaterialToolsNeeded = getMaterialToolsNeeded;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const leveling_service_1 = require("../leveling-miner/leveling.service");
const PICKAXE_TIERS = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
exports.MAX_UPGRADE_LEVEL = 20;
exports.PICKAXE_BASE_STATS = {
    Common: { power: 2.0, maxDurability: 25 },
    Uncommon: { power: 5.0, maxDurability: 50 },
    Rare: { power: 10.0, maxDurability: 75 },
    Epic: { power: 15.0, maxDurability: 100 },
    Legendary: { power: 30.0, maxDurability: 200 },
    Mythic: { power: 60.0, maxDurability: 400 },
};
exports.PICKAXE_UPGRADE_PER_LEVEL = {
    Common: { powerPerLevel: 0.15, durabilityPerLevel: 1.5 },
    Uncommon: { powerPerLevel: 0.25, durabilityPerLevel: 2.5 },
    Rare: { powerPerLevel: 0.4, durabilityPerLevel: 4 },
    Epic: { powerPerLevel: 0.6, durabilityPerLevel: 6 },
    Legendary: { powerPerLevel: 1.0, durabilityPerLevel: 10 },
    Mythic: { powerPerLevel: 1.5, durabilityPerLevel: 15 },
};
exports.PICKAXE_UPGRADE_COST = {
    Common: { IRON: 2500, COPPER: 1000, materialRarity: "COMMON" },
    Uncommon: { COPPER: 2500, SILVER: 1500, materialRarity: "COMMON" },
    Rare: { SILVER: 2000, GOLD: 250, materialRarity: "MEDIUM" },
    Epic: { GOLD: 1000, DIAMOND: 50, materialRarity: "MEDIUM" },
    Legendary: { GOLD: 2500, DIAMOND: 150, materialRarity: "RARE" },
    Mythic: { GOLD: 5000, DIAMOND: 500, materialRarity: "RARE" },
};
exports.SKIN_MILESTONES = [10, 15, 20];
function skinIdFor(tier, level) {
    return `${tier.toLowerCase()}-${level}`;
}
function getUpgradeStats(tier, upgradeLevel) {
    const base = exports.PICKAXE_BASE_STATS[tier];
    const perLevel = exports.PICKAXE_UPGRADE_PER_LEVEL[tier];
    const level = Math.max(0, Math.min(upgradeLevel, exports.MAX_UPGRADE_LEVEL));
    return {
        power: Math.round((base.power + perLevel.powerPerLevel * level) * 100) / 100,
        maxDurability: base.maxDurability + Math.round(perLevel.durabilityPerLevel * level),
    };
}
function getTotalUpgradeCost(tier, targetLevel) {
    const costPerLevel = exports.PICKAXE_UPGRADE_COST[tier];
    const level = Math.min(targetLevel, exports.MAX_UPGRADE_LEVEL);
    const total = {};
    for (const [resource, amount] of Object.entries(costPerLevel)) {
        if (resource === "materialRarity")
            continue;
        total[resource] = (amount || 0) * level;
    }
    return total;
}
function getMaterialToolsNeeded(tier, targetLevel) {
    return Math.min(targetLevel, exports.MAX_UPGRADE_LEVEL);
}
const COMMON_MATERIALS = [
    "Rusty Nail", "Wooden Handle", "Iron Shard", "Copper Wire", "Flint Stone",
    "Hemp Rope", "Leather Strap", "Clay Mold", "Tin Plate", "Bone Fragment",
    "Sandstone Grit", "Charcoal Lump", "Glass Shard", "Rubber Grip", "Brass Rivet",
    "Canvas Wrap", "Iron Bolt", "Slate Chip", "Twine Coil", "Wax Seal",
    "Stone Wheel", "Bronze Pin", "Ash Plank", "Cloth Strip", "Pig Iron Ingot",
];
const MEDIUM_MATERIALS = [
    "Steel Alloy", "Silver Filament", "Copper Coil", "Magnet Core", "Quartz Crystal",
    "Reinforced Spring", "Tempered Glass", "Gold Plating", "Titanium Screw", "Carbon Fiber",
    "Enchanted Rune", "Sapphire Lens", "Power Cell", "Hydraulic Pump", "Servo Motor",
    "Platinum Wire", "Crystal Gear", "Obsidian Blade", "Neon Capacitor", "Phantom Core",
    "Emerald Driver", "Chrono Spring", "Plasma Coil", "Arcane Alloy", "Magnetic Array",
];
const RARE_MATERIALS = [
    "Void Diamond", "Phoenix Feather", "Dragon Scale", "Celestial Core", "Quantum Shard",
    "Starforged Ingot", "Infinity Crystal", "Thunder Essence", "Abyss Pearl", "Solar Fragment",
    "Lunar Prism", "Chaos Ember", "Titan Heart", "Etherium Wire", "Rift Anchor",
    "Frost Nova Core", "Pyroclasm Gem", "Nebula Dust", "Singularity Bolt", "Godslayer Alloy",
    "Timeless Gear", "Dimension Key", "Eternity Matrix", "Primordial Ore", "Omega Circuit",
];
function getMaterialRarity(materialName) {
    if (COMMON_MATERIALS.includes(materialName))
        return "COMMON";
    if (MEDIUM_MATERIALS.includes(materialName))
        return "MEDIUM";
    if (RARE_MATERIALS.includes(materialName))
        return "RARE";
    return null;
}
const MATERIAL_RARITY_ORDER = ["COMMON", "MEDIUM", "RARE"];
function isMaterialRaritySufficient(have, need) {
    return MATERIAL_RARITY_ORDER.indexOf(have) >= MATERIAL_RARITY_ORDER.indexOf(need);
}
let PickaxeUpgradeService = class PickaxeUpgradeService {
    userModel;
    levelingService;
    constructor(userModel, levelingService) {
        this.userModel = userModel;
        this.levelingService = levelingService;
    }
    async getUpgradeStatus(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user) {
            return { success: false, error: "User not found" };
        }
        const ownedPickaxes = user.ownedPickaxes || ["Common"];
        const upgradeLevels = user.pickaxeUpgrades || {};
        const materials = user.materials || {};
        let totalCommon = 0, totalMedium = 0, totalRare = 0;
        for (const [name, count] of Object.entries(materials)) {
            const rarity = getMaterialRarity(name);
            if (rarity === "COMMON")
                totalCommon += count;
            else if (rarity === "MEDIUM")
                totalMedium += count;
            else if (rarity === "RARE")
                totalRare += count;
        }
        const upgrades = {};
        for (const tier of PICKAXE_TIERS) {
            const currentLevel = upgradeLevels[tier] || 0;
            const isOwned = ownedPickaxes.includes(tier);
            const stats = getUpgradeStats(tier, currentLevel);
            const costPerLevel = exports.PICKAXE_UPGRADE_COST[tier];
            let nextUpgradeCost = null;
            let canUpgrade = false;
            if (isOwned && currentLevel < exports.MAX_UPGRADE_LEVEL) {
                nextUpgradeCost = {};
                for (const [resource, amount] of Object.entries(costPerLevel)) {
                    if (resource === "materialRarity")
                        continue;
                    nextUpgradeCost[resource] = amount || 0;
                }
                canUpgrade = true;
                for (const [resource, amount] of Object.entries(nextUpgradeCost)) {
                    const userBalance = user.cryptoBalances?.[resource] || 0;
                    if (userBalance < amount) {
                        canUpgrade = false;
                        break;
                    }
                }
                if (canUpgrade) {
                    const requiredRarity = costPerLevel.materialRarity;
                    if (requiredRarity === "COMMON" && totalCommon < 1)
                        canUpgrade = false;
                    else if (requiredRarity === "MEDIUM" && totalMedium < 1)
                        canUpgrade = false;
                    else if (requiredRarity === "RARE" && totalRare < 1)
                        canUpgrade = false;
                }
            }
            upgrades[tier] = {
                isOwned,
                currentLevel,
                maxLevel: exports.MAX_UPGRADE_LEVEL,
                stats,
                costPerLevel: {
                    ...nextUpgradeCost,
                    materialRarity: costPerLevel.materialRarity,
                },
                canUpgrade,
                totalStats: getUpgradeStats(tier, exports.MAX_UPGRADE_LEVEL),
            };
        }
        return {
            success: true,
            upgrades,
            materialCounts: {
                common: totalCommon,
                medium: totalMedium,
                rare: totalRare,
            },
            unlockedPickaxeSkins: (user.unlockedPickaxeSkins) || [],
            activePickaxeSkins: (user.activePickaxeSkins) || {},
        };
    }
    async upgradePickaxe(telegramId, tier) {
        if (!PICKAXE_TIERS.includes(tier)) {
            return { success: false, error: "Invalid pickaxe tier" };
        }
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user) {
            return { success: false, error: "User not found" };
        }
        const ownedPickaxes = user.ownedPickaxes || ["Common"];
        if (!ownedPickaxes.includes(tier)) {
            return { success: false, error: "Pickaxe not owned" };
        }
        const ux = user;
        if (ux.cryptoBalances == null || ux.materials == null) {
            const setDefaults = {};
            if (ux.cryptoBalances == null)
                setDefaults["cryptoBalances"] = {};
            if (ux.materials == null)
                setDefaults["materials"] = {};
            await this.userModel.updateOne({ telegramId }, { $set: setDefaults }).exec();
        }
        await this.userModel
            .updateOne({ telegramId, [`pickaxeUpgrades.${tier}`]: { $exists: false } }, { $set: { [`pickaxeUpgrades.${tier}`]: 0 } })
            .exec();
        const upgradeLevels = user.pickaxeUpgrades || {};
        const currentLevel = upgradeLevels[tier] || 0;
        if (currentLevel >= exports.MAX_UPGRADE_LEVEL) {
            return { success: false, error: "Pickaxe already at max upgrade level" };
        }
        const costPerLevel = exports.PICKAXE_UPGRADE_COST[tier];
        const materials = user.materials || {};
        const resourceCheck = {};
        for (const [resource, amount] of Object.entries(costPerLevel)) {
            if (resource === "materialRarity")
                continue;
            const needed = amount || 0;
            const have = user.cryptoBalances?.[resource] || 0;
            resourceCheck[resource] = { needed, have, enough: have >= needed };
            if (have < needed) {
                return { success: false, error: `Insufficient ${resource}: need ${needed}, have ${have}` };
            }
        }
        const requiredRarity = costPerLevel.materialRarity;
        let materialFound = null;
        let bestRarityRank = Number.POSITIVE_INFINITY;
        for (const [name, count] of Object.entries(materials)) {
            if (count <= 0)
                continue;
            const rarity = getMaterialRarity(name);
            if (!rarity || !isMaterialRaritySufficient(rarity, requiredRarity))
                continue;
            const rank = MATERIAL_RARITY_ORDER.indexOf(rarity);
            if (rank < bestRarityRank) {
                bestRarityRank = rank;
                materialFound = name;
            }
        }
        if (!materialFound) {
            return { success: false, error: `Need 1 ${requiredRarity} material tool for upgrade` };
        }
        const incUpdate = {};
        for (const [resource, amount] of Object.entries(costPerLevel)) {
            if (resource === "materialRarity")
                continue;
            incUpdate[`cryptoBalances.${resource}`] = -(amount || 0);
        }
        incUpdate[`materials.${materialFound}`] = -1;
        const newLevel = currentLevel + 1;
        const newStats = getUpgradeStats(tier, newLevel);
        const balanceGuards = {};
        for (const [resource, amount] of Object.entries(costPerLevel)) {
            if (resource === "materialRarity")
                continue;
            balanceGuards[`cryptoBalances.${resource}`] = {
                $gte: amount || 0,
            };
        }
        balanceGuards[`materials.${materialFound}`] = { $gte: 1 };
        const updated = await this.userModel
            .findOneAndUpdate({
            telegramId,
            [`pickaxeUpgrades.${tier}`]: currentLevel,
            ...balanceGuards,
        }, {
            $set: { [`pickaxeUpgrades.${tier}`]: newLevel },
            $inc: incUpdate,
        }, { returnDocument: "after" })
            .exec();
        if (!updated) {
            try {
                const fresh = (await this.userModel
                    .findOne({ telegramId })
                    .lean()
                    .exec());
                const reasons = [];
                if (fresh?.pickaxeUpgrades == null) {
                    reasons.push("pickaxeUpgrades map is null (legacy account — dotted query cannot match)");
                }
                const freshLevel = fresh?.pickaxeUpgrades?.[tier] ?? 0;
                if (freshLevel !== currentLevel) {
                    reasons.push(`level changed concurrently (expected ${currentLevel}, now ${String(freshLevel)}) — please retry`);
                }
                else if (!(typeof freshLevel === "number" && freshLevel < exports.MAX_UPGRADE_LEVEL)) {
                    reasons.push(`level is ${String(freshLevel)} (${typeof freshLevel})`);
                }
                for (const [resource, amount] of Object.entries(costPerLevel)) {
                    if (resource === "materialRarity")
                        continue;
                    const have = fresh?.cryptoBalances?.[resource] ?? 0;
                    if (!(typeof have === "number" && have >= (amount || 0))) {
                        reasons.push(`${resource}: have ${String(have)} (${typeof have}), need ${amount}`);
                    }
                }
                const freshMats = fresh?.materials || {};
                const matOk = Object.entries(freshMats).some(([name, count]) => count > 0 &&
                    isMaterialRaritySufficient(getMaterialRarity(name) || "", requiredRarity));
                if (!matOk)
                    reasons.push(`no ${requiredRarity} material tool in inventory`);
                if (reasons.length > 0) {
                    return { success: false, error: `Upgrade blocked — ${reasons.join("; ")}` };
                }
            }
            catch {
            }
            return { success: false, error: "Upgrade failed — insufficient resources or already maxed" };
        }
        let skinUnlocked = null;
        if (exports.SKIN_MILESTONES.includes(newLevel)) {
            skinUnlocked = skinIdFor(tier, newLevel);
            await this.userModel
                .updateOne({ telegramId }, {
                $addToSet: { unlockedPickaxeSkins: skinUnlocked },
                $set: { [`activePickaxeSkins.${tier}`]: skinUnlocked },
            })
                .exec();
        }
        let pickaxeGrants = [];
        try {
            pickaxeGrants = await this.levelingService.grantPendingPickaxes(telegramId);
        }
        catch {
            pickaxeGrants = [];
        }
        return {
            success: true,
            tier,
            newLevel,
            stats: newStats,
            costUsed: {
                ...Object.fromEntries(Object.entries(costPerLevel).filter(([k]) => k !== "materialRarity")),
                [materialFound]: 1,
            },
            pickaxeGrants,
            skinUnlocked,
        };
    }
    async setActiveSkin(telegramId, tier, skin) {
        if (!PICKAXE_TIERS.includes(tier)) {
            return { success: false, error: "Invalid pickaxe tier" };
        }
        if (skin === "default") {
            await this.userModel
                .updateOne({ telegramId }, { $unset: { [`activePickaxeSkins.${tier}`]: 1 } })
                .exec();
            return { success: true, tier, skin };
        }
        const expectedPrefix = `${tier.toLowerCase()}-`;
        if (!skin.startsWith(expectedPrefix)) {
            return { success: false, error: "Skin does not belong to this tier" };
        }
        const milestone = Number(skin.slice(expectedPrefix.length));
        if (!exports.SKIN_MILESTONES.includes(milestone)) {
            return { success: false, error: "Unknown skin" };
        }
        const updated = await this.userModel
            .findOneAndUpdate({ telegramId, unlockedPickaxeSkins: skin }, { $set: { [`activePickaxeSkins.${tier}`]: skin } }, { returnDocument: "after" })
            .exec();
        if (!updated) {
            return { success: false, error: "Skin not unlocked yet" };
        }
        return { success: true, tier, skin };
    }
};
exports.PickaxeUpgradeService = PickaxeUpgradeService;
exports.PickaxeUpgradeService = PickaxeUpgradeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        leveling_service_1.LevelingService])
], PickaxeUpgradeService);
//# sourceMappingURL=pickaxe-upgrade.service.js.map