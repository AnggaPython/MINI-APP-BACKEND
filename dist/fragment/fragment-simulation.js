"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FRAGMENT_DROP_RATES = {
    Common: { spinWheel: 0.40, mineSwipe: 0.35 },
    Medium: { spinWheel: 0.60, mineSwipe: 0.55 },
    Rare: { spinWheel: 0.80, mineSwipe: 0.75 },
};
const FRAGMENT_DROP_MIN = 1;
const FRAGMENT_DROP_MAX = 5;
const STONE_TIERS = [
    { tier: "Common", weight: 85 },
    { tier: "Medium", weight: 12 },
    { tier: "Rare", weight: 3 },
];
const SPIN_REWARDS = [
    { weight: 300, type: "IRON", amount: 50, goldValue: 0.25 },
    { weight: 550, type: "COPPER", amount: 30, goldValue: 0.30 },
    { weight: 700, type: "SILVER", amount: 10, goldValue: 1.00 },
    { weight: 820, type: "GOLD", amount: 3, goldValue: 3.00 },
    { weight: 900, type: "DIAMOND", amount: 1, goldValue: 10.00 },
    { weight: 950, type: "ELIXCOIN", amount: 10, goldValue: 0.10 },
    { weight: 980, type: "ELIXCOIN", amount: 50, goldValue: 0.50 },
    { weight: 995, type: "GOLD", amount: 10, goldValue: 10.00 },
    { weight: 1000, type: "DIAMOND", amount: 5, goldValue: 50.00 },
];
const MINE_BOARD_SIZE = 5;
const MINE_COUNT = 5;
const MINE_BASE_REWARD_PER_TILE = 2;
function random() {
    return Math.random();
}
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
function randomDropAmount() {
    return FRAGMENT_DROP_MIN + Math.floor(random() * (FRAGMENT_DROP_MAX - FRAGMENT_DROP_MIN + 1));
}
function simulateStoneDrops(numStones) {
    let totalSpinFragments = 0;
    let totalMineFragments = 0;
    const tierCounts = {};
    for (let i = 0; i < numStones; i++) {
        const tierEntry = weightedPick(STONE_TIERS);
        const tier = tierEntry.tier;
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        const rates = FRAGMENT_DROP_RATES[tier];
        const spinHit = random() < rates.spinWheel;
        const mineHit = random() < rates.mineSwipe;
        let spinDrop = 0;
        let mineDrop = 0;
        if (spinHit)
            spinDrop = randomDropAmount();
        if (mineHit)
            mineDrop = randomDropAmount();
        if (spinDrop === 0 && mineDrop === 0) {
            if (rates.spinWheel >= rates.mineSwipe) {
                spinDrop = randomDropAmount();
            }
            else {
                mineDrop = randomDropAmount();
            }
        }
        totalSpinFragments += spinDrop;
        totalMineFragments += mineDrop;
    }
    return { totalSpinFragments, totalMineFragments, tierCounts };
}
function simulateSpinWheel(numSpins) {
    let totalGold = 0;
    let totalIron = 0;
    let totalCopper = 0;
    let totalSilver = 0;
    let totalDiamond = 0;
    let totalElix = 0;
    let zonkCount = 0;
    const rewards = {};
    for (let i = 0; i < numSpins; i++) {
        const roll = random() * 1000;
        let selected = SPIN_REWARDS[0];
        for (const entry of SPIN_REWARDS) {
            if (roll < entry.weight) {
                selected = entry;
                break;
            }
        }
        rewards[selected.type] = (rewards[selected.type] || 0) + selected.amount;
        totalGold += selected.goldValue;
        if (selected.type === "IRON")
            totalIron += selected.amount;
        else if (selected.type === "COPPER")
            totalCopper += selected.amount;
        else if (selected.type === "SILVER")
            totalSilver += selected.amount;
        else if (selected.type === "GOLD")
            totalGold += selected.amount;
        else if (selected.type === "DIAMOND")
            totalDiamond += selected.amount;
        else if (selected.type === "ELIXCOIN")
            totalElix += selected.amount;
    }
    return { totalGold, totalIron, totalCopper, totalSilver, totalDiamond, totalElix, zonkCount, rewards };
}
function simulateMineSwipe(numGames) {
    let totalGamesPlayed = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;
    let totalReward = 0;
    let totalTilesRevealed = 0;
    const totalTiles = MINE_BOARD_SIZE * MINE_BOARD_SIZE;
    const totalSafe = totalTiles - MINE_COUNT;
    for (let i = 0; i < numGames; i++) {
        totalGamesPlayed++;
        const mines = new Set();
        while (mines.size < MINE_COUNT) {
            const pos = Math.floor(random() * totalTiles);
            const row = Math.floor(pos / MINE_BOARD_SIZE);
            const col = pos % MINE_BOARD_SIZE;
            mines.add(`${row},${col}`);
        }
        const revealed = new Set();
        let hitMine = false;
        let reward = 0;
        const targetReveals = 1 + Math.floor(random() * Math.min(7, totalSafe));
        for (let t = 0; t < targetReveals; t++) {
            let pos;
            let attempts = 0;
            do {
                const p = Math.floor(random() * totalTiles);
                const r = Math.floor(p / MINE_BOARD_SIZE);
                const c = p % MINE_BOARD_SIZE;
                pos = `${r},${c}`;
                attempts++;
            } while (revealed.has(pos) && attempts < 50);
            if (revealed.has(pos))
                break;
            if (mines.has(pos)) {
                hitMine = true;
                break;
            }
            revealed.add(pos);
            reward += MINE_BASE_REWARD_PER_TILE;
        }
        totalTilesRevealed += revealed.size;
        if (hitMine) {
            totalGamesLost++;
        }
        else {
            totalGamesWon++;
            totalReward += reward;
        }
    }
    return {
        totalGamesPlayed,
        totalGamesWon,
        totalGamesLost,
        totalReward,
        avgRewardPerGame: totalReward / numGames,
        avgTilesRevealed: totalTilesRevealed / numGames,
        winRate: (totalGamesWon / numGames) * 100,
    };
}
console.log("═".repeat(60));
console.log("  FRAGMENT ECONOMY SIMULATION");
console.log("═".repeat(60));
const NUM_STONES = 200;
console.log(`\n📊 PHASE 1: Destroy ${NUM_STONES} stones`);
console.log("─".repeat(40));
const drops = simulateStoneDrops(NUM_STONES);
console.log(`  Stone tiers: Common ${drops.tierCounts.Common || 0} · Medium ${drops.tierCounts.Medium || 0} · Rare ${drops.tierCounts.Rare || 0}`);
console.log(`  Spin Wheel fragments: ${drops.totalSpinFragments}`);
console.log(`  Mine Swipe fragments: ${drops.totalMineFragments}`);
console.log(`  Total fragments: ${drops.totalSpinFragments + drops.totalMineFragments}`);
console.log(`  Avg fragments/stone: ${((drops.totalSpinFragments + drops.totalMineFragments) / NUM_STONES).toFixed(1)}`);
const NUM_SPINS = Math.floor(drops.totalSpinFragments / 100);
const NUM_MINE_GAMES = Math.floor(drops.totalMineFragments / 100);
console.log(`\n🎰 PHASE 2: Play ${NUM_SPINS} Spin Wheels (${drops.totalSpinFragments} fragments ÷ 100)`);
console.log("─".repeat(40));
const spinResults = simulateSpinWheel(NUM_SPINS);
console.log(`  Rewards breakdown:`);
for (const [type, amount] of Object.entries(spinResults.rewards)) {
    console.log(`    ${type}: ${amount}`);
}
console.log(`  Estimated GOLD value: ${spinResults.totalGold.toFixed(2)}`);
console.log(`\n💣 PHASE 3: Play ${NUM_MINE_GAMES} Mine Swipe games (${drops.totalMineFragments} fragments ÷ 100)`);
console.log("─".repeat(40));
const mineResults = simulateMineSwipe(NUM_MINE_GAMES);
console.log(`  Games played: ${mineResults.totalGamesPlayed}`);
console.log(`  Won: ${mineResults.totalGamesWon} (${mineResults.winRate.toFixed(1)}%)`);
console.log(`  Lost: ${mineResults.totalGamesLost}`);
console.log(`  Total ELIXCOIN earned: ${mineResults.totalReward.toFixed(1)}`);
console.log(`  Avg ELIXCOIN per game: ${mineResults.avgRewardPerGame.toFixed(1)}`);
console.log(`  Avg tiles revealed per game: ${mineResults.avgTilesRevealed.toFixed(1)}`);
console.log(`\n${"═".repeat(60)}`);
console.log("  SUMMARY");
console.log("═".repeat(60));
console.log(`  Stones destroyed:    ${NUM_STONES}`);
console.log(`  Spin Wheel plays:    ${NUM_SPINS}`);
console.log(`  Mine Swipe plays:    ${NUM_MINE_GAMES}`);
console.log(`  GOLD earned (spin):  ${spinResults.totalGold.toFixed(2)}`);
console.log(`  ELIXCOIN earned:     ${mineResults.totalReward.toFixed(1)}`);
console.log(`  IRON earned:         ${spinResults.totalIron}`);
console.log(`  COPPER earned:       ${spinResults.totalCopper}`);
console.log(`  SILVER earned:       ${spinResults.totalSilver}`);
console.log(`  DIAMOND earned:      ${spinResults.totalDiamond}`);
console.log("═".repeat(60));
console.log(`\n📈 AVERAGE OVER 10 SIMULATIONS (${NUM_STONES} stones each):`);
console.log("─".repeat(40));
let avgSpinFrags = 0, avgMineFrags = 0, avgSpins = 0, avgGames = 0;
let avgGold = 0, avgElix = 0;
for (let sim = 0; sim < 10; sim++) {
    const d = simulateStoneDrops(NUM_STONES);
    avgSpinFrags += d.totalSpinFragments;
    avgMineFrags += d.totalMineFragments;
    const s = simulateSpinWheel(Math.floor(d.totalSpinFragments / 100));
    const m = simulateMineSwipe(Math.floor(d.totalMineFragments / 100));
    avgSpins += Math.floor(d.totalSpinFragments / 100);
    avgGames += Math.floor(d.totalMineFragments / 100);
    avgGold += s.totalGold;
    avgElix += m.totalReward;
}
console.log(`  Avg Spin fragments:  ${(avgSpinFrags / 10).toFixed(0)}`);
console.log(`  Avg Mine fragments:  ${(avgMineFrags / 10).toFixed(0)}`);
console.log(`  Avg Spin plays:      ${(avgSpins / 10).toFixed(0)}`);
console.log(`  Avg Mine games:      ${(avgGames / 10).toFixed(0)}`);
console.log(`  Avg GOLD earned:     ${(avgGold / 10).toFixed(2)}`);
console.log(`  Avg ELIXCOIN earned: ${(avgElix / 10).toFixed(1)}`);
console.log("═".repeat(60));
//# sourceMappingURL=fragment-simulation.js.map