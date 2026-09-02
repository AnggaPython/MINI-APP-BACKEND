import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";

type UserWithPickaxe = User & {
  ownedPickaxes?: string[];
  pickaxeUpgrades?: Record<string, number>;
  materials?: Record<string, number>;
  cryptoBalances?: Record<string, number>;
};

// ── Pickaxe Tier Types ─────────────────────────────────────────────────────
export type PickaxeTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

const PICKAXE_TIERS: PickaxeTier[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

// ── Upgrade Constants ──────────────────────────────────────────────────────
export const MAX_UPGRADE_LEVEL = 20;

// Base stats per tier (level 0 = no upgrade)
interface PickaxeBaseStats {
  power: number;      // ATK
  maxDurability: number;
}

export const PICKAXE_BASE_STATS: Record<PickaxeTier, PickaxeBaseStats> = {
  Common:    { power: 2.0,  maxDurability: 25 },
  Uncommon:  { power: 5.0,  maxDurability: 50 },
  Rare:      { power: 10.0, maxDurability: 75 },
  Epic:      { power: 15.0, maxDurability: 100 },
  Legendary: { power: 30.0, maxDurability: 200 },
  Mythic:    { power: 60.0, maxDurability: 400 },
};

// Stat increase per upgrade level
interface PickaxeUpgradePerLevel {
  powerPerLevel: number;
  durabilityPerLevel: number;
}

export const PICKAXE_UPGRADE_PER_LEVEL: Record<PickaxeTier, PickaxeUpgradePerLevel> = {
  Common:    { powerPerLevel: 0.15,  durabilityPerLevel: 1.5 },
  Uncommon:  { powerPerLevel: 0.25,  durabilityPerLevel: 2.5 },
  Rare:      { powerPerLevel: 0.4,   durabilityPerLevel: 4 },
  Epic:      { powerPerLevel: 0.6,   durabilityPerLevel: 6 },
  Legendary: { powerPerLevel: 1.0,   durabilityPerLevel: 10 },
  Mythic:    { powerPerLevel: 1.5,   durabilityPerLevel: 15 },
};

// Resource cost per upgrade level
export interface UpgradeCost {
  IRON?: number;
  COPPER?: number;
  SILVER?: number;
  GOLD?: number;
  DIAMOND?: number;
  materialRarity: "COMMON" | "MEDIUM" | "RARE"; // 1 material tool needed
}

export const PICKAXE_UPGRADE_COST: Record<PickaxeTier, UpgradeCost> = {
  Common:    { IRON: 2500,   COPPER: 1000, materialRarity: "COMMON" },
  Uncommon:  { COPPER: 2500, SILVER: 1500, materialRarity: "COMMON" },
  Rare:      { SILVER: 2000, GOLD: 250,    materialRarity: "MEDIUM" },
  Epic:      { GOLD: 1000,   DIAMOND: 50,  materialRarity: "MEDIUM" },
  Legendary: { GOLD: 2500,   DIAMOND: 150, materialRarity: "RARE" },
  Mythic:    { GOLD: 5000,   DIAMOND: 500, materialRarity: "RARE" },
};

// ── Helper Functions ───────────────────────────────────────────────────────

/** Calculate effective stats at a given upgrade level */
export function getUpgradeStats(tier: PickaxeTier, upgradeLevel: number): PickaxeBaseStats {
  const base = PICKAXE_BASE_STATS[tier];
  const perLevel = PICKAXE_UPGRADE_PER_LEVEL[tier];
  const level = Math.max(0, Math.min(upgradeLevel, MAX_UPGRADE_LEVEL));
  return {
    power: Math.round((base.power + perLevel.powerPerLevel * level) * 100) / 100,
    maxDurability: base.maxDurability + Math.round(perLevel.durabilityPerLevel * level),
  };
}

/** Calculate total resource cost for upgrading from level 0 to target level */
export function getTotalUpgradeCost(tier: PickaxeTier, targetLevel: number): Record<string, number> {
  const costPerLevel = PICKAXE_UPGRADE_COST[tier];
  const level = Math.min(targetLevel, MAX_UPGRADE_LEVEL);
  const total: Record<string, number> = {};
  
  for (const [resource, amount] of Object.entries(costPerLevel)) {
    if (resource === "materialRarity") continue;
    total[resource] = (amount || 0) * level;
  }
  
  return total;
}

/** Calculate material tools needed for full upgrade */
  // @ts-ignore - super strict cleanup pending (auto)
export function getMaterialToolsNeeded(tier: PickaxeTier, targetLevel: number): number {
  return Math.min(targetLevel, MAX_UPGRADE_LEVEL);
}

// ── Common Material Names (for validation) ─────────────────────────────────
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

function getMaterialRarity(materialName: string): string | null {
  if (COMMON_MATERIALS.includes(materialName)) return "COMMON";
  if (MEDIUM_MATERIALS.includes(materialName)) return "MEDIUM";
  if (RARE_MATERIALS.includes(materialName)) return "RARE";
  return null;
}

function isMaterialRaritySufficient(have: string, need: string): boolean {
  const order = ["COMMON", "MEDIUM", "RARE"];
  return order.indexOf(have) >= order.indexOf(need);
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class PickaxeUpgradeService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /** Get upgrade status for all pickaxes */
  async getUpgradeStatus(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const ownedPickaxes = (user as unknown as UserWithPickaxe).ownedPickaxes || ["Common"];
    const upgradeLevels: Record<string, number> = (user as unknown as UserWithPickaxe).pickaxeUpgrades || {};
    const materials: Record<string, number> = (user as unknown as UserWithPickaxe).materials || {};

    // Count materials by rarity
    let totalCommon = 0, totalMedium = 0, totalRare = 0;
    for (const [name, count] of Object.entries(materials)) {
      const rarity = getMaterialRarity(name);
      if (rarity === "COMMON") totalCommon += count;
      else if (rarity === "MEDIUM") totalMedium += count;
      else if (rarity === "RARE") totalRare += count;
    }

    // Build upgrade info for each tier
    const upgrades: Record<string, Record<string, unknown>> = {};
    for (const tier of PICKAXE_TIERS) {
      const currentLevel = upgradeLevels[tier] || 0;
      const isOwned = ownedPickaxes.includes(tier);
      const stats = getUpgradeStats(tier, currentLevel);
      const costPerLevel = PICKAXE_UPGRADE_COST[tier];

      // Calculate cost for next upgrade
      let nextUpgradeCost: Record<string, number> | null = null;
      let canUpgrade = false;
      
      if (isOwned && currentLevel < MAX_UPGRADE_LEVEL) {
        nextUpgradeCost = {};
        for (const [resource, amount] of Object.entries(costPerLevel)) {
          if (resource === "materialRarity") continue;
          nextUpgradeCost[resource] = amount || 0;
        }
        
        // Check if user has enough resources
        canUpgrade = true;
        for (const [resource, amount] of Object.entries(nextUpgradeCost)) {
          const userBalance = (user as unknown as UserWithPickaxe).cryptoBalances?.[resource] || 0;
          if (userBalance < amount) {
            canUpgrade = false;
            break;
          }
        }
        
        // Check if user has enough materials
        if (canUpgrade) {
          const requiredRarity = costPerLevel.materialRarity;
          if (requiredRarity === "COMMON" && totalCommon < 1) canUpgrade = false;
          else if (requiredRarity === "MEDIUM" && totalMedium < 1) canUpgrade = false;
          else if (requiredRarity === "RARE" && totalRare < 1) canUpgrade = false;
        }
      }

      upgrades[tier] = {
        isOwned,
        currentLevel,
        maxLevel: MAX_UPGRADE_LEVEL,
        stats,
        costPerLevel: {
          ...nextUpgradeCost,
          materialRarity: costPerLevel.materialRarity,
        },
        canUpgrade,
        totalStats: getUpgradeStats(tier, MAX_UPGRADE_LEVEL),
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
    };
  }

  /** Upgrade a pickaxe to the next level */
  async upgradePickaxe(telegramId: string, tier: string) {
    if (!PICKAXE_TIERS.includes(tier as PickaxeTier)) {
      return { success: false, error: "Invalid pickaxe tier" };
    }

    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const ownedPickaxes = (user as unknown as UserWithPickaxe).ownedPickaxes || ["Common"];
    if (!ownedPickaxes.includes(tier)) {
      return { success: false, error: "Pickaxe not owned" };
    }

    const upgradeLevels: Record<string, number> = (user as unknown as UserWithPickaxe).pickaxeUpgrades || {};
    const currentLevel = upgradeLevels[tier] || 0;

    if (currentLevel >= MAX_UPGRADE_LEVEL) {
      return { success: false, error: "Pickaxe already at max upgrade level" };
    }

    const costPerLevel = PICKAXE_UPGRADE_COST[tier as PickaxeTier];
    const materials: Record<string, number> = (user as unknown as UserWithPickaxe).materials || {};

    // Check resources
    const resourceCheck: Record<string, { needed: number; have: number; enough: boolean }> = {};
    for (const [resource, amount] of Object.entries(costPerLevel)) {
      if (resource === "materialRarity") continue;
      const needed = amount || 0;
      const have = (user as unknown as UserWithPickaxe).cryptoBalances?.[resource] || 0;
      resourceCheck[resource] = { needed, have, enough: have >= needed };
      if (have < needed) {
        return { success: false, error: `Insufficient ${resource}: need ${needed}, have ${have}` };
      }
    }

    // Check material tool
    const requiredRarity = costPerLevel.materialRarity;
    let materialFound: string | null = null;
    for (const [name, count] of Object.entries(materials)) {
      if (count <= 0) continue;
      const rarity = getMaterialRarity(name);
      if (rarity && isMaterialRaritySufficient(rarity, requiredRarity)) {
        materialFound = name;
        break;
      }
    }

    if (!materialFound) {
      return { success: false, error: `Need 1 ${requiredRarity} material tool for upgrade` };
    }

    // Atomic update: deduct resources + material, increment upgrade level
    const incUpdate: Record<string, number> = {};
    for (const [resource, amount] of Object.entries(costPerLevel)) {
      if (resource === "materialRarity") continue;
      incUpdate[`cryptoBalances.${resource}`] = -(amount || 0);
    }
    incUpdate[`materials.${materialFound}`] = -1;

    const newLevel = currentLevel + 1;
    const newStats = getUpgradeStats(tier as PickaxeTier, newLevel);

    const updated = await this.userModel
      .findOneAndUpdate(
        {
          telegramId,
          [`pickaxeUpgrades.${tier}`]: { $lt: MAX_UPGRADE_LEVEL },
        },
        {
          $set: { [`pickaxeUpgrades.${tier}`]: newLevel },
          $inc: incUpdate,
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return { success: false, error: "Upgrade failed — insufficient resources or already maxed" };
    }

    return {
      success: true,
      tier,
      newLevel,
      stats: newStats,
      costUsed: {
        ...Object.fromEntries(
          Object.entries(costPerLevel).filter(([k]) => k !== "materialRarity")
        ),
        [materialFound]: 1,
      },
    };
  }
}
