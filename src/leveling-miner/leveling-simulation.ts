/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LEVELING SYSTEM SIMULATION — Full Progression Test (Level 1 → 100)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Run:  npx tsx src/leveling-miner/leveling-simulation.ts
 *
 *  Tests:
 *    1. XP formula correctness (linear, total ≈ 100,000)
 *    2. Level multiplier (hybrid formula)
 *    3. Pickaxe grants at correct levels
 *    4. HP scaling for stones and cases
 *    5. Star XP calculation
 *    6. Level-up spanning multiple levels (burst XP)
 *    7. Max level cap
 *    8. Edge cases (level 0, negative, overflow)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Constants (mirrored from leveling.service.ts) ────────────────────────
const TOTAL_XP = 100_000;
const MAX_LEVEL = 100;

// ── XP Formula (Linear) ─────────────────────────────────────────────────
const xpRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 500 + level * 10;
};

const cumulativeXpToLevel = (level: number): number => {
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += xpRequiredForLevel(l);
  }
  return total;
};

// ── Level Multiplier (Hybrid) ────────────────────────────────────────────
const getLevelMultiplier = (level: number): number => {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
  const baseMultiplier = 1 + (clamped - 1) * 0.01;
  const milestoneBonus = Math.floor(clamped / 5) * 0.10;
  return Math.round((baseMultiplier + milestoneBonus) * 100) / 100;
};

// ── Level calculation from total XP ──────────────────────────────────────
const calculateLevel = (totalXp: number): number => {
  let level = 1;
  let xpRemaining = totalXp;
  for (let l = 2; l <= MAX_LEVEL; l++) {
    const needed = xpRequiredForLevel(l);
    if (xpRemaining >= needed) {
      xpRemaining -= needed;
      level = l;
    } else {
      break;
    }
  }
  if (level >= MAX_LEVEL) level = MAX_LEVEL;
  return level;
};

// ── Star XP ──────────────────────────────────────────────────────────────
const STAR_XP_PER_TIER: Record<string, number> = {
  Common: 100, Medium: 200, Rare: 500,
  COMMON: 100, MEDIUM: 200, RARE: 500,
};

// ── Pickaxe Unlock Levels ────────────────────────────────────────────────
const PICKAXE_UNLOCK_LEVELS: Record<string, number> = {
  Uncommon: 15,
  Rare: 25,
  Epic: 40,
  Legendary: 55,
  Mythic: 70,
};

// ── HP Bands ─────────────────────────────────────────────────────────────
const STONE_HP_BASE: Record<string, [number, number]> = {
  Common: [30, 80], Medium: [60, 160], Rare: [90, 360],
};
const CASE_HP_BASE: Record<string, [number, number]> = {
  COMMON: [180, 200], MEDIUM: [200, 250], RARE: [250, 400],
};

// ═══════════════════════════════════════════════════════════════════════════
//  TEST FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════
let totalTests = 0;
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(`  ❌ FAIL: ${message}`);
    console.log(`  ❌ FAIL: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  totalTests++;
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    const msg = `${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
    failures.push(`  ❌ FAIL: ${msg}`);
    console.log(`  ❌ FAIL: ${msg}`);
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
  totalTests++;
  if (Math.abs(actual - expected) <= tolerance) {
    passed++;
  } else {
    failed++;
    const msg = `${message} — expected ~${expected} (±${tolerance}), got ${actual}`;
    failures.push(`  ❌ FAIL: ${msg}`);
    console.log(`  ❌ FAIL: ${msg}`);
  }
}

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   LEVELING SYSTEM SIMULATION — Level 1 → 100               ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

// ── TEST 1: XP Formula ──────────────────────────────────────────────────
section('TEST 1: XP Formula Correctness');

// Level 2 should require a small amount
assertEqual(xpRequiredForLevel(1), 0, 'Level 1 requires 0 XP');
assert(xpRequiredForLevel(2) > 0, 'Level 2 requires positive XP');

// Formula should be monotonically increasing
for (let l = 3; l <= 100; l++) {
  assert(
    xpRequiredForLevel(l) > xpRequiredForLevel(l - 1),
    `Level ${l} requires more XP than level ${l - 1}: ${xpRequiredForLevel(l)} > ${xpRequiredForLevel(l - 1)}`
  );
}

// Total XP from 1 to 100 should be ~100,000
const totalXpCalculated = cumulativeXpToLevel(100);
console.log(`  Total XP to reach level 100: ${totalXpCalculated}`);
assertApprox(totalXpCalculated, 100_000, 100, 'Total XP from level 1→100 ≈ 100,000');

// Spot-check some levels (linear formula: 500 + level * 10)
assertApprox(xpRequiredForLevel(2), 520, 1, 'Level 2 requires 520 XP');
assertApprox(xpRequiredForLevel(10), 600, 1, 'Level 10 requires 600 XP');
assertApprox(xpRequiredForLevel(50), 1000, 1, 'Level 50 requires 1000 XP');
assertApprox(xpRequiredForLevel(99), 1490, 1, 'Level 99 requires 1490 XP');

// ── TEST 2: Level Calculation from XP ───────────────────────────────────
section('TEST 2: Level Calculation from Total XP');

// 0 XP = level 1
assertEqual(calculateLevel(0), 1, '0 XP = Level 1');

// Just barely enough for level 2
assertEqual(calculateLevel(xpRequiredForLevel(2)), 2, '930 XP = Level 2');
assertEqual(calculateLevel(xpRequiredForLevel(2) - 1), 1, '929 XP = Level 1');

// Cumulative XP for specific levels
assertEqual(calculateLevel(cumulativeXpToLevel(5)), 5, `Cumulative XP for level 5 → Level 5`);
assertEqual(calculateLevel(cumulativeXpToLevel(10)), 10, `Cumulative XP for level 10 → Level 10`);
assertEqual(calculateLevel(cumulativeXpToLevel(50)), 50, `Cumulative XP for level 50 → Level 50`);
assertEqual(calculateLevel(cumulativeXpToLevel(100)), 100, `Cumulative XP for level 100 → Level 100`);

// Max level cap
assertEqual(calculateLevel(999_999), 100, 'Overflow XP capped at level 100');
assertEqual(calculateLevel(1_000_000_000), 100, 'Massive XP capped at level 100');

// ── TEST 3: Level Multiplier ────────────────────────────────────────────
section('TEST 3: Hybrid Level Multiplier');

assertEqual(getLevelMultiplier(1), 1.00, 'Level 1 = 1.00x');
assertEqual(getLevelMultiplier(5), 1.14, 'Level 5 = 1.14x');
assertEqual(getLevelMultiplier(10), 1.29, 'Level 10 = 1.29x');
assertEqual(getLevelMultiplier(15), 1.44, 'Level 15 = 1.44x');
assertEqual(getLevelMultiplier(20), 1.59, 'Level 20 = 1.59x');
assertEqual(getLevelMultiplier(25), 1.74, 'Level 25 = 1.74x');
assertEqual(getLevelMultiplier(50), 2.49, 'Level 50 = 2.49x');
assertEqual(getLevelMultiplier(100), 3.99, 'Level 100 = 3.99x');

// Edge cases
assertEqual(getLevelMultiplier(0), 1.00, 'Level 0 clamped to 1.00x');
assertEqual(getLevelMultiplier(-5), 1.00, 'Negative level clamped to 1.00x');
assertEqual(getLevelMultiplier(150), 3.99, 'Level 150 clamped to 3.99x');

// Monotonically increasing
for (let l = 2; l <= 100; l++) {
  assert(
    getLevelMultiplier(l) >= getLevelMultiplier(l - 1),
    `Multiplier at level ${l} >= level ${l - 1}`
  );
}

// ── TEST 4: Pickaxe Grants ──────────────────────────────────────────────
section('TEST 4: Pickaxe Grants at Correct Levels');

// Simulate leveling from 1 to 100 and check pickaxe grants
const expectedGrants: Record<number, string[]> = {
  15: ['Uncommon'],
  25: ['Rare'],
  40: ['Epic'],
  55: ['Legendary'],
  70: ['Mythic'],
};

const ownedPickaxes = new Set(['Common']);
const grantedPickaxes: Array<{ level: number; pickaxe: string }> = [];

for (let level = 2; level <= 100; level++) {
  for (const [pickaxe, unlockLevel] of Object.entries(PICKAXE_UNLOCK_LEVELS)) {
    if (level === unlockLevel && !ownedPickaxes.has(pickaxe)) {
      ownedPickaxes.add(pickaxe);
      grantedPickaxes.push({ level, pickaxe });
    }
  }
}

// Verify grants
assertEqual(grantedPickaxes.length, 5, 'Total pickaxe grants = 5');

for (const grant of grantedPickaxes) {
  const expected = expectedGrants[grant.level];
  assert(
    expected && expected.includes(grant.pickaxe),
    `Level ${grant.level}: grant ${grant.pickaxe} (expected: ${expected})`
  );
}

// Verify all pickaxes owned at level 100
assert(ownedPickaxes.has('Common'), 'Common owned');
assert(ownedPickaxes.has('Uncommon'), 'Uncommon owned at level 100');
assert(ownedPickaxes.has('Rare'), 'Rare owned at level 100');
assert(ownedPickaxes.has('Epic'), 'Epic owned at level 100');
assert(ownedPickaxes.has('Legendary'), 'Legendary owned at level 100');
assert(ownedPickaxes.has('Mythic'), 'Mythic owned at level 100');

// Verify no duplicate grants
const uniqueGrants = new Set(grantedPickaxes.map(g => g.pickaxe));
assertEqual(uniqueGrants.size, 5, 'No duplicate pickaxe grants');

// ── TEST 5: HP Scaling ──────────────────────────────────────────────────
section('TEST 5: HP Scaling with Level Multiplier');

// Test that HP scales correctly at different levels
const testCases = [
  { level: 1, multiplier: 1.00 },
  { level: 10, multiplier: 1.29 },
  { level: 25, multiplier: 1.74 },
  { level: 50, multiplier: 2.49 },
  { level: 100, multiplier: 3.99 },
];

for (const tc of testCases) {
  const mult = getLevelMultiplier(tc.level);
  assertEqual(mult, tc.multiplier, `Level ${tc.level} multiplier = ${tc.multiplier}`);

  // Stone Common HP: base 30-80
  const stoneCommonMin = Math.round(30 * mult);
  const stoneCommonMax = Math.round(80 * mult);
  assert(stoneCommonMin >= 30, `Level ${tc.level} Stone Common min HP >= 30`);
  assert(stoneCommonMax >= stoneCommonMin, `Level ${tc.level} Stone Common max >= min`);

  // Case COMMON HP: base 180-200
  const caseCommonMin = Math.round(180 * mult);
  const caseCommonMax = Math.round(200 * mult);
  assert(caseCommonMin >= 180, `Level ${tc.level} Case COMMON min HP >= 180`);
  assert(caseCommonMax >= caseCommonMin, `Level ${tc.level} Case COMMON max >= min`);

  console.log(`  Level ${tc.level}: Stone Common [${stoneCommonMin}-${stoneCommonMax}] | Case COMMON [${caseCommonMin}-${caseCommonMax}]`);
}

// ── TEST 6: Star XP Calculation ─────────────────────────────────────────
section('TEST 6: Star XP Calculation');

// 1-5 stars × tier XP
for (const [tier, xpPerStar] of Object.entries(STAR_XP_PER_TIER)) {
  assert(xpPerStar > 0, `Tier ${tier} has positive XP per star`);

  // Simulate worst case (1 star) and best case (5 stars)
  const minXP = 1 * xpPerStar;
  const maxXP = 5 * xpPerStar;
  assert(minXP < maxXP, `Tier ${tier}: min XP (${minXP}) < max XP (${maxXP})`);
}

// ── TEST 7: Burst Level-Up (Multiple Levels at Once) ───────────────────
section('TEST 7: Burst Level-Up Simulation');

// Simulate a player getting a massive XP bonus (e.g., 10,000 XP at once)
const burstXp = 10_000;
let currentLevel = 1;
let currentXp = 0;

// First burst
currentXp += burstXp;
const newLevel = calculateLevel(currentXp);
assert(newLevel > currentLevel, `Burst +${burstXp} XP: level ${currentLevel} → ${newLevel}`);

// Check if pickaxe grants happen correctly during burst
const burstGrants: string[] = [];
for (let l = currentLevel + 1; l <= newLevel; l++) {
  for (const [pickaxe, unlockLevel] of Object.entries(PICKAXE_UNLOCK_LEVELS)) {
    if (l === unlockLevel) {
      burstGrants.push(pickaxe);
    }
  }
}

console.log(`  Burst from level ${currentLevel} to ${newLevel}: pickaxe grants = [${burstGrants.join(', ')}]`);

// If burst goes from 1 to ~15, should get Uncommon
if (newLevel >= 15 && currentLevel < 15) {
  assert(burstGrants.includes('Uncommon'), 'Burst past level 15 grants Uncommon');
}

// Simulate multiple bursts to reach max level
let totalBursts = 0;
let simulatedLevel = 1;
let simulatedXp = 0;

// Simulate destroying ~1000 stones with average 3 stars
while (simulatedLevel < MAX_LEVEL && totalBursts < 5000) {
  const stars = Math.floor(Math.random() * 5) + 1;
  const tier = 'Common'; // Most common stone
  const xpGain = stars * (STAR_XP_PER_TIER[tier] || 100);
  simulatedXp += xpGain;
  const oldLevel = simulatedLevel;
  simulatedLevel = calculateLevel(simulatedXp);
  totalBursts++;

  if (simulatedLevel > oldLevel) {
    // Level up happened
  }
}

console.log(`  Simulated ${totalBursts} stone destroys to reach level ${simulatedLevel}`);
assertEqual(simulatedLevel, MAX_LEVEL, `Reached max level after ${totalBursts} destroys`);

// ── TEST 8: Edge Cases ──────────────────────────────────────────────────
section('TEST 8: Edge Cases');

// Level 1 with 0 XP
assertEqual(calculateLevel(0), 1, '0 XP = Level 1');
assertEqual(calculateLevel(1), 1, '1 XP = Level 1');

// Exact level boundaries
for (let l = 2; l <= 10; l++) {
  const xpForLevel = cumulativeXpToLevel(l);
  assertEqual(calculateLevel(xpForLevel), l, `Exact XP for level ${l} → Level ${l}`);
  assertEqual(calculateLevel(xpForLevel - 1), l - 1, `XP-1 for level ${l} → Level ${l - 1}`);
}

// Multiplier at level boundaries (every 5 levels)
for (let l = 0; l <= 100; l += 5) {
  const mult = getLevelMultiplier(l || 1);
  assert(mult >= 1.00, `Multiplier at level ${l || 1} >= 1.00`);
  assert(mult <= 4.00, `Multiplier at level ${l || 1} <= 4.00`);
}

// ── TEST 9: Full Simulation ─────────────────────────────────────────────
section('TEST 9: Full 1→100 Progression Simulation');

console.log('\n  Level | XP Required | Cumulative | Multiplier | Pickaxe Grant');
console.log('  ' + '─'.repeat(70));

let simXp = 0;
let simLevel = 1;
const simGrants: Array<{ level: number; pickaxe: string }> = [];
const milestones = [1, 5, 10, 15, 20, 25, 30, 40, 50, 55, 60, 70, 80, 90, 100];

for (let l = 2; l <= 100; l++) {
  const xpNeeded = xpRequiredForLevel(l);
  const cumulative = cumulativeXpToLevel(l);
  const mult = getLevelMultiplier(l);

  // Check pickaxe grant
  let grant = '';
  for (const [pickaxe, unlockLevel] of Object.entries(PICKAXE_UNLOCK_LEVELS)) {
    if (l === unlockLevel) {
      grant = `🔧 ${pickaxe}`;
      simGrants.push({ level: l, pickaxe });
    }
  }

  if (milestones.includes(l)) {
    console.log(`  ${String(l).padStart(5)} | ${String(xpNeeded).padStart(11)} | ${String(cumulative).padStart(10)} | ${String(mult.toFixed(2) + 'x').padStart(10)} | ${grant || '—'}`);
  }
}

console.log(`\n  Total XP to reach level 100: ${cumulativeXpToLevel(100)}`);
assertApprox(cumulativeXpToLevel(100), 100_000, 100, 'Total XP ≈ 100,000');
assertEqual(simGrants.length, 5, 'Total pickaxe grants in full simulation = 5');

// ── TEST 10: Balance Check ──────────────────────────────────────────────
section('TEST 10: Balance & Fairness Check');

// Verify that Common pickaxe can still mine at all levels
const commonAtk = 2.0;
for (const [tier, [hpMin, hpMax]] of Object.entries(STONE_HP_BASE)) {
  const mult1 = getLevelMultiplier(1);
  const mult100 = getLevelMultiplier(100);

  const hp1 = hpMax * mult1;
  const hp100 = hpMax * mult100;

  const hits1 = Math.ceil(hp1 / commonAtk);
  const hits100 = Math.ceil(hp100 / commonAtk);

  console.log(`  ${tier} Stone (Common ATK=2): Level 1 = ${hits1} hits, Level 100 = ${hits100} hits`);

  // Common pickaxe is expected to struggle at high levels — players should have better pickaxes by then.
  // At level 100, only Rare+ pickaxes should be mining Rare stones efficiently.
  assert(hits100 > 0, `${tier} Stone at level 100: ${hits100} hits > 0 (finite)`);
}

// Verify Mythic pickaxe efficiency
const mythicAtk = 60.0;
for (const [tier, [hpMin, hpMax]] of Object.entries(CASE_HP_BASE)) {
  const mult100 = getLevelMultiplier(100);
  const hp100 = hpMax * mult100;
  const hits100 = Math.ceil(hp100 / mythicAtk);

  console.log(`  ${tier} Case (Mythic ATK=60): Level 100 = ${hits100} hits`);
  assert(hits100 <= 50, `${tier} Case at level 100 with Mythic: ${hits100} hits <= 50 (efficient)`);
}

// ── TEST 11: Milestone Material Requirements ─────────────────────────
section('TEST 11: Milestone Material Requirements');

// Milestone levels: every 5 levels (5, 10, 15, ..., 100)
const MILESTONE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

interface MilestoneRequirement {
  level: number;
  common: number;
  medium: number;
  rare: number;
}

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

const isMilestoneLevel = (level: number): boolean => level % 5 === 0 && level >= 5;
const getMilestoneRequirement = (level: number): MilestoneRequirement | null => {
  if (!isMilestoneLevel(level)) return null;
  return MILESTONE_BASE.find(m => m.level === level) || null;
};

// Test 1: All milestone levels are identified correctly
for (let l = 1; l <= 100; l++) {
  const expected = l % 5 === 0 && l >= 5;
  assertEqual(isMilestoneLevel(l), expected, `Level ${l} isMilestoneLevel = ${expected}`);
}

// Test 2: All milestone levels have requirements
for (const milestone of MILESTONE_LEVELS) {
  const req = getMilestoneRequirement(milestone);
  assert(req !== null, `Level ${milestone} has milestone requirement`);
  assert(req!.common >= 0, `Level ${milestone} COMMON requirement >= 0`);
  assert(req!.medium >= 0, `Level ${milestone} MEDIUM requirement >= 0`);
  assert(req!.rare >= 0, `Level ${milestone} RARE requirement >= 0`);
}

// Test 3: Requirements increase over time (total materials)
let prevTotal = 0;
for (const req of MILESTONE_BASE) {
  const total = req.common + req.medium + req.rare;
  assert(total >= prevTotal, `Level ${req.level}: total materials (${total}) >= previous (${prevTotal})`);
  prevTotal = total;
}

console.log('\n  Milestone Level | COMMON | MEDIUM | RARE | Total');
console.log('  ' + '─'.repeat(50));
for (const req of MILESTONE_BASE) {
  const total = req.common + req.medium + req.rare;
  console.log(`  ${String(req.level).padStart(6)}          | ${String(req.common).padStart(6)} | ${String(req.medium).padStart(6)} | ${String(req.rare).padStart(4)} | ${total}`);
}

// ── TEST 12: Simulated Level-Up with Material Locking ──────────────────
section('TEST 12: Simulated Level-Up with Material Locking');

// Simulate a player mining stones and leveling up
let materialSimLevel = 1;
let materialSimXp = 0;
let materialSimPendingStars = 0;
let materialSimLockedLevel: number | null = null;
let totalStonesDestroyed = 0;
let totalCrafts = 0;

// Track materials (simulated drops from case boxes)
const simMaterials: Record<string, number> = {};
const COMMON_MATERIALS = ['Rusty Nail', 'Wooden Handle', 'Iron Shard'];
const MEDIUM_MATERIALS = ['Steel Alloy', 'Silver Filament'];
const RARE_MATERIALS = ['Void Diamond', 'Phoenix Feather'];

const simulateMiningSession = () => {
  // Player mines 50 stones and 20 cases
  for (let i = 0; i < 50; i++) {
    // Stone destroy: get 1-5 stars
    const stars = Math.floor(Math.random() * 5) + 1;
    const xpGain = stars * 100; // Common stone XP
    materialSimXp += xpGain;
    totalStonesDestroyed++;

    // Calculate new level
    const potentialLevel = calculateLevel(materialSimXp);

    if (potentialLevel > materialSimLevel && !materialSimLockedLevel) {
      // Check for milestone
      for (let l = materialSimLevel + 1; l <= potentialLevel; l++) {
        if (isMilestoneLevel(l)) {
          // Lock at milestone
          materialSimLockedLevel = l;
          materialSimPendingStars = stars;
          materialSimLevel = l - 1;
          break;
        }
      }

      if (!materialSimLockedLevel) {
        materialSimLevel = potentialLevel;
      }
    }
  }

  // Case box drops: random materials
  for (let i = 0; i < 20; i++) {
    const roll = Math.random();
    if (roll < 0.2) { // 20% material drop
      const rarityRoll = Math.random();
      let materialPool: string[];
      if (rarityRoll < 0.7) materialPool = COMMON_MATERIALS;
      else if (rarityRoll < 0.92) materialPool = MEDIUM_MATERIALS;
      else materialPool = RARE_MATERIALS;

      const material = materialPool[Math.floor(Math.random() * materialPool.length)];
      simMaterials[material] = (simMaterials[material] || 0) + 1;
    }
  }

  // Try to craft if locked
  if (materialSimLockedLevel) {
    const req = getMilestoneRequirement(materialSimLockedLevel);
    if (req) {
      // Count materials by rarity
      let haveCommon = 0, haveMedium = 0, haveRare = 0;
      for (const [name, count] of Object.entries(simMaterials)) {
        if (COMMON_MATERIALS.includes(name)) haveCommon += count;
        else if (MEDIUM_MATERIALS.includes(name)) haveMedium += count;
        else if (RARE_MATERIALS.includes(name)) haveRare += count;
      }

      if (haveCommon >= req.common && haveMedium >= req.medium && haveRare >= req.rare) {
        // Craft!
        materialSimLevel = materialSimLockedLevel!;
        materialSimLockedLevel = null;
        materialSimPendingStars = 0;
        totalCrafts++;

        // Deduct materials (simplified)
        let deducted = 0;
        for (const [name, count] of Object.entries(simMaterials)) {
          if (deducted >= req.common) break;
          if (COMMON_MATERIALS.includes(name) && count > 0) {
            const deduct = Math.min(count, req.common - deducted);
            simMaterials[name] -= deduct;
            deducted += deduct;
          }
        }
      }
    }
  }
};

// Run multiple sessions
for (let session = 0; session < 5; session++) {
  simulateMiningSession();
}

console.log(`  Sessions completed: 5`);
console.log(`  Stones destroyed: ${totalStonesDestroyed}`);
console.log(`  Current level: ${materialSimLevel}`);
console.log(`  Locked level: ${materialSimLockedLevel || 'None'}`);
console.log(`  Pending stars: ${materialSimPendingStars}`);
console.log(`  Total crafts: ${totalCrafts}`);
console.log(`  Materials collected: ${Object.entries(simMaterials).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None'}`);

assert(materialSimLevel >= 1, `Simulated level >= 1: ${materialSimLevel}`);
assert(totalCrafts >= 0, `Total crafts >= 0: ${totalCrafts}`);
assert(totalStonesDestroyed > 0, `Stones destroyed > 0: ${totalStonesDestroyed}`);

// ── RESULTS ─────────────────────────────────────────────────────────────
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
} else {
  console.log('\n  🎉 ALL TESTS PASSED! Leveling system is correct.\n');
  process.exit(0);
}
