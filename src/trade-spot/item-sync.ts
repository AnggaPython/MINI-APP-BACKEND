/**
 * item-sync.ts — Utilities to keep cryptoBalances, materials, and buffCollection
 * in sync for items traded on the trade spot.
 *
 * Three separate storage locations exist:
 *  1. cryptoBalances  — used by trade spot (keys are UPPERCASE slugs like "RUSTY-NAIL")
 *  2. materials       — used by material-tools page + pickaxe upgrade (keys like "Rusty Nail")
 *  3. buffCollection  — used by collections-buff page (instances in inventory array)
 *
 * This module provides the bidirectional mapping so we can sync across all three.
 */

// ── Material display names (title case, with spaces) — matches CASE_MATERIALS ──
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

/** All 75 material tool display names */
export const ALL_MATERIAL_NAMES: string[] = [
  ...COMMON_MATERIALS,
  ...MEDIUM_MATERIALS,
  ...RARE_MATERIALS,
];

// Build lookup maps
const NAME_TO_SLUG = new Map<string, string>();
const SLUG_TO_NAME = new Map<string, string>();

for (const name of ALL_MATERIAL_NAMES) {
  const slug = name.toUpperCase().replace(/ /g, "-");
  NAME_TO_SLUG.set(name, slug);
  SLUG_TO_NAME.set(slug, name);
}

/**
 * Convert a material display name to its trade-spot slug.
 * "Rusty Nail" → "RUSTY-NAIL"
 */
export function materialNameToSlug(name: string): string {
  return NAME_TO_SLUG.get(name) ?? name.toUpperCase().replace(/ /g, "-");
}

/**
 * Convert a trade-spot base slug to the material display name.
 * "RUSTY-NAIL" → "Rusty Nail"
 */
export function slugToMaterialName(slug: string): string {
  return SLUG_TO_NAME.get(slug.toUpperCase()) ?? slug;
}

/**
 * Check if a base token is a material tool (not a buff, not a mineral).
 * Use this instead of getBuffItem to determine if a pair base is a material.
 */
export function isMaterialBase(base: string): boolean {
  return SLUG_TO_NAME.has(base.toUpperCase());
}

/**
 * Check if a base token is a buff collection item.
 * This is the inverse: anything that's NOT a material, NOT a coin.
 */
export const COIN_BASES = new Set([
  "IRON", "COPPER", "SILVER", "GOLD",
  "ELIXCOIN", "ELIXIR", "USDC",
]);

export function isItemBase(base: string): boolean {
  return !COIN_BASES.has(base.toUpperCase());
}
