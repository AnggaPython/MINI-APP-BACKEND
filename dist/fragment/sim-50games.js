"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function random() { return Math.random(); }
function weightedPick(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let roll = random() * total;
    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0)
            return item;
    }
    return items[items.length - 1];
}
const SPIN_REWARDS = [
    { weight: 300, type: "IRON", amount: 50, goldEquiv: 0.25 },
    { weight: 550, type: "COPPER", amount: 30, goldEquiv: 0.30 },
    { weight: 700, type: "SILVER", amount: 10, goldEquiv: 1.00 },
    { weight: 820, type: "GOLD", amount: 3, goldEquiv: 3.00 },
    { weight: 900, type: "DIAMOND", amount: 1, goldEquiv: 10.00 },
    { weight: 950, type: "ELIX", amount: 10, goldEquiv: 0.10 },
    { weight: 980, type: "ELIX", amount: 50, goldEquiv: 0.50 },
    { weight: 995, type: "GOLD", amount: 10, goldEquiv: 10.00 },
    { weight: 1000, type: "DIAMOND", amount: 5, goldEquiv: 50.00 },
];
const MINE_BOARD = 5;
const MINE_COUNT = 5;
const MINE_REWARD_PER_TILE = 2;
console.log("═".repeat(60));
console.log("  50 GAMES SIMULATION");
console.log("═".repeat(60));
console.log("\n🎰 50 SPIN WHEELS (5000 fragments = 50 tickets)");
console.log("─".repeat(50));
const spinRewards = {};
let spinTotalGold = 0;
let spinTotalValue = 0;
for (let i = 0; i < 50; i++) {
    const roll = random() * 1000;
    let selected = SPIN_REWARDS[0];
    for (const entry of SPIN_REWARDS) {
        if (roll < entry.weight) {
            selected = entry;
            break;
        }
    }
    spinRewards[selected.type] = (spinRewards[selected.type] || 0) + selected.amount;
    if (selected.type === "GOLD")
        spinTotalGold += selected.amount;
    spinTotalValue += selected.goldEquiv;
}
console.log("  Reward breakdown (50 spins):");
for (const [type, amount] of Object.entries(spinRewards)) {
    console.log(`    ${type}: ${amount}`);
}
console.log(`  ─────────────────────────────`);
console.log(`  GOLD langsung:     ${spinTotalGold}`);
console.log(`  Est. total value:  ~${spinTotalValue.toFixed(1)} GOLD equiv`);
console.log(`\n💣 50 MINE SWIPE GAMES (5000 fragments = 50 tickets)`);
console.log("─".repeat(50));
const totalTiles = MINE_BOARD * MINE_BOARD;
const totalSafe = totalTiles - MINE_COUNT;
let gamesWon = 0;
let gamesLost = 0;
let totalMineReward = 0;
let totalTilesRevealed = 0;
const rewardDistribution = {};
for (let i = 0; i < 50; i++) {
    const mines = new Set();
    while (mines.size < MINE_COUNT) {
        mines.add(Math.floor(random() * totalTiles));
    }
    const targetReveals = 2 + Math.floor(random() * 5);
    const revealed = new Set();
    let hitMine = false;
    let reward = 0;
    for (let t = 0; t < targetReveals; t++) {
        let pos;
        let attempts = 0;
        do {
            pos = Math.floor(random() * totalTiles);
            attempts++;
        } while (revealed.has(pos) && attempts < 50);
        if (revealed.has(pos))
            break;
        if (mines.has(pos)) {
            hitMine = true;
            break;
        }
        revealed.add(pos);
        reward += MINE_REWARD_PER_TILE;
    }
    totalTilesRevealed += revealed.size;
    if (hitMine) {
        gamesLost++;
    }
    else {
        gamesWon++;
        totalMineReward += reward;
        const bracket = reward <= 4 ? "1-4" : reward <= 8 ? "5-8" : reward <= 12 ? "9-12" : "13+";
        rewardDistribution[bracket] = (rewardDistribution[bracket] || 0) + 1;
    }
}
console.log(`  Games won:   ${gamesWon}/50 (${(gamesWon / 50 * 100).toFixed(0)}%)`);
console.log(`  Games lost:  ${gamesLost}/50 (${(gamesLost / 50 * 100).toFixed(0)}%)`);
console.log(`  ─────────────────────────────`);
console.log(`  Total ELIXCOIN earned: ${totalMineReward}`);
console.log(`  Avg ELIXCOIN per game: ${(totalMineReward / 50).toFixed(1)}`);
console.log(`  Avg tiles/game:        ${(totalTilesRevealed / 50).toFixed(1)}`);
console.log(`  Reward distribution:`);
for (const [bracket, count] of Object.entries(rewardDistribution).sort()) {
    console.log(`    ${bracket} ELIX: ${count} games`);
}
console.log(`\n${"═".repeat(60)}`);
console.log("  TOTAL EARNINGS (50 spins + 50 mine games)");
console.log("═".repeat(60));
console.log(`  GOLD (from spin):     ${spinTotalGold}`);
console.log(`  IRON (from spin):     ${spinRewards.IRON || 0}`);
console.log(`  COPPER (from spin):   ${spinRewards.COPPER || 0}`);
console.log(`  SILVER (from spin):   ${spinRewards.SILVER || 0}`);
console.log(`  DIAMOND (from spin):  ${spinRewards.DIAMOND || 0}`);
console.log(`  ELIXCOIN (from spin): ${spinRewards.ELIX || 0}`);
console.log(`  ELIXCOIN (from mine): ${totalMineReward}`);
console.log(`  ─────────────────────────────`);
console.log(`  Total ELIXCOIN: ${(spinRewards.ELIX || 0) + totalMineReward}`);
console.log(`  Fragments used: 5,000 (2500 spin + 2500 mine)`);
console.log(`  Stones needed:  ~2,900 stones (avg 3.4 frag/stone)`);
console.log("═".repeat(60));
const avgSpinFragsPerStone = 2.4;
const avgMineFragsPerStone = 1.1;
const stonesFor50Spins = Math.ceil(2500 / avgSpinFragsPerStone);
const stonesFor50Mine = Math.ceil(2500 / avgMineFragsPerStone);
console.log(`\n  Est. stones needed for 50 spins: ~${stonesFor50Spins}`);
console.log(`  Est. stones needed for 50 mines: ~${stonesFor50Mine}`);
console.log(`  (With Mythic pick Lv100, ~6 hits/stone × 1.5s = 9s/stone)`);
console.log(`  Time estimate: ~${((stonesFor50Spins + stonesFor50Mine) * 9 / 3600).toFixed(1)} hours of active mining`);
console.log("═".repeat(60));
//# sourceMappingURL=sim-50games.js.map