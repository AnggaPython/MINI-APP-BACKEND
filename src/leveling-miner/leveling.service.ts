import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";

type UserWithLevel = User & {
  exp?: number;
  vipExp?: number;
  gameExp?: number;
  level?: number;
  pendingStars?: number;
  lockedLevel?: number | null;
  materials?: Record<string, number>;
  profileXp?: number;
  profileLevel?: number;
};

// ── XP / Level constants ──────────────────────────────────────────────────
// 100,000 XP total from level 1 → level 100
// Linear formula: each level requires slightly more XP than the previous.
// Required XP for level L = 500 + L * 10
// Level 2: 520 XP, Level 50: 1000 XP, Level 99: 1490 XP
// Sum(2..100) = 99,990 XP ≈ 100,000
const TOTAL_XP = 100_000;
const MAX_LEVEL = 100;

// ── Hybrid Level Multiplier ────────────────────────────────────────────────
// Smooth progression: +1% per level
// Milestone bonus: +10% extra every 5 levels
// Applied to: stone/case HP bands, reward bands, resource bonuses
//
// Level 1:  1.00x
// Level 5:  1.14x  (1.04 + 0.10 milestone)
// Level 10: 1.29x  (1.09 + 0.20 milestone)
// Level 20: 1.59x  (1.19 + 0.40 milestone)
// Level 50: 2.49x  (1.49 + 1.00 milestone)
// Level 100: 3.99x (1.99 + 2.00 milestone)
// ──────────────────────────────────────────────────────────────────────────
export const getLevelMultiplier = (level: number): number => {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
  // Base: +1% per level (level 1 = 1.00, level 2 = 1.01, etc.)
  const baseMultiplier = 1 + (clamped - 1) * 0.01;
  // Milestone bonus: +10% per 5 levels (level 5 = +10%, level 10 = +20%, etc.)
  const milestoneBonus = Math.floor(clamped / 5) * 0.10;
  return Math.round((baseMultiplier + milestoneBonus) * 100) / 100;
};

// ── HP Multiplier (separate, more aggressive than reward multiplier) ─────
// Scales stone/case HP so high-level players with strong pickaxes still need
// a meaningful number of hits. Rewards keep using getLevelMultiplier.
//
// Formula: base +5% per level + milestone +25% per 5 levels.
//
// Level 1:   1.00x    Level 50:  5.95x    Level 100: 10.95x
// Level 10:  1.95x    Level 75:  8.45x
// Level 25:  3.45x
//
// At level 100 with Mythic (60) + ATK buff (30) = 90 per hit:
//   Common (55 avg × 11) = 605 HP → 7 hits (10.5s)
//   Medium (110 × 11)    = 1210 HP → 14 hits (21s)
//   Rare   (225 × 11)    = 2475 HP → 28 hits (42s)
// ──────────────────────────────────────────────────────────────────────────
export const getHpMultiplier = (level: number): number => {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
  // Base: +5% per level (level 1 = 1.00, level 2 = 1.05, etc.)
  const base = 1 + (clamped - 1) * 0.05;
  // Milestone bonus: +25% per 5 levels
  const milestone = Math.floor(clamped / 5) * 0.25;
  return Math.round((base + milestone) * 100) / 100;
};

export const xpRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 500 + level * 10;
};

// ── Milestone Material Requirements ────────────────────────────────────────
// Every 5 levels (5, 10, 15, ..., 100) requires materials to unlock.
// Non-milestone levels unlock automatically when XP is sufficient.
// Materials are collected from case-box loot.
export interface MilestoneRequirement {
  level: number;
  common: number;   // COMMON material tools needed
  medium: number;   // MEDIUM material tools needed
  rare: number;     // RARE material tools needed
}

// Flat requirements per milestone level bracket
const MILESTONE_BASE: MilestoneRequirement[] = [
  { level: 5,   common: 3,  medium: 0,  rare: 0 },
  { level: 10,  common: 5,  medium: 2,  rare: 0 },
  { level: 15,  common: 5,  medium: 3,  rare: 0 },
  { level: 20,  common: 5,  medium: 4,  rare: 1 },
  { level: 25,  common: 5,  medium: 5,  rare: 2 },
  { level: 30,  common: 5,  medium: 5,  rare: 3 },
  { level: 35,  common: 5,  medium: 6,  rare: 4 },
  { level: 40,  common: 5,  medium: 6,  rare: 5 },
  { level: 45,  common: 5,  medium: 7,  rare: 6 },
  { level: 50,  common: 5,  medium: 7,  rare: 8 },
  { level: 55,  common: 6,  medium: 8,  rare: 10 },
  { level: 60,  common: 6,  medium: 9,  rare: 12 },
  { level: 65,  common: 6,  medium: 10, rare: 14 },
  { level: 70,  common: 7,  medium: 11, rare: 16 },
  { level: 75,  common: 7,  medium: 12, rare: 18 },
  { level: 80,  common: 7,  medium: 13, rare: 20 },
  { level: 85,  common: 8,  medium: 14, rare: 22 },
  { level: 90,  common: 8,  medium: 15, rare: 24 },
  { level: 95,  common: 8,  medium: 16, rare: 26 },
  { level: 100, common: 10, medium: 20, rare: 30 },
];

/** Check if a level requires materials to unlock. */
export const isMilestoneLevel = (level: number): boolean => {
  return level % 5 === 0 && level >= 5;
};

/** Get material requirements for a milestone level. Returns null if not a milestone. */
export const getMilestoneRequirement = (level: number): MilestoneRequirement | null => {
  if (!isMilestoneLevel(level)) return null;
  const req = MILESTONE_BASE.find(m => m.level === level);
  return req || null;
};

/** Check if user has enough materials to craft a milestone level. */
export const hasEnoughMaterials = (
  userMaterials: Record<string, number>,
  requirement: MilestoneRequirement,
): { enough: boolean; missing: Record<string, number> } => {
  // Count total COMMON materials
  const COMMON_MATERIALS = [
    'Rusty Nail', 'Wooden Handle', 'Iron Shard', 'Copper Wire', 'Flint Stone',
    'Hemp Rope', 'Leather Strap', 'Clay Mold', 'Tin Plate', 'Bone Fragment',
    'Sandstone Grit', 'Charcoal Lump', 'Glass Shard', 'Rubber Grip', 'Brass Rivet',
    'Canvas Wrap', 'Iron Bolt', 'Slate Chip', 'Twine Coil', 'Wax Seal',
    'Stone Wheel', 'Bronze Pin', 'Ash Plank', 'Cloth Strip', 'Pig Iron Ingot',
  ];
  const MEDIUM_MATERIALS = [
    'Steel Alloy', 'Silver Filament', 'Copper Coil', 'Magnet Core', 'Quartz Crystal',
    'Reinforced Spring', 'Tempered Glass', 'Gold Plating', 'Titanium Screw', 'Carbon Fiber',
    'Enchanted Rune', 'Sapphire Lens', 'Power Cell', 'Hydraulic Pump', 'Servo Motor',
    'Platinum Wire', 'Crystal Gear', 'Obsidian Blade', 'Neon Capacitor', 'Phantom Core',
    'Emerald Driver', 'Chrono Spring', 'Plasma Coil', 'Arcane Alloy', 'Magnetic Array',
  ];
  const RARE_MATERIALS = [
    'Void Diamond', 'Phoenix Feather', 'Dragon Scale', 'Celestial Core', 'Quantum Shard',
    'Starforged Ingot', 'Infinity Crystal', 'Thunder Essence', 'Abyss Pearl', 'Solar Fragment',
    'Lunar Prism', 'Chaos Ember', 'Titan Heart', 'Etherium Wire', 'Rift Anchor',
    'Frost Nova Core', 'Pyroclasm Gem', 'Nebula Dust', 'Singularity Bolt', 'Godslayer Alloy',
    'Timeless Gear', 'Dimension Key', 'Eternity Matrix', 'Primordial Ore', 'Omega Circuit',
  ];

  let haveCommon = 0;
  let haveMedium = 0;
  let haveRare = 0;

  for (const [name, count] of Object.entries(userMaterials)) {
    if (COMMON_MATERIALS.includes(name)) haveCommon += count;
    else if (MEDIUM_MATERIALS.includes(name)) haveMedium += count;
    else if (RARE_MATERIALS.includes(name)) haveRare += count;
  }

  const missing: Record<string, number> = {};
  if (haveCommon < requirement.common) missing.COMMON = requirement.common - haveCommon;
  if (haveMedium < requirement.medium) missing.MEDIUM = requirement.medium - haveMedium;
  if (haveRare < requirement.rare) missing.RARE = requirement.rare - haveRare;

  return {
    enough: Object.keys(missing).length === 0,
    missing,
  };
};

// Cumulative XP to reach a given level from level 1 — precomputed O(1)
const CUMULATIVE_XP: number[] = (() => {
  const arr: number[] = [0, 0];
  let total = 0;
  for (let l = 2; l <= MAX_LEVEL; l++) {
    total += xpRequiredForLevel(l);
    arr[l] = total;
  }
  return arr;
})();
const cumulativeXpToLevel = (level: number): number => CUMULATIVE_XP[Math.max(1, Math.min(level, MAX_LEVEL))] || 0;

// ── Star XP per tier ──────────────────────────────────────────────────────
// Each stone/case awards 1-5 stars. Each star grants XP based on the tier.
export const STAR_XP_PER_TIER: Record<string, number> = {
  // Miner Stone
  Common: 100,
  Medium: 200,
  Rare: 500,
  // Case Box (uppercase)
  COMMON: 100,
  MEDIUM: 200,
  RARE: 500,
};

// ── Level Benefits ────────────────────────────────────────────────────────
export interface LevelBenefit {
  level: number;
  title: string;
  description: string;
  /** If set, this level grants a free pickaxe of this tier */
  pickaxeGrant?: string;
}

// ── Pickaxe Unlock Levels ──────────────────────────────────────────────────
// Progressive unlock: each tier unlocked at a meaningful milestone.
// Uncommon → Level 15 (~3-4 hrs), Rare → 25 (~8-10 hrs),
// Epic → 40 (~20-25 hrs), Legendary → 55 (~35-40 hrs), Mythic → 70 (~50-60 hrs)
// Common is free from the start.
const PICKAXE_UNLOCK_LEVELS: Record<string, number> = {
  Uncommon: 15,
  Rare: 25,
  Epic: 40,
  Legendary: 55,
  Mythic: 70,
};

export const LEVEL_BENEFITS: LevelBenefit[] = [
  { level: 1, title: "Welcome Miner!", description: "Start your mining journey" },
  { level: 5, title: "Apprentice Miner", description: "Unlock Medium stones more often" },
  { level: 10, title: "Journeyman Miner", description: "+10% resource bonus on all saves" },
  { level: 15, title: "Skilled Miner", description: "Unlock Rare case boxes + FREE Uncommon Pickaxe!", pickaxeGrant: "Uncommon" },
  { level: 20, title: "Expert Miner", description: "+20% resource bonus on all saves" },
  { level: 25, title: "Veteran Miner", description: "Unlock Epic stones + FREE Rare Pickaxe!", pickaxeGrant: "Rare" },
  { level: 30, title: "Master Miner", description: "+30% resource bonus on all saves" },
  { level: 35, title: "Elite Miner", description: "Double daily login bonus" },
  { level: 40, title: "Champion Miner", description: "Unlock Legendary stones + FREE Epic Pickaxe!", pickaxeGrant: "Epic" },
  { level: 45, title: "Hero Miner", description: "+40% resource bonus on all saves" },
  { level: 50, title: "Legendary Miner", description: "Permanent +5% drop rate bonus" },
  { level: 55, title: "Mythic Miner", description: "FREE Legendary Pickaxe! 🔥", pickaxeGrant: "Legendary" },
  { level: 60, title: "Titan Miner", description: "+50% resource bonus on all saves" },
  { level: 65, title: "Cosmic Miner", description: "Free repair once per day" },
  { level: 70, title: "Divine Miner", description: "FREE Mythic Pickaxe! ⚡ + Permanent +10% drop rate", pickaxeGrant: "Mythic" },
  { level: 75, title: "Immortal Miner", description: "+60% resource bonus on all saves" },
  { level: 80, title: "Celestial Miner", description: "Free repair twice per day" },
  { level: 85, title: "Transcendent Miner", description: "Permanent +15% drop rate bonus" },
  { level: 90, title: "Supreme Miner", description: "+75% resource bonus on all saves" },
  { level: 95, title: "Eternal Miner", description: "Permanent +20% drop rate bonus" },
  { level: 100, title: "Ascended Miner", description: "MAX LEVEL! All benefits unlocked 🏆" },
];

@Injectable()
export class LevelingService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /** Get the user's level and XP info from the database. */
  async getUserLevel(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const currentXp = (user as UserWithLevel).gameExp ?? (user as UserWithLevel).exp ?? 0;
    const level = (user as UserWithLevel).level || 1;
    const pendingStars = (user as UserWithLevel).pendingStars || 0;
    const lockedLevel = (user as UserWithLevel).lockedLevel || null;
    const materials: Record<string, number> = (user as UserWithLevel).materials || {};

    // Calculate XP progress within current level
    const xpForCurrentLevel = cumulativeXpToLevel(level);
    void (level >= MAX_LEVEL ? xpForCurrentLevel : cumulativeXpToLevel(level + 1));
    const xpInLevel = currentXp - xpForCurrentLevel;
    const xpNeeded = level >= MAX_LEVEL ? 0 : xpRequiredForLevel(level + 1);
    const progress = level >= MAX_LEVEL ? 1 : (xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1);

    // Find current benefit
    const currentBenefit = [...LEVEL_BENEFITS].reverse().find(b => level >= b.level);

    // Level multiplier — applied to HP bands and reward scaling
    const multiplier = getLevelMultiplier(level);
    const nextMultiplier = level < MAX_LEVEL ? getLevelMultiplier(level + 1) : multiplier;

    // Get milestone requirement for locked level
    const milestoneRequirement = lockedLevel ? getMilestoneRequirement(lockedLevel) : null;
    const materialCheck = milestoneRequirement ? hasEnoughMaterials(materials, milestoneRequirement) : null;

    // Count materials by rarity
    const COMMON_MATERIALS = [
      'Rusty Nail', 'Wooden Handle', 'Iron Shard', 'Copper Wire', 'Flint Stone',
      'Hemp Rope', 'Leather Strap', 'Clay Mold', 'Tin Plate', 'Bone Fragment',
      'Sandstone Grit', 'Charcoal Lump', 'Glass Shard', 'Rubber Grip', 'Brass Rivet',
      'Canvas Wrap', 'Iron Bolt', 'Slate Chip', 'Twine Coil', 'Wax Seal',
      'Stone Wheel', 'Bronze Pin', 'Ash Plank', 'Cloth Strip', 'Pig Iron Ingot',
    ];
    const MEDIUM_MATERIALS = [
      'Steel Alloy', 'Silver Filament', 'Copper Coil', 'Magnet Core', 'Quartz Crystal',
      'Reinforced Spring', 'Tempered Glass', 'Gold Plating', 'Titanium Screw', 'Carbon Fiber',
      'Enchanted Rune', 'Sapphire Lens', 'Power Cell', 'Hydraulic Pump', 'Servo Motor',
      'Platinum Wire', 'Crystal Gear', 'Obsidian Blade', 'Neon Capacitor', 'Phantom Core',
      'Emerald Driver', 'Chrono Spring', 'Plasma Coil', 'Arcane Alloy', 'Magnetic Array',
    ];
    const RARE_MATERIALS = [
      'Void Diamond', 'Phoenix Feather', 'Dragon Scale', 'Celestial Core', 'Quantum Shard',
      'Starforged Ingot', 'Infinity Crystal', 'Thunder Essence', 'Abyss Pearl', 'Solar Fragment',
      'Lunar Prism', 'Chaos Ember', 'Titan Heart', 'Etherium Wire', 'Rift Anchor',
      'Frost Nova Core', 'Pyroclasm Gem', 'Nebula Dust', 'Singularity Bolt', 'Godslayer Alloy',
      'Timeless Gear', 'Dimension Key', 'Eternity Matrix', 'Primordial Ore', 'Omega Circuit',
    ];

    let totalCommon = 0;
    let totalMedium = 0;
    let totalRare = 0;
    for (const [name, count] of Object.entries(materials)) {
      if (COMMON_MATERIALS.includes(name)) totalCommon += count;
      else if (MEDIUM_MATERIALS.includes(name)) totalMedium += count;
      else if (RARE_MATERIALS.includes(name)) totalRare += count;
    }

    return {
      success: true,
      level,
      exp: currentXp,
      xpForNextLevel: xpNeeded,
      xpInLevel: Math.max(0, xpInLevel),
      progress,
      maxLevel: MAX_LEVEL,
      totalXp: TOTAL_XP,
      currentBenefit: currentBenefit || LEVEL_BENEFITS[0],
      multiplier,
      nextMultiplier,
      pendingStars,
      lockedLevel,
      milestoneRequirement,
      materialCheck,
      materialCounts: { common: totalCommon, medium: totalMedium, rare: totalRare },
    };
  }

  /** Get the list of all level benefits for the detail page. */
  async getLevelBenefits() {
    return {
      success: true,
      benefits: LEVEL_BENEFITS,
      maxLevel: MAX_LEVEL,
      totalXp: TOTAL_XP,
    };
  }

  /**
   * Grant free pickaxes when user reaches unlock levels.
   * Checks all levels between oldLevel+1 and newLevel for pickaxe grants.
   * Returns list of granted pickaxe tiers (empty if none).
   */
  private async grantPickaxesOnLevelUp(
    telegramId: string,
    oldLevel: number,
    newLevel: number,
  ): Promise<string[]> {
    const granted: string[] = [];

    for (const [pickaxe, unlockLevel] of Object.entries(PICKAXE_UNLOCK_LEVELS)) {
      // Grant if the user crossed this unlock level
      if (newLevel >= unlockLevel && oldLevel < unlockLevel) {
        // Atomic: only add if not already owned
        const updated = await this.userModel
          .findOneAndUpdate(
            {
              telegramId,
              ownedPickaxes: { $nin: [pickaxe] },
            },
            {
              $addToSet: { ownedPickaxes: { $each: ["Common", pickaxe] } },
            },
            { returnDocument: "after" },
          )
          .exec();

        if (updated) {
          granted.push(pickaxe);
        }
      }
    }

    return granted;
  }

  /** Award XP when a stone is destroyed. Returns starCount + level info. */
  async awardStoneXp(telegramId: string, tier: string): Promise<{
    starCount: number;
    xpAwarded: number;
    level: number;
    levelUp: boolean;
    newLevel: number;
    pickaxeGrants: string[];
    pendingStars: number;
    lockedLevel: number | null;
  }> {
    // Roll 1-5 stars
    const starCount = Math.floor(Math.random() * 5) + 1;
    const xpPerStar = STAR_XP_PER_TIER[tier] || 100;
    const xpAwarded = starCount * xpPerStar;

    // Get current level
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    const oldLevel = (user as UserWithLevel)?.level || 1;
    const oldXp = (user as UserWithLevel)?.gameExp ?? (user as UserWithLevel)?.exp ?? 0;
    const newXp = oldXp + xpAwarded;

    // Calculate new level from total XP
    let newLevel = 1;
    let xpRemaining = newXp;
    for (let l = 2; l <= MAX_LEVEL; l++) {
      const needed = xpRequiredForLevel(l);
      if (xpRemaining >= needed) {
        xpRemaining -= needed;
        newLevel = l;
      } else {
        break;
      }
    }
    // Cap at MAX_LEVEL
    if (newLevel >= MAX_LEVEL) newLevel = MAX_LEVEL;

    const levelUp = newLevel > oldLevel;

    // Check for milestone levels that need material craft
    let finalLevel = newLevel;
    let pendingStars = 0;
    let lockedLevel: number | null = null;

    if (levelUp) {
      // Check all milestone levels between oldLevel and newLevel
      for (let l = oldLevel + 1; l <= newLevel; l++) {
        if (isMilestoneLevel(l)) {
          // This milestone requires materials - lock at this level
          finalLevel = l - 1; // Stay at level before milestone
          lockedLevel = l;
          pendingStars = starCount; // Hold stars until craft
          break;
        }
      }
    }

    // Update user XP, level, and pending stars — dual-write for migration
    const updateFields: Record<string, unknown> = { exp: newXp, gameExp: newXp };
    if (finalLevel !== oldLevel || !lockedLevel) {
      updateFields.level = finalLevel;
    }
    if (lockedLevel) {
      updateFields.lockedLevel = lockedLevel;
      updateFields.pendingStars = starCount; // Stars held
    }

    // Profile XP: +1 only for Medium and Rare tiers (not Common/Zonk)
    const awardProfileXp = tier === "Medium" || tier === "Rare";
    if (awardProfileXp) {
      const oldProfileXp = ((user as UserWithLevel)?.profileXp || 0) + 1;
      let newProfileLevel = 1;
      let profXpRemaining = oldProfileXp;
      for (let l = 2; l <= MAX_LEVEL; l++) {
        const needed = xpRequiredForLevel(l);
        if (profXpRemaining >= needed) {
          profXpRemaining -= needed;
          newProfileLevel = l;
        } else break;
      }
      if (newProfileLevel > ((user as UserWithLevel)?.profileLevel || 1)) {
        updateFields.profileLevel = newProfileLevel;
      }
    }

    await this.userModel
      .findOneAndUpdate(
        { telegramId },
        awardProfileXp
          ? { $set: updateFields, $inc: { profileXp: 1 } }
          : { $set: updateFields },
      )
      .exec();

    // Grant free pickaxes if user crossed unlock levels
    let pickaxeGrants: string[] = [];
    if (finalLevel > oldLevel) {
      try {
        pickaxeGrants = await this.grantPickaxesOnLevelUp(telegramId, oldLevel, finalLevel);
      } catch { /* pickaxe grant failed — non-critical */ }
    }

    return { starCount, xpAwarded, level: oldLevel, levelUp: finalLevel > oldLevel, newLevel: finalLevel, pickaxeGrants, pendingStars, lockedLevel };
  }

  /** Award XP when a case box is destroyed. Same logic as stone.
   *  Profile XP only awarded for Medium and Rare tiers. */
  async awardCaseXp(telegramId: string, tier: string): Promise<{
    starCount: number;
    xpAwarded: number;
    level: number;
    levelUp: boolean;
    newLevel: number;
    pickaxeGrants: string[];
    pendingStars: number;
    lockedLevel: number | null;
  }> {
    // awardStoneXp already checks tier for profile XP (Medium/Rare only)
    return this.awardStoneXp(telegramId, tier);
  }

  /**
   * Craft/Unlock a milestone level using materials.
   * Deducts materials from user inventory and unlocks the level.
   */
  async craftLevel(telegramId: string): Promise<{
    success: boolean;
    error?: string;
    newLevel?: number;
    materialsUsed?: Record<string, number>;
  }> {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const lockedLevel = (user as UserWithLevel).lockedLevel as number | null;
    if (!lockedLevel) {
      return { success: false, error: "No level is locked. Keep mining!" };
    }

    const requirement = getMilestoneRequirement(lockedLevel);
    if (!requirement) {
      return { success: false, error: "Invalid milestone level" };
    }

    const materials: Record<string, number> = (user as UserWithLevel).materials || {};
    const check = hasEnoughMaterials(materials, requirement);

    if (!check.enough) {
      return { success: false, error: "Not enough materials. Keep mining case boxes!" };
    }

    // Deduct materials and unlock level
    void ((user as UserWithLevel).pendingStars || 0);
    const newLevel = lockedLevel;

    // Build update object
    const update: Record<string, unknown> = {
      $set: {
        level: newLevel,
        lockedLevel: null,
        pendingStars: 0,
      },
    };

    // Deduct materials using $inc
    const materialDecrement: Record<string, number> = {};
    const COMMON_MATERIALS = [
      'Rusty Nail', 'Wooden Handle', 'Iron Shard', 'Copper Wire', 'Flint Stone',
      'Hemp Rope', 'Leather Strap', 'Clay Mold', 'Tin Plate', 'Bone Fragment',
      'Sandstone Grit', 'Charcoal Lump', 'Glass Shard', 'Rubber Grip', 'Brass Rivet',
      'Canvas Wrap', 'Iron Bolt', 'Slate Chip', 'Twine Coil', 'Wax Seal',
      'Stone Wheel', 'Bronze Pin', 'Ash Plank', 'Cloth Strip', 'Pig Iron Ingot',
    ];
    const MEDIUM_MATERIALS = [
      'Steel Alloy', 'Silver Filament', 'Copper Coil', 'Magnet Core', 'Quartz Crystal',
      'Reinforced Spring', 'Tempered Glass', 'Gold Plating', 'Titanium Screw', 'Carbon Fiber',
      'Enchanted Rune', 'Sapphire Lens', 'Power Cell', 'Hydraulic Pump', 'Servo Motor',
      'Platinum Wire', 'Crystal Gear', 'Obsidian Blade', 'Neon Capacitor', 'Phantom Core',
      'Emerald Driver', 'Chrono Spring', 'Plasma Coil', 'Arcane Alloy', 'Magnetic Array',
    ];
    const RARE_MATERIALS = [
      'Void Diamond', 'Phoenix Feather', 'Dragon Scale', 'Celestial Core', 'Quantum Shard',
      'Starforged Ingot', 'Infinity Crystal', 'Thunder Essence', 'Abyss Pearl', 'Solar Fragment',
      'Lunar Prism', 'Chaos Ember', 'Titan Heart', 'Etherium Wire', 'Rift Anchor',
      'Frost Nova Core', 'Pyroclasm Gem', 'Nebula Dust', 'Singularity Bolt', 'Godslayer Alloy',
      'Timeless Gear', 'Dimension Key', 'Eternity Matrix', 'Primordial Ore', 'Omega Circuit',
    ];

    // Deduct COMMON materials
    let commonNeeded = requirement.common;
    for (const [name, count] of Object.entries(materials)) {
      if (commonNeeded <= 0) break;
      if (COMMON_MATERIALS.includes(name) && count > 0) {
        const deduct = Math.min(count, commonNeeded);
        materialDecrement[`materials.${name}`] = -deduct;
        commonNeeded -= deduct;
      }
    }

    // Deduct MEDIUM materials
    let mediumNeeded = requirement.medium;
    for (const [name, count] of Object.entries(materials)) {
      if (mediumNeeded <= 0) break;
      if (MEDIUM_MATERIALS.includes(name) && count > 0) {
        const deduct = Math.min(count, mediumNeeded);
        materialDecrement[`materials.${name}`] = -deduct;
        mediumNeeded -= deduct;
      }
    }

    // Deduct RARE materials
    let rareNeeded = requirement.rare;
    for (const [name, count] of Object.entries(materials)) {
      if (rareNeeded <= 0) break;
      if (RARE_MATERIALS.includes(name) && count > 0) {
        const deduct = Math.min(count, rareNeeded);
        materialDecrement[`materials.${name}`] = -deduct;
        rareNeeded -= deduct;
      }
    }

    // Apply update
    await this.userModel
      .findOneAndUpdate(
        { telegramId },
        { ...update, $inc: materialDecrement },
      )
      .exec();

    // Grant free pickaxes if applicable
    let pickaxeGrants: string[] = [];
    try {
      pickaxeGrants = await this.grantPickaxesOnLevelUp(telegramId, newLevel - 1, newLevel);
    } catch { /* pickaxe grant failed — non-critical */ }

    void pickaxeGrants;
    return {
      success: true,
      newLevel,
      materialsUsed: materialDecrement,
    };
  }
}
