"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COIN_BASES = exports.ALL_MATERIAL_NAMES = void 0;
exports.materialNameToSlug = materialNameToSlug;
exports.slugToMaterialName = slugToMaterialName;
exports.isMaterialBase = isMaterialBase;
exports.isItemBase = isItemBase;
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
exports.ALL_MATERIAL_NAMES = [
    ...COMMON_MATERIALS,
    ...MEDIUM_MATERIALS,
    ...RARE_MATERIALS,
];
const NAME_TO_SLUG = new Map();
const SLUG_TO_NAME = new Map();
for (const name of exports.ALL_MATERIAL_NAMES) {
    const slug = name.toUpperCase().replace(/ /g, "-");
    NAME_TO_SLUG.set(name, slug);
    SLUG_TO_NAME.set(slug, name);
}
function materialNameToSlug(name) {
    return NAME_TO_SLUG.get(name) ?? name.toUpperCase().replace(/ /g, "-");
}
function slugToMaterialName(slug) {
    return SLUG_TO_NAME.get(slug.toUpperCase()) ?? slug;
}
function isMaterialBase(base) {
    return SLUG_TO_NAME.has(base.toUpperCase());
}
exports.COIN_BASES = new Set([
    "IRON", "COPPER", "SILVER", "GOLD", "DIAMOND",
    "ELIXCOIN", "ELIXIR", "USDC",
]);
function isItemBase(base) {
    return !exports.COIN_BASES.has(base.toUpperCase());
}
//# sourceMappingURL=item-sync.js.map