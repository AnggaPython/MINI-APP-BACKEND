"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MAX_UPGRADE_LEVEL = 20;
const PICKAXE_TIERS = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
const PICKAXE_BASE_STATS = {
    Common: { power: 2.0, maxDurability: 25 },
    Uncommon: { power: 5.0, maxDurability: 50 },
    Rare: { power: 10.0, maxDurability: 75 },
    Epic: { power: 15.0, maxDurability: 100 },
    Legendary: { power: 30.0, maxDurability: 200 },
    Mythic: { power: 60.0, maxDurability: 400 },
};
const PICKAXE_UPGRADE_PER_LEVEL = {
    Common: { powerPerLevel: 0.15, durabilityPerLevel: 1.5 },
    Uncommon: { powerPerLevel: 0.25, durabilityPerLevel: 2.5 },
    Rare: { powerPerLevel: 0.4, durabilityPerLevel: 4 },
    Epic: { powerPerLevel: 0.6, durabilityPerLevel: 6 },
    Legendary: { powerPerLevel: 1.0, durabilityPerLevel: 10 },
    Mythic: { powerPerLevel: 1.5, durabilityPerLevel: 15 },
};
const PICKAXE_UPGRADE_COST = {
    Common: { IRON: 500, COPPER: 200, materialRarity: "COMMON" },
    Uncommon: { COPPER: 500, SILVER: 300, materialRarity: "COMMON" },
    Rare: { SILVER: 400, GOLD: 50, materialRarity: "MEDIUM" },
    Epic: { GOLD: 200, DIAMOND: 10, materialRarity: "MEDIUM" },
    Legendary: { GOLD: 500, DIAMOND: 30, materialRarity: "RARE" },
    Mythic: { GOLD: 1000, DIAMOND: 100, materialRarity: "RARE" },
};
function getUpgradeStats(tier, upgradeLevel) {
    const base = PICKAXE_BASE_STATS[tier];
    const perLevel = PICKAXE_UPGRADE_PER_LEVEL[tier];
    const level = Math.max(0, Math.min(upgradeLevel, MAX_UPGRADE_LEVEL));
    return {
        power: Math.round((base.power + perLevel.powerPerLevel * level) * 100) / 100,
        maxDurability: base.maxDurability + Math.round(perLevel.durabilityPerLevel * level),
    };
}
function getTotalCostPerResource(tier, levels) {
    const costPerLevel = PICKAXE_UPGRADE_COST[tier];
    const total = {};
    for (const [resource, amount] of Object.entries(costPerLevel)) {
        if (resource === "materialRarity")
            continue;
        total[resource] = (amount || 0) * levels;
    }
    return total;
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
function getMaterialRarity(name) {
    if (COMMON_MATERIALS.includes(name))
        return "COMMON";
    if (MEDIUM_MATERIALS.includes(name))
        return "MEDIUM";
    if (RARE_MATERIALS.includes(name))
        return "RARE";
    return null;
}
function isMaterialRaritySufficient(have, need) {
    const order = ["COMMON", "MEDIUM", "RARE"];
    return order.indexOf(have) >= order.indexOf(need);
}
let totalTests = 0;
let passed = 0;
let failed = 0;
const failures = [];
function assert(condition, message) {
    totalTests++;
    if (condition) {
        passed++;
    }
    else {
        failed++;
        failures.push(`  ❌ FAIL: ${message}`);
        console.log(`  ❌ FAIL: ${message}`);
    }
}
function assertEqual(actual, expected, message) {
    totalTests++;
    if (actual === expected) {
        passed++;
    }
    else {
        failed++;
        const msg = `${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
        failures.push(`  ❌ FAIL: ${msg}`);
        console.log(`  ❌ FAIL: ${msg}`);
    }
}
function assertApprox(actual, expected, tolerance, message) {
    totalTests++;
    if (Math.abs(actual - expected) <= tolerance) {
        passed++;
    }
    else {
        failed++;
        const msg = `${message} — expected ~${expected} (±${tolerance}), got ${actual}`;
        failures.push(`  ❌ FAIL: ${msg}`);
        console.log(`  ❌ FAIL: ${msg}`);
    }
}
function section(title) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'─'.repeat(60)}`);
}
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   PICKAXE UPGRADE SIMULATION — All Tiers × 20 Levels       ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
section('TEST 1: Upgrade Stats Calculation');
for (const tier of PICKAXE_TIERS) {
    const base = PICKAXE_BASE_STATS[tier];
    const perLevel = PICKAXE_UPGRADE_PER_LEVEL[tier];
    const stats0 = getUpgradeStats(tier, 0);
    assertApprox(stats0.power, base.power, 0.01, `${tier} Level 0 ATK = ${base.power}`);
    assertEqual(stats0.maxDurability, base.maxDurability, `${tier} Level 0 DUR = ${base.maxDurability}`);
    const stats20 = getUpgradeStats(tier, 20);
    const expectedMaxAtk = Math.round((base.power + perLevel.powerPerLevel * 20) * 100) / 100;
    const expectedMaxDur = base.maxDurability + Math.round(perLevel.durabilityPerLevel * 20);
    assertApprox(stats20.power, expectedMaxAtk, 0.01, `${tier} Level 20 ATK = ${expectedMaxAtk}`);
    assertEqual(stats20.maxDurability, expectedMaxDur, `${tier} Level 20 DUR = ${expectedMaxDur}`);
    for (let l = 1; l <= 20; l++) {
        const prev = getUpgradeStats(tier, l - 1);
        const curr = getUpgradeStats(tier, l);
        assert(curr.power > prev.power, `${tier} Level ${l} ATK > Level ${l - 1}`);
        assert(curr.maxDurability > prev.maxDurability, `${tier} Level ${l} DUR > Level ${l - 1}`);
    }
}
console.log('\n  Tier        | Base ATK | Max ATK | Base DUR | Max DUR');
console.log('  ' + '─'.repeat(55));
for (const tier of PICKAXE_TIERS) {
    const base = PICKAXE_BASE_STATS[tier];
    const max = getUpgradeStats(tier, 20);
    console.log(`  ${tier.padEnd(12)} | ${String(base.power.toFixed(2)).padStart(8)} | ${String(max.power.toFixed(2)).padStart(7)} | ${String(base.maxDurability).padStart(8)} | ${String(max.maxDurability).padStart(7)}`);
}
section('TEST 2: Resource Cost Calculation');
for (const tier of PICKAXE_TIERS) {
    const costPerLevel = PICKAXE_UPGRADE_COST[tier];
    for (const [resource, amount] of Object.entries(costPerLevel)) {
        if (resource === "materialRarity")
            continue;
        assert((amount || 0) > 0, `${tier} ${resource} cost per level > 0`);
    }
    const totalCost = getTotalCostPerResource(tier, 20);
    for (const [resource, amount] of Object.entries(totalCost)) {
        const perLevel = costPerLevel[resource] || 0;
        assertEqual(amount, Number(perLevel) * 20, `${tier} Total ${resource} = 20 × ${perLevel}`);
    }
}
console.log('\n  Tier        | IRON  | COPPER | SILVER | GOLD  | DIAMOND | Material');
console.log('  ' + '─'.repeat(70));
for (const tier of PICKAXE_TIERS) {
    const cost = PICKAXE_UPGRADE_COST[tier];
    const total = getTotalCostPerResource(tier, 20);
    console.log(`  ${tier.padEnd(12)} | ${String(total.IRON || 0).padStart(5)} | ${String(total.COPPER || 0).padStart(6)} | ${String(total.SILVER || 0).padStart(6)} | ${String(total.GOLD || 0).padStart(5)} | ${String(total.DIAMOND || 0).padStart(7)} | ${cost.materialRarity}`);
}
section('TEST 3: Material Tool Requirements');
const expectedRarities = {
    Common: "COMMON",
    Uncommon: "COMMON",
    Rare: "MEDIUM",
    Epic: "MEDIUM",
    Legendary: "RARE",
    Mythic: "RARE",
};
for (const tier of PICKAXE_TIERS) {
    const cost = PICKAXE_UPGRADE_COST[tier];
    assertEqual(cost.materialRarity, expectedRarities[tier], `${tier} requires ${expectedRarities[tier]} material`);
}
console.log('\n  Material Rarity Matching:');
console.log('  COMMON pickaxe → accepts COMMON, MEDIUM, RARE materials');
console.log('  MEDIUM pickaxe → accepts MEDIUM, RARE materials');
console.log('  RARE pickaxe   → accepts RARE materials only');
assert(isMaterialRaritySufficient("COMMON", "COMMON"), "COMMON material works for COMMON upgrade");
assert(isMaterialRaritySufficient("MEDIUM", "COMMON"), "MEDIUM material works for COMMON upgrade");
assert(isMaterialRaritySufficient("RARE", "COMMON"), "RARE material works for COMMON upgrade");
assert(isMaterialRaritySufficient("MEDIUM", "MEDIUM"), "MEDIUM material works for MEDIUM upgrade");
assert(isMaterialRaritySufficient("RARE", "MEDIUM"), "RARE material works for MEDIUM upgrade");
assert(!isMaterialRaritySufficient("COMMON", "MEDIUM"), "COMMON material does NOT work for MEDIUM upgrade");
assert(isMaterialRaritySufficient("RARE", "RARE"), "RARE material works for RARE upgrade");
assert(!isMaterialRaritySufficient("COMMON", "RARE"), "COMMON material does NOT work for RARE upgrade");
assert(!isMaterialRaritySufficient("MEDIUM", "RARE"), "MEDIUM material does NOT work for RARE upgrade");
section('TEST 4: Balance Check');
console.log('\n  Max Upgraded Tier → Next Base Tier Comparison:');
console.log('  ' + '─'.repeat(60));
for (let i = 0; i < PICKAXE_TIERS.length - 1; i++) {
    const currentTier = PICKAXE_TIERS[i];
    const nextTier = PICKAXE_TIERS[i + 1];
    const maxStats = getUpgradeStats(currentTier, 20);
    const nextBase = PICKAXE_BASE_STATS[nextTier];
    const atkRatio = maxStats.power / nextBase.power;
    const durRatio = maxStats.maxDurability / nextBase.maxDurability;
    console.log(`  Max ${currentTier.padEnd(10)} → Base ${nextTier.padEnd(10)}: ATK ${maxStats.power.toFixed(2)} vs ${nextBase.power.toFixed(2)} (${(atkRatio * 100).toFixed(0)}%) | DUR ${maxStats.maxDurability} vs ${nextBase.maxDurability} (${(durRatio * 100).toFixed(0)}%)`);
    assert(atkRatio <= 1.25, `Max ${currentTier} ATK ≤ 125% of Base ${nextTier}`);
    assert(atkRatio >= 0.8, `Max ${currentTier} ATK ≥ 80% of Base ${nextTier}`);
    assert(durRatio <= 1.6, `Max ${currentTier} DUR ≤ 160% of Base ${nextTier}`);
    assert(durRatio >= 0.8, `Max ${currentTier} DUR ≥ 80% of Base ${nextTier}`);
}
section('TEST 5: Full Upgrade Simulation');
console.log('\n  Simulating full upgrade for each tier (0→20 levels):');
console.log('  ' + '─'.repeat(70));
let totalIronUsed = 0;
let totalCopperUsed = 0;
let totalSilverUsed = 0;
let totalGoldUsed = 0;
let totalDiamondUsed = 0;
let totalMaterialsUsed = 0;
for (const tier of PICKAXE_TIERS) {
    let ironUsed = 0;
    let copperUsed = 0;
    let silverUsed = 0;
    let goldUsed = 0;
    let diamondUsed = 0;
    let materialsUsed = 0;
    for (let level = 0; level < 20; level++) {
        const cost = PICKAXE_UPGRADE_COST[tier];
        ironUsed += cost.IRON || 0;
        copperUsed += cost.COPPER || 0;
        silverUsed += cost.SILVER || 0;
        goldUsed += cost.GOLD || 0;
        diamondUsed += cost.DIAMOND || 0;
        materialsUsed += 1;
    }
    const finalStats = getUpgradeStats(tier, 20);
    console.log(`  ${tier.padEnd(10)} | ATK ${finalStats.power.toFixed(2)} | DUR ${finalStats.maxDurability} | IRON ${ironUsed} | COPPER ${copperUsed} | SILVER ${silverUsed} | GOLD ${goldUsed} | DIAMOND ${diamondUsed} | Materials ${materialsUsed}`);
    assert(finalStats.power > PICKAXE_BASE_STATS[tier].power, `${tier} final ATK > base`);
    assert(finalStats.maxDurability > PICKAXE_BASE_STATS[tier].maxDurability, `${tier} final DUR > base`);
    assert(ironUsed + copperUsed + silverUsed + goldUsed + diamondUsed > 0, `${tier} has positive resource cost`);
    assertEqual(materialsUsed, 20, `${tier} uses 20 materials for 20 upgrades`);
    totalIronUsed += ironUsed;
    totalCopperUsed += copperUsed;
    totalSilverUsed += silverUsed;
    totalGoldUsed += goldUsed;
    totalDiamondUsed += diamondUsed;
    totalMaterialsUsed += materialsUsed;
}
console.log(`\n  TOTAL RESOURCES FOR ALL TIERS (0→20 each):`);
console.log(`  IRON: ${totalIronUsed} | COPPER: ${totalCopperUsed} | SILVER: ${totalSilverUsed} | GOLD: ${totalGoldUsed} | DIAMOND: ${totalDiamondUsed}`);
console.log(`  MATERIALS: ${totalMaterialsUsed} total (6 tiers × 20 levels)`);
section('TEST 6: Edge Cases');
for (const tier of PICKAXE_TIERS) {
    const stats20 = getUpgradeStats(tier, 20);
    const stats25 = getUpgradeStats(tier, 25);
    assertEqual(stats20.power, stats25.power, `${tier} Level 20 = Level 25 (capped)`);
    assertEqual(stats20.maxDurability, stats25.maxDurability, `${tier} Level 20 DUR = Level 25 DUR (capped)`);
}
for (const tier of PICKAXE_TIERS) {
    const stats0 = getUpgradeStats(tier, 0);
    assertEqual(stats0.power, PICKAXE_BASE_STATS[tier].power, `${tier} Level 0 = base power`);
    assertEqual(stats0.maxDurability, PICKAXE_BASE_STATS[tier].maxDurability, `${tier} Level 0 = base durability`);
}
for (const tier of PICKAXE_TIERS) {
    const statsNeg = getUpgradeStats(tier, -5);
    assertEqual(statsNeg.power, PICKAXE_BASE_STATS[tier].power, `${tier} Negative level = base power`);
    assertEqual(statsNeg.maxDurability, PICKAXE_BASE_STATS[tier].maxDurability, `${tier} Negative level = base durability`);
}
console.log('\n' + '═'.repeat(60));
console.log(`  TOTAL: ${totalTests} tests`);
console.log(`  PASSED: ${passed} ✅`);
console.log(`  FAILED: ${failed} ❌`);
console.log('═'.repeat(60));
if (failures.length > 0) {
    console.log('\n  FAILURES:');
    failures.forEach(f => console.log(f));
    console.log('');
    process.exit(1);
}
else {
    console.log('\n  🎉 ALL TESTS PASSED! Pickaxe upgrade system is balanced.\n');
    process.exit(0);
}
//# sourceMappingURL=pickaxe-upgrade-simulation.js.map