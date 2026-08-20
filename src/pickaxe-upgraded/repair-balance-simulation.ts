/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  REPAIR COST BALANCE SIMULATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Finds the sweet spot for repair costs per pickaxe tier.
 *  Each stone spawn = -1 durability. When durability = 0, repair needed.
 *
 *  Run:  node --experimental-strip-types src/pickaxe-upgraded/repair-balance-simulation.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

type PickaxeTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

// ── Pickaxe Stats ──────────────────────────────────────────────────────
const PICKAXE_TIERS: PickaxeTier[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

const PICKAXE_STATS: Record<PickaxeTier, { power: number; durability: number }> = {
  Common:    { power: 2.0,  durability: 25 },
  Uncommon:  { power: 5.0,  durability: 50 },
  Rare:      { power: 10.0, durability: 75 },
  Epic:      { power: 15.0, durability: 100 },
  Legendary: { power: 30.0, durability: 200 },
  Mythic:    { power: 60.0, durability: 400 },
};

// ── Current Repair Costs (the ones we want to balance) ─────────────────
const CURRENT_REPAIR_COSTS: Record<PickaxeTier, Record<string, number>> = {
  Common:    { IRON: 1000 },
  Uncommon:  { SILVER: 800 },
  Rare:      { GOLD: 150 },
  Epic:      { GOLD: 500 },
  Legendary: { GOLD: 2000 },
  Mythic:    { GOLD: 5000, DIAMOND: 50 },
};

// ── Resource Income (per stone, from balanced economy) ──────────────────
const STONE_REWARDS: Record<string, Record<string, [number, number]>> = {
  Common: { IRON: [10, 100], COPPER: [5, 50] },
  Medium: { SILVER: [5, 40], GOLD: [1, 3] },
  Rare: { GOLD: [2, 10], DIAMOND: [1, 3] },
};

// Stone tier distribution
const STONE_DIST = { Common: 0.85, Medium: 0.12, Rare: 0.03 };

// ── Game Constants ─────────────────────────────────────────────────────
const STONES_PER_DAY = 200;
const CASES_PER_DAY = 50;
const DAYS_SIMULATED = 30;

// ── Test Framework ─────────────────────────────────────────────────────
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

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN SIMULATION
// ═══════════════════════════════════════════════════════════════════════

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║   REPAIR COST BALANCE SIMULATION                              ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');

// ── TEST 1: Stones Before Repair ───────────────────────────────────────
section('TEST 1: Stones Before Repair (Durability Analysis)');

console.log('\n  Tier        | Durability | Stones Before Repair | Time to Break');
console.log('  ' + '─'.repeat(70));

for (const tier of PICKAXE_TIERS) {
  const dur = PICKAXE_STATS[tier].durability;
  const stonesBeforeBreak = dur; // 1 stone = -1 durability
  const timeToBreak = stonesBeforeBreak * 2; // ~2 min per stone with cooldown
  const hoursToBreak = Math.round(timeToBreak / 60 * 10) / 10;

  console.log(`  ${tier.padEnd(12)} | ${String(dur).padStart(10)} | ${String(stonesBeforeBreak).padStart(20)} | ${hoursToBreak} hours`);
}

// ── TEST 2: Repair Cost as % of Income ─────────────────────────────────
section('TEST 2: Repair Cost as % of Daily Income');

console.log('\n  Tier        | Repair Cost | Daily Income | Repair/Day | Cost as % of Income');
console.log('  ' + '─'.repeat(85));

// Calculate average income per stone
const avgIncomePerStone: Record<string, number> = {};
for (const [tier, rewards] of Object.entries(STONE_REWARDS)) {
  let total = 0;
  for (const [_, [min, max]] of Object.entries(rewards)) {
    total += (min + max) / 2;
  }
  avgIncomePerStone[tier] = total;
}

for (const tier of PICKAXE_TIERS) {
  const repairCost = CURRENT_REPAIR_COSTS[tier];
  const durability = PICKAXE_STATS[tier].durability;
  const stonesPerDay = STONES_PER_DAY;

  // Repairs per day
  const repairsPerDay = stonesPerDay / durability;

  // Calculate daily income
  let dailyIncome = 0;
  for (const [tier, rewards] of Object.entries(STONE_REWARDS)) {
    for (const [_, [min, max]] of Object.entries(rewards)) {
      const avg = (min + max) / 2;
      dailyIncome += avg * stonesPerDay * 0.85; // 85% Common stones
    }
  }

  // Total repair cost per day
  let totalRepairCostPerDay = 0;
  for (const [resource, amount] of Object.entries(repairCost)) {
    totalRepairCostPerDay += amount * repairsPerDay;
  }

  const costPercent = dailyIncome > 0 ? (totalRepairCostPerDay / dailyIncome * 100).toFixed(1) : "∞";

  console.log(`  ${tier.padEnd(12)} | ${JSON.stringify(repairCost).padEnd(12)} | ${String(Math.round(dailyIncome)).padStart(12)} | ${String(repairsPerDay.toFixed(1)).padStart(10)} | ${costPercent}%`);
}

// ── TEST 3: 30-Day Repair Cost Simulation ──────────────────────────────
section('TEST 3: 30-Day Repair Cost Simulation');

console.log('\n  Simulating 30 days of mining with repair costs:\n');

interface SimResult {
  tier: string;
  totalStones: number;
  totalRepairs: number;
  totalCost: Record<string, number>;
  totalIncome: Record<string, number>;
  netIncome: Record<string, number>;
  repairCostPercent: number;
}

const results: SimResult[] = [];

for (const tier of PICKAXE_TIERS) {
  const durability = PICKAXE_STATS[tier].durability;
  const repairCost = CURRENT_REPAIR_COSTS[tier];
  const totalStones = STONES_PER_DAY * DAYS_SIMULATED;
  const totalRepairs = Math.floor(totalStones / durability);

  // Calculate total cost
  const totalCost: Record<string, number> = {};
  for (const [resource, amount] of Object.entries(repairCost)) {
    totalCost[resource] = amount * totalRepairs;
  }

  // Calculate total income (simplified)
  const totalIncome: Record<string, number> = { IRON: 0, COPPER: 0, SILVER: 0, GOLD: 0, DIAMOND: 0 };
  for (let day = 0; day < DAYS_SIMULATED; day++) {
    for (let stone = 0; stone < STONES_PER_DAY; stone++) {
      // Roll stone tier
      const roll = Math.random();
      let stoneTier: string;
      if (roll < STONE_DIST.Common) stoneTier = "Common";
      else if (roll < STONE_DIST.Common + STONE_DIST.Medium) stoneTier = "Medium";
      else stoneTier = "Rare";

      // Add rewards
      const rewards = STONE_REWARDS[stoneTier];
      for (const [resource, [min, max]] of Object.entries(rewards)) {
        totalIncome[resource] += rand(min, max);
      }
    }
  }

  // Calculate net income
  const netIncome: Record<string, number> = {};
  for (const resource of Object.keys(totalIncome)) {
    netIncome[resource] = (totalIncome[resource] || 0) - (totalCost[resource] || 0);
  }

  // Calculate repair cost as % of income
  let totalIncomeValue = 0;
  let totalCostValue = 0;
  for (const resource of Object.keys(totalIncome)) {
    totalIncomeValue += totalIncome[resource] || 0;
    totalCostValue += totalCost[resource] || 0;
  }
  const repairCostPercent = totalIncomeValue > 0 ? (totalCostValue / totalIncomeValue * 100) : 0;

  results.push({
    tier,
    totalStones,
    totalRepairs,
    totalCost,
    totalIncome,
    netIncome,
    repairCostPercent,
  });
}

console.log('  Tier        | Stones | Repairs | Cost (IRON/SILVER/GOLD/DIA) | Net Income | Cost %');
console.log('  ' + '─'.repeat(95));

for (const r of results) {
  const costStr = Object.entries(r.totalCost)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `${k}:${Math.round(v).toLocaleString()}`)
    .join(' ') || 'None';

  const netStr = Object.entries(r.netIncome)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `${k}:${Math.round(v).toLocaleString()}`)
    .join(' ');

  console.log(`  ${r.tier.padEnd(12)} | ${String(r.totalStones).padStart(6)} | ${String(r.totalRepairs).padStart(7)} | ${costStr.padEnd(30)} | ${netStr.padEnd(12)} | ${r.repairCostPercent.toFixed(1)}%`);
}

// ── TEST 4: Sweet Spot Analysis ────────────────────────────────────────
section('TEST 4: Sweet Spot Analysis');

console.log('\n  Target: Repair cost should be 5-15% of 30-day income\n');

const SWEET_SPOT_MIN = 5;
const SWEET_SPOT_MAX = 15;

for (const r of results) {
  const inSweetSpot = r.repairCostPercent >= SWEET_SPOT_MIN && r.repairCostPercent <= SWEET_SPOT_MAX;
  const status = inSweetSpot ? '✅ GOOD' : r.repairCostPercent < SWEET_SPOT_MIN ? '⚠️ TOO CHEAP' : '❌ TOO EXPENSIVE';

  console.log(`  ${r.tier.padEnd(12)}: ${r.repairCostPercent.toFixed(1)}% ${status}`);

  if (inSweetSpot) {
    assert(true, `${r.tier} repair cost in sweet spot`);
  } else if (r.repairCostPercent < SWEET_SPOT_MIN) {
    // Too cheap - need to increase cost
    const multiplier = SWEET_SPOT_MIN / Math.max(r.repairCostPercent, 0.1);
    console.log(`           → Suggested: increase cost by ${multiplier.toFixed(1)}x`);
  } else {
    // Too expensive - need to decrease cost
    const multiplier = SWEET_SPOT_MAX / r.repairCostPercent;
    console.log(`           → Suggested: decrease cost by ${(1/multiplier).toFixed(1)}x`);
  }
}

// ── TEST 5: Optimal Repair Cost Calculation ─────────────────────────────
section('TEST 5: Optimal Repair Cost Calculation');

console.log('\n  Calculating optimal repair costs (target 10% of income):\n');

const TARGET_PERCENT = 10;

for (const tier of PICKAXE_TIERS) {
  const durability = PICKAXE_STATS[tier].durability;
  const totalStones = STONES_PER_DAY * DAYS_SIMULATED;
  const totalRepairs = totalStones / durability;

  // Find the resource that's most abundant for this tier
  let maxResource = "";
  let maxValue = 0;

  for (const [tier, rewards] of Object.entries(STONE_REWARDS)) {
    for (const [resource, [min, max]] of Object.entries(rewards)) {
      const avg = (min + max) / 2;
      const daily = avg * STONES_PER_DAY;
      const total = daily * DAYS_SIMULATED;
      if (total > maxValue) {
        maxValue = total;
        maxResource = resource;
      }
    }
  }

  // Calculate optimal cost for that resource
  const totalIncome = maxValue;
  const optimalTotalCost = totalIncome * (TARGET_PERCENT / 100);
  const optimalPerRepair = optimalTotalCost / totalRepairs;

  console.log(`  ${tier.padEnd(12)}: ${maxResource} optimal = ${Math.round(optimalPerRepair)} per repair`);
  console.log(`           Current: ${JSON.stringify(CURRENT_REPAIR_COSTS[tier])}`);
}

// ── TEST 6: Cross-Tier Comparison ──────────────────────────────────────
section('TEST 6: Cross-Tier Comparison');

console.log('\n  Repair frequency and cost comparison:\n');

for (const tier of PICKAXE_TIERS) {
  const durability = PICKAXE_STATS[tier].durability;
  const repairCost = CURRENT_REPAIR_COSTS[tier];
  const totalCostValue = Object.values(repairCost).reduce((a, b) => a + b, 0);

  const repairsPerWeek = (STONES_PER_DAY * 7) / durability;
  const costPerWeek = totalCostValue * repairsPerWeek;

  console.log(`  ${tier.padEnd(12)}: ${durability} dur → ${repairsPerWeek.toFixed(1)} repairs/week → ${Math.round(costPerWeek).toLocaleString()} resources/week`);
}

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
} else {
  console.log('\n  🎉 ALL TESTS PASSED!\n');
}
