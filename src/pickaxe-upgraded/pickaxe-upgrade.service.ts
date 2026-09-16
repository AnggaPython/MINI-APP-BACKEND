import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import { LevelingService } from "../leveling-miner/leveling.service";

type UserWithPickaxe = User & {
  ownedPickaxes?: string[];
  pickaxeUpgrades?: Record<string, number>;
  materials?: Record<string, number>;
  cryptoBalances?: Record<string, number>;
  unlockedPickaxeSkins?: string[];
  activePickaxeSkins?: Record<string, string>;
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

// Skin milestones: each tier unlocks 3 distinct skins at upgrade levels
// 10 / 15 / 20 (visual only, no stats). Skin id: "<tier-lower>-<level>".
export const SKIN_MILESTONES = [10, 15, 20];

export function skinIdFor(tier: string, level: number): string {
  return `${tier.toLowerCase()}-${level}`;
}

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

/** Ascending rarity order — also used to pick the CHEAPEST sufficient material. */
const MATERIAL_RARITY_ORDER = ["COMMON", "MEDIUM", "RARE"];

function isMaterialRaritySufficient(have: string, need: string): boolean {
  return MATERIAL_RARITY_ORDER.indexOf(have) >= MATERIAL_RARITY_ORDER.indexOf(need);
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class PickaxeUpgradeService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private levelingService: LevelingService,
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
      unlockedPickaxeSkins: ((user as unknown as UserWithPickaxe).unlockedPickaxeSkins) || [],
      activePickaxeSkins: ((user as unknown as UserWithPickaxe).activePickaxeSkins) || {},
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

    // Self-heal legacy docs: accounts created before these map fields existed
    // hold NULL (or lack the keys entirely). A dotted comparison ($lt/$gte)
    // NEVER matches a missing path in MongoDB, so the atomic update below
    // would fail forever regardless of balances. Normalize once, then proceed.
    const ux = user as unknown as UserWithPickaxe;
    if (ux.cryptoBalances == null || ux.materials == null) {
      const setDefaults: Record<string, unknown> = {};
      if (ux.cryptoBalances == null) setDefaults["cryptoBalances"] = {};
      if (ux.materials == null) setDefaults["materials"] = {};
      await this.userModel.updateOne({ telegramId }, { $set: setDefaults }).exec();
    }
    // The upgrade-level key itself must EXIST for the $lt guard below —
    // initialize this tier to 0 when absent (covers null parent too, as $set
    // with a dotted path creates any missing ancestors).
    await this.userModel
      .updateOne(
        { telegramId, [`pickaxeUpgrades.${tier}`]: { $exists: false } },
        { $set: { [`pickaxeUpgrades.${tier}`]: 0 } },
      )
      .exec();

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
    // Pick the CHEAPEST sufficient material, not the first one the document
    // happens to iterate over. `isMaterialRaritySufficient` accepts any higher
    // rarity, so "first match wins" burned a player's rare tool on a Common
    // recipe (measured: the only Void Diamond consumed while 5 Rusty Nails
    // survived) — silently and non-deterministically.
    let materialFound: string | null = null;
    let bestRarityRank = Number.POSITIVE_INFINITY;
    for (const [name, count] of Object.entries(materials)) {
      if (count <= 0) continue;
      const rarity = getMaterialRarity(name);
      if (!rarity || !isMaterialRaritySufficient(rarity, requiredRarity)) continue;
      const rank = MATERIAL_RARITY_ORDER.indexOf(rarity);
      if (rank < bestRarityRank) {
        bestRarityRank = rank;
        materialFound = name;
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

    // Balance guards, re-checked atomically inside the same operation: the
    // snapshot above can go stale (concurrent spend / double-submit), and a
    // bare $inc would overdraft. If any guard fails the update matches
    // nothing and the caller gets the insufficient-resources error below.
    const balanceGuards: Record<string, unknown> = {};
    for (const [resource, amount] of Object.entries(costPerLevel)) {
      if (resource === "materialRarity") continue;
      balanceGuards[`cryptoBalances.${resource}`] = {
        $gte: (amount as number) || 0,
      };
    }
    balanceGuards[`materials.${materialFound}`] = { $gte: 1 };

    const updated = await this.userModel
      .findOneAndUpdate(
        {
          telegramId,
          // Exact expected level (not just $lt MAX): two concurrent upgrades
          // for the same level would otherwise BOTH match, double-charging
          // for a single level gain. The loser gets null → retryable error.
          [`pickaxeUpgrades.${tier}`]: currentLevel,
          ...balanceGuards,
        },
        {
          $set: { [`pickaxeUpgrades.${tier}`]: newLevel },
          $inc: incUpdate,
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      // Self-diagnosing failure: re-read the fresh document and report EXACTLY
      // which condition rejected the atomic update, instead of a generic text.
      // (Snapshot checks above can go stale; type drift like a string level
      // would also only show up here.)
      try {
        const fresh = (await this.userModel
          .findOne({ telegramId })
          .lean()
          .exec()) as unknown as UserWithPickaxe | null;
        const reasons: string[] = [];
        if (fresh?.pickaxeUpgrades == null) {
          reasons.push("pickaxeUpgrades map is null (legacy account — dotted query cannot match)");
        }
        const freshLevel: unknown = fresh?.pickaxeUpgrades?.[tier] ?? 0;
        if (freshLevel !== currentLevel) {
          reasons.push(`level changed concurrently (expected ${currentLevel}, now ${String(freshLevel)}) — please retry`);
        } else if (!(typeof freshLevel === "number" && freshLevel < MAX_UPGRADE_LEVEL)) {
          reasons.push(`level is ${String(freshLevel)} (${typeof freshLevel})`);
        }
        for (const [resource, amount] of Object.entries(costPerLevel)) {
          if (resource === "materialRarity") continue;
          const have: unknown = fresh?.cryptoBalances?.[resource] ?? 0;
          if (!(typeof have === "number" && have >= ((amount as number) || 0))) {
            reasons.push(`${resource}: have ${String(have)} (${typeof have}), need ${amount}`);
          }
        }
        const freshMats: Record<string, number> = fresh?.materials || {};
        const matOk = Object.entries(freshMats).some(
          ([name, count]) =>
            count > 0 &&
            isMaterialRaritySufficient(getMaterialRarity(name) || "", requiredRarity),
        );
        if (!matOk) reasons.push(`no ${requiredRarity} material tool in inventory`);
        if (reasons.length > 0) {
          return { success: false, error: `Upgrade blocked — ${reasons.join("; ")}` };
        }
      } catch {
        /* fall through to generic error */
      }
      return { success: false, error: "Upgrade failed — insufficient resources or already maxed" };
    }

    // ── Milestone skins: unlock (+ auto-equip) at upgrade levels 10/15/20 ──
    let skinUnlocked: string | null = null;
    if (SKIN_MILESTONES.includes(newLevel)) {
      skinUnlocked = skinIdFor(tier, newLevel);
      await this.userModel
        .updateOne(
          { telegramId },
          {
            $addToSet: { unlockedPickaxeSkins: skinUnlocked },
            $set: { [`activePickaxeSkins.${tier}`]: skinUnlocked },
          },
        )
        .exec();
    }

    // ── Pending tier grants: this upgrade may satisfy an upgrade gate for a
    // tier whose user-level unlock was already reached (leveling ↔ upgrade).
    let pickaxeGrants: string[] = [];
    try {
      pickaxeGrants = await this.levelingService.grantPendingPickaxes(telegramId);
    } catch {
      pickaxeGrants = [];
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
      pickaxeGrants,
      skinUnlocked,
    };
  }

  /** Equip an unlocked skin for a tier (visual only, no stats). */
  async setActiveSkin(telegramId: string, tier: string, skin: string) {
    if (!PICKAXE_TIERS.includes(tier as PickaxeTier)) {
      return { success: false, error: "Invalid pickaxe tier" };
    }
    // "default" removes the equipped skin (back to base look).
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
    if (!SKIN_MILESTONES.includes(milestone)) {
      return { success: false, error: "Unknown skin" };
    }
    const updated = await this.userModel
      .findOneAndUpdate(
        { telegramId, unlockedPickaxeSkins: skin },
        { $set: { [`activePickaxeSkins.${tier}`]: skin } },
        { returnDocument: "after" },
      )
      .exec();
    if (!updated) {
      return { success: false, error: "Skin not unlocked yet" };
    }
    return { success: true, tier, skin };
  }
}
