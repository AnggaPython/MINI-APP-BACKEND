/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPREHENSIVE ECONOMY SIMULATION — Resource Income vs Upgrade Costs
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Tests the balance of the entire game economy:
 *  - Different user profiles (buff levels, pickaxe upgrades, XP levels)
 *  - Mining 100-1000 stones/cases
 *  - Resource income vs upgrade costs
 *  - Hyperinflation check
 *  - ELIXCOIN exchange rate balance
 *
 *  Run:  node --experimental-strip-types src/pickaxe-upgraded/economy-simulation.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── GAME CONSTANTS ─────────────────────────────────────────────────────

type PickaxeTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";
type StoneTier = "Common" | "Medium" | "Rare";

const MAX_LEVEL = 100;
const MAX_UPGRADE = 20;

// ── XP Formula ─────────────────────────────────────────────────────────
const xpRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 500 + level * 10;
};

const cumulativeXpToLevel = (level: number): number => {
  let total = 0;
  for (let l = 2; l <= level; l++) total += xpRequiredForLevel(l);
  return total;
};

const calculateLevel = (totalXp: number): number => {
  let level = 1;
  let xpRemaining = totalXp;
  for (let l = 2; l <= MAX_LEVEL; l++) {
    const needed = xpRequiredForLevel(l);
    if (xpRemaining >= needed) { xpRemaining -= needed; level = l; }
    else break;
  }
  return level;
};

// ── Level Multiplier ───────────────────────────────────────────────────
const getLevelMultiplier = (level: number): number => {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
  const base = 1 + (clamped - 1) * 0.01;
  const milestone = Math.floor(clamped / 5) * 0.10;
  return Math.round((base + milestone) * 100) / 100;
};

// ── Star XP ────────────────────────────────────────────────────────────
const STAR_XP_PER_TIER: Record<string, number> = { Common: 100, Medium: 200, Rare: 500 };

// ── Stone Config ───────────────────────────────────────────────────────
const STONE_TIER_WEIGHTS: Record<StoneTier, number> = { Common: 85000, Medium: 12000, Rare: 3000 };
const STONE_HP: Record<StoneTier, [number, number]> = { Common: [30, 80], Medium: [60, 160], Rare: [90, 360] };
const STONE_REWARDS: Record<StoneTier, Record<string, [number, number]>> = {
  Common: { IRON: [10, 100], COPPER: [5, 50] },
  Medium: { SILVER: [5, 40], GOLD: [1, 3] },
  Rare: { GOLD: [2, 10], DIAMOND: [1, 3] },
};
const STONE_ZONK_CHANCE = 0.1;

// ── Case Box Config ────────────────────────────────────────────────────
const CASE_TIER_WEIGHTS: Record<string, number> = { COMMON: 70, MEDIUM: 25, RARE: 5 };
const CASE_OUTCOME_WEIGHTS: Record<string, number> = { MATERIAL: 20, BUFF: 45, ZONK: 25, ELIXCOIN: 10 };
const CASE_ELIXCOIN_BANDS: Record<string, [number, number]> = {
  COMMON: [100, 500], MEDIUM: [300, 1200], RARE: [800, 3000],
};

// ── ELIXCOIN Rates ─────────────────────────────────────────────────────
const ELIX_RATES: Record<string, number> = {
  IRON: 0.005, COPPER: 0.01, SILVER: 0.1, GOLD: 1, DIAMOND: 10,
};

// ── Pickaxe Config ─────────────────────────────────────────────────────
const PICKAXE_BASE: Record<PickaxeTier, { power: number; durability: number }> = {
  Common: { power: 2.0, durability: 25 },
  Uncommon: { power: 5.0, durability: 50 },
  Rare: { power: 10.0, durability: 75 },
  Epic: { power: 15.0, durability: 100 },
  Legendary: { power: 30.0, durability: 200 },
  Mythic: { power: 60.0, durability: 400 },
};

const PICKAXE_UPGRADE_PER_LEVEL: Record<PickaxeTier, { atk: number; dur: number }> = {
  Common: { atk: 0.15, dur: 1.5 },
  Uncommon: { atk: 0.25, dur: 2.5 },
  Rare: { atk: 0.4, dur: 4 },
  Epic: { atk: 0.6, dur: 6 },
  Legendary: { atk: 1.0, dur: 10 },
  Mythic: { atk: 1.5, dur: 15 },
};

const PICKAXE_UPGRADE_COST: Record<PickaxeTier, Record<string, number>> = {
  Common: { IRON: 2500, COPPER: 1000 },
  Uncommon: { COPPER: 2500, SILVER: 1500 },
  Rare: { SILVER: 2000, GOLD: 250 },
  Epic: { GOLD: 1000, DIAMOND: 50 },
  Legendary: { GOLD: 2500, DIAMOND: 150 },
  Mythic: { GOLD: 5000, DIAMOND: 500 },
};

// ── Buff Config ────────────────────────────────────────────────────────
interface BuffConfig {
  atk: number;       // flat ATK bonus
  economy: number;   // % resource multiplier
  droprate: number;  // % rare drop chance boost
}

// ── User Profiles ──────────────────────────────────────────────────────
interface UserProfile {
  name: string;
  level: number;
  pickaxe: PickaxeTier;
  upgradeLevel: number;
  buffs: BuffConfig;
}

const PROFILES: UserProfile[] = [
  // Noob: Level 1, Common pickaxe, no buffs
  { name: "Newbie", level: 1, pickaxe: "Common", upgradeLevel: 0, buffs: { atk: 0, economy: 0, droprate: 0 } },
  // Mid-game: Level 25, Uncommon+5, light buffs
  { name: "Mid-Game", level: 25, pickaxe: "Uncommon", upgradeLevel: 5, buffs: { atk: 2, economy: 10, droprate: 0 } },
  // Late-game: Level 50, Epic+10, medium buffs
  { name: "Late-Game", level: 50, pickaxe: "Epic", upgradeLevel: 10, buffs: { atk: 5, economy: 25, droprate: 5 } },
  // Endgame: Level 70, Legendary+15, strong buffs
  { name: "Endgame", level: 70, pickaxe: "Legendary", upgradeLevel: 15, buffs: { atk: 10, economy: 40, droprate: 10 } },
  // Whale: Level 100, Mythic+20, max buffs
  { name: "Whale", level: 100, pickaxe: "Mythic", upgradeLevel: 20, buffs: { atk: 20, economy: 60, droprate: 15 } },
];

// ═══════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function rand(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function weightedPick(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [key, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return Object.keys(weights).pop()!;
}

function getAtk(profile: UserProfile): number {
  const base = PICKAXE_BASE[profile.pickaxe].power;
  const upgrade = PICKAXE_UPGRADE_PER_LEVEL[profile.pickaxe].atk * profile.upgradeLevel;
  return base + upgrade + profile.buffs.atk;
}

function getDurability(profile: UserProfile): number {
  const base = PICKAXE_BASE[profile.pickaxe].durability;
  const upgrade = PICKAXE_UPGRADE_PER_LEVEL[profile.pickaxe].dur * profile.upgradeLevel;
  return base + upgrade;
}

// ═══════════════════════════════════════════════════════════════════════
//  TEST FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════

let totalTests = 0;
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) { passed++; }
  else { failed++; failures.push(`  ❌ FAIL: ${message}`); console.log(`  ❌ FAIL: ${message}`); }
}

function section(title: string) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(70)}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN SIMULATION
// ═══════════════════════════════════════════════════════════════════════

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║   COMPREHENSIVE ECONOMY SIMULATION — Balance Analysis          ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');

// ── TEST 1: Resource Income per Stone ──────────────────────────────────
section('TEST 1: Average Resource Income per Stone (SAVE action)');

console.log('\n  Profile         | Stone Count | IRON      | COPPER    | SILVER    | GOLD    | DIAMOND | ELIXCOIN');
console.log('  ' + '─'.repeat(90));

const SIM_COUNTS = [100, 200, 500, 1000];
const stoneResults: Record<string, Record<number, Record<string, number>>> = {};

for (const profile of PROFILES) {
  stoneResults[profile.name] = {};
  for (const count of SIM_COUNTS) {
    const income: Record<string, number> = { IRON: 0, COPPER: 0, SILVER: 0, GOLD: 0, DIAMOND: 0, ELIXCOIN: 0 };
    const atk = getAtk(profile);
    const levelMult = getLevelMultiplier(profile.level);
    const econMult = 1 + profile.buffs.economy / 100;

    for (let i = 0; i < count; i++) {
      // Roll tier
      const tierRoll = Math.random() * 100000;
      let tier: StoneTier = "Common";
      if (tierRoll < STONE_TIER_WEIGHTS.Common) tier = "Common";
      else if (tierRoll < STONE_TIER_WEIGHTS.Common + STONE_TIER_WEIGHTS.Medium) tier = "Medium";
      else tier = "Rare";

      // Zonk check
      if (Math.random() < STONE_ZONK_CHANCE) continue;

      // Roll rewards
      const rewards = STONE_REWARDS[tier];
      for (const [resource, [min, max]] of Object.entries(rewards)) {
        const base = rand(min, max);
        const scaled = Math.round(base * levelMult * econMult);
        income[resource] = (income[resource] || 0) + scaled;
      }
    }

    stoneResults[profile.name][count] = income;

    if (count === 1000) {
      const avg = (v: number) => Math.round(v / count);
      console.log(`  ${profile.name.padEnd(16)} | ${String(count).padStart(11)} | ${String(avg(income.IRON)).padStart(9)} | ${String(avg(income.COPPER)).padStart(9)} | ${String(avg(income.SILVER)).padStart(9)} | ${String(avg(income.GOLD)).padStart(7)} | ${String(avg(income.DIAMOND)).padStart(7)} | ${String(avg(income.ELIXCOIN)).padStart(8)}`);
    }
  }
}

// ── TEST 2: Resource Income per Case Box ───────────────────────────────
section('TEST 2: Average Resource/ELIXCOIN per Case Box');

console.log('\n  Profile         | Case Count | MATERIAL | ELIXCOIN | BUFF  | ZONK  | Avg ELIXCOIN/case');
console.log('  ' + '─'.repeat(90));

const caseResults: Record<string, Record<number, { materials: number; elixcoin: number; buff: number; zonk: number }>> = {};

for (const profile of PROFILES) {
  caseResults[profile.name] = {};
  for (const count of SIM_COUNTS) {
    let materials = 0, elixcoin = 0, buff = 0, zonk = 0;
    const econMult = 1 + profile.buffs.economy / 100;
    const droprateBonus = profile.buffs.droprate;
    const levelMult = getLevelMultiplier(profile.level);

    for (let i = 0; i < count; i++) {
      const outcome = weightedPick(CASE_OUTCOME_WEIGHTS);
      if (outcome === "MATERIAL") materials++;
      else if (outcome === "ELIXCOIN") {
        const caseTier = weightedPick(CASE_TIER_WEIGHTS);
        const [min, max] = CASE_ELIXCOIN_BANDS[caseTier];
        const base = rand(min, max);
        elixcoin += Math.round(base * levelMult * econMult);
      }
      else if (outcome === "BUFF") buff++;
      else zonk++;
    }

    caseResults[profile.name][count] = { materials, elixcoin, buff, zonk };

    if (count === 1000) {
      const avg = (v: number) => Math.round(v / count * 100) / 100;
      console.log(`  ${profile.name.padEnd(16)} | ${String(count).padStart(11)} | ${String(avg(materials)).padStart(8)} | ${String(avg(elixcoin * 100 / count)).padStart(8)}% | ${String(avg(buff * 100 / count)).padStart(5)}% | ${String(avg(zonk * 100 / count)).padStart(5)}% | ${String(Math.round(elixcoin / count)).padStart(17)}`);
    }
  }
}

// ── TEST 3: Upgrade Cost vs Income Analysis ────────────────────────────
section('TEST 3: Upgrade Cost vs Income — Days to Upgrade');

console.log('\n  Profile         | Pickaxe      | Upg Lvl | Stones/Day | Resources/Day | Days to Upgrade All');
console.log('  ' + '─'.repeat(95));

// Assume ~200 stones/day (realistic active player)
const STONES_PER_DAY = 200;
const CASES_PER_DAY = 50;

for (const profile of PROFILES) {
  // Calculate total upgrade cost for current tier
  const cost = PICKAXE_UPGRADE_COST[profile.pickaxe];
  const levelsRemaining = MAX_UPGRADE - profile.upgradeLevel;
  const totalCost: Record<string, number> = {};
  for (const [resource, amount] of Object.entries(cost)) {
    totalCost[resource] = amount * levelsRemaining;
  }

  // Calculate daily income from stones (1000 stones → average)
  const income1000 = stoneResults[profile.name][1000];
  const dailyIncome: Record<string, number> = {};
  for (const [resource, amount] of Object.entries(income1000)) {
    if (resource === "ELIXCOIN") continue;
    dailyIncome[resource] = (amount / 1000) * STONES_PER_DAY;
  }

  // Find bottleneck resource (longest time)
  let maxDays = 0;
  let bottleneck = "";
  for (const [resource, needed] of Object.entries(totalCost)) {
    if (needed <= 0) continue;
    const perDay = dailyIncome[resource] || 0;
    if (perDay <= 0) { maxDays = 9999; bottleneck = resource; break; }
    const days = needed / perDay;
    if (days > maxDays) { maxDays = days; bottleneck = resource; }
  }

  const daysStr = maxDays >= 9999 ? "∞" : `${Math.round(maxDays)}`;
  console.log(`  ${profile.name.padEnd(16)} | ${profile.pickaxe.padEnd(12)} | ${String(profile.upgradeLevel).padStart(7)} | ${String(STONES_PER_DAY).padStart(10)} | ${String(Math.round(Object.values(dailyIncome).reduce((a, b) => a + b, 0))).padStart(13)} | ${daysStr.padStart(6)} days (${bottleneck})`);

  // Balance assertion: shouldn't take more than 60 days for active player
  assert(maxDays <= 60, `${profile.name} upgrade time ≤ 60 days (got ${maxDays})`);
}

// ── TEST 4: Hyperinflation Check ───────────────────────────────────────
section('TEST 4: Hyperinflation Check — Resource Accumulation Rate');

console.log('\n  Simulating 30-day active play for each profile:');
console.log('  Assumptions: 200 stones/day + 50 cases/day, all SAVE action\n');

console.log('  Profile         | 30d IRON    | 30d COPPER  | 30d SILVER  | 30d GOLD  | 30d DIAMOND | 30d ELIXCOIN');
console.log('  ' + '─'.repeat(100));

const INFLATION_THRESHOLD = 1.5; // 150% above expected = hyperinflation

for (const profile of PROFILES) {
  const income1000 = stoneResults[profile.name][1000];
  const dailyStones: Record<string, number> = {};
  for (const [resource, amount] of Object.entries(income1000)) {
    dailyStones[resource] = (amount / 1000) * STONES_PER_DAY;
  }

  // Add case income
  const caseData = caseResults[profile.name][1000];
  const dailyCases = {
    materials: (caseData.materials / 1000) * CASES_PER_DAY,
    elixcoin: (caseData.elixcoin / 1000) * CASES_PER_DAY,
  };

  const total30d = {
    IRON: Math.round(dailyStones.IRON * 30),
    COPPER: Math.round(dailyStones.COPPER * 30),
    SILVER: Math.round(dailyStones.SILVER * 30),
    GOLD: Math.round(dailyStones.GOLD * 30),
    DIAMOND: Math.round(dailyStones.DIAMOND * 30),
    ELIXCOIN: Math.round((dailyStones.ELIXCOIN || 0) * 30 + dailyCases.elixcoin * 30),
  };

  console.log(`  ${profile.name.padEnd(16)} | ${String(total30d.IRON.toLocaleString()).padStart(11)} | ${String(total30d.COPPER.toLocaleString()).padStart(10)} | ${String(total30d.SILVER.toLocaleString()).padStart(10)} | ${String(total30d.GOLD.toLocaleString()).padStart(9)} | ${String(total30d.DIAMOND.toLocaleString()).padStart(11)} | ${String(total30d.ELIXCOIN.toLocaleString()).padStart(12)}`);

  // Check: Newbie shouldn't accumulate too much IRON (most common resource)
  if (profile.name === "Newbie") {
    assert(total30d.IRON < 500_000, `Newbie 30d IRON < 500K (got ${total30d.IRON})`);
    assert(total30d.DIAMOND < 500, `Newbie 30d DIAMOND < 500 (got ${total30d.DIAMOND})`);
  }
}

// ── TEST 5: ELIXCOIN Exchange Rate Balance ─────────────────────────────
section('TEST 5: ELIXCOIN Exchange Rate Balance');

console.log('\n  Resource ELIXCOIN value per unit:');
console.log('  ' + '─'.repeat(40));
for (const [resource, rate] of Object.entries(ELIX_RATES)) {
  console.log(`  ${resource.padEnd(10)} = ${rate} ELIXCOIN`);
}

// Expected SELL value per stone (average) — uses new reward bands
const expectedCommonSell = ((10 + 100) / 2 * 0.005 + (5 + 50) / 2 * 0.01) * 0.9;
const expectedMediumSell = ((5 + 40) / 2 * 0.1 + (1 + 3) / 2 * 1) * 0.9;
const expectedRareSell = ((2 + 10) / 2 * 1 + (1 + 3) / 2 * 10) * 0.9;

console.log(`\n  Expected ELIXCOIN per stone (SAVE→SELL):`);
console.log(`  Common: ~${expectedCommonSell.toFixed(2)} ELIXCOIN`);
console.log(`  Medium: ~${expectedMediumSell.toFixed(2)} ELIXCOIN`);
console.log(`  Rare:   ~${expectedRareSell.toFixed(2)} ELIXCOIN`);

// Balance: SELL should give meaningful ELIXCOIN but not dominate
const sellToSaveRatio = expectedRareSell / expectedCommonSell;
console.log(`\n  Rare/Common SELL ratio: ${sellToSaveRatio.toFixed(1)}x`);
assert(sellToSaveRatio >= 1.5, `Rare SELL ≥ 1.5x Common SELL (got ${sellToSaveRatio.toFixed(1)})`);
assert(sellToSaveRatio <= 50, `Rare SELL ≤ 50x Common SELL (got ${sellToSaveRatio.toFixed(1)})`);

// ── TEST 6: Upgrade Cost Fairness Across Profiles ──────────────────────
section('TEST 6: Upgrade Cost Fairness Across Profiles');

console.log('\n  Cost to max upgrade (20 levels) as % of 30-day income:\n');
console.log('  Profile         | Pickaxe      | Total Cost (resources) | 30d Income | Cost/Income %');
console.log('  ' + '─'.repeat(95));

for (const profile of PROFILES) {
  const cost = PICKAXE_UPGRADE_COST[profile.pickaxe];
  let totalCostValue = 0;
  for (const [resource, amount] of Object.entries(cost)) {
    totalCostValue += amount * 20;
  }

  // Calculate 30-day income value (weighted sum)
  const income1000 = stoneResults[profile.name][1000];
  let totalIncomeValue = 0;
  for (const [resource, amount] of Object.entries(income1000)) {
    if (resource === "ELIXCOIN") continue;
    totalIncomeValue += (amount / 1000) * STONES_PER_DAY * 30;
  }

  const costPercent = totalIncomeValue > 0 ? (totalCostValue / totalIncomeValue * 100).toFixed(1) : "∞";
  console.log(`  ${profile.name.padEnd(16)} | ${profile.pickaxe.padEnd(12)} | ${String(totalCostValue.toLocaleString()).padStart(22)} | ${String(Math.round(totalIncomeValue).toLocaleString()).padStart(12)} | ${costPercent}%`);

  // Balance: cost should be meaningful but not overwhelming
  const pct = parseFloat(costPercent);
  if (!isNaN(pct)) {
    assert(pct >= 1, `${profile.name} cost ≥ 1% of 30d income (got ${pct}%)`);
    assert(pct <= 300, `${profile.name} cost ≤ 300% of 30d income (got ${pct}%)`);
  }
}

// ── TEST 7: Material Tool Acquisition Rate ─────────────────────────────
section('TEST 7: Material Tool Acquisition Rate');

console.log('\n  Materials needed vs acquired (50 cases/day × 30 days = 1500 cases):\n');

const CASES_30D = 1500;
for (const profile of PROFILES) {
  const caseData = caseResults[profile.name][1000];
  const materialRate = caseData.materials / 1000;
  const materials30d = Math.round(materialRate * CASES_30D);

  // Materials needed for full upgrade of all tiers
  const totalMaterialsNeeded = 120; // 6 tiers × 20 levels

  console.log(`  ${profile.name.padEnd(16)}: ${materials30d} materials in 30d (need ${totalMaterialsNeeded} for all upgrades)`);
  assert(materials30d >= 50, `${profile.name} gets ≥ 50 materials in 30d (got ${materials30d})`);
}

// ── TEST 8: Mining Speed vs Upgrade Balance ────────────────────────────
section('TEST 8: Mining Speed vs Upgrade Balance');

console.log('\n  Time to mine 1 stone (hits needed) vs upgrade benefit:\n');

for (const profile of PROFILES) {
  const atk = getAtk(profile);
  const avgHp = (STONE_HP.Common[0] + STONE_HP.Common[1]) / 2; // Common stone average
  const hitsNeeded = Math.ceil(avgHp / atk);
  const timeSeconds = hitsNeeded * 1.5; // 1.5s per hit

  console.log(`  ${profile.name.padEnd(16)}: ATK ${atk.toFixed(2)} → ${hitsNeeded} hits/stone (${Math.round(timeSeconds)}s)`);
  assert(hitsNeeded >= 1, `${profile.name} hits ≥ 1`);
  assert(hitsNeeded <= 100, `${profile.name} hits ≤ 100 (got ${hitsNeeded})`);
}

// ── TEST 9: Edge Case — Maxed Player Economics ────────────────────────
section('TEST 9: Edge Case — Maxed Player Economics');

console.log('\n  Whale (Level 100, Mythic+20, max buffs) — 1000 stones:\n');

const whaleIncome = stoneResults["Whale"][1000];
const whaleCase = caseResults["Whale"][1000];

console.log(`  Stones: 1000`);
console.log(`  IRON: ${(whaleIncome.IRON || 0).toLocaleString()}`);
console.log(`  COPPER: ${(whaleIncome.COPPER || 0).toLocaleString()}`);
console.log(`  SILVER: ${(whaleIncome.SILVER || 0).toLocaleString()}`);
console.log(`  GOLD: ${(whaleIncome.GOLD || 0).toLocaleString()}`);
console.log(`  DIAMOND: ${(whaleIncome.DIAMOND || 0).toLocaleString()}`);
console.log(`  Cases: ${whaleCase.materials} materials, ${whaleCase.elixcoin.toLocaleString()} ELIXCOIN`);  // Whale should have high income but upgrades are expensive too
  const whaleIncome30d = (whaleIncome.IRON || 0) * 3 + (whaleIncome.COPPER || 0) * 3; // scaled to 30d
  assert(whaleIncome30d < 5_000_000, `Whale 30d resource value < 5M (got ${whaleIncome30d})`);

// ═══════════════════════════════════════════════════════════════════════
//  RESULTS
// ═══════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(70));
console.log(`  TOTAL: ${totalTests} tests`);
console.log(`  PASSED: ${passed} ✅`);
console.log(`  FAILED: ${failed} ❌`);
console.log('═'.repeat(70));

if (failures.length > 0) {
  console.log('\n  FAILURES:');
  failures.forEach(f => console.log(f));
  console.log('');
  process.exit(1);
} else {
  console.log('\n  🎉 ALL TESTS PASSED! Economy is balanced.\n');
  process.exit(0);
}
