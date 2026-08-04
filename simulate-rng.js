const crypto = require('crypto');

function roll(betAmount, multiplier, type, history, balance) {
    let edge = 0.95; // Base 5% edge

    const lastBet = history.length > 0 ? history[history.length - 1] : null;

    // Rule 1: Martingale Slasher (Doubling after loss)
    // If the user lost their last bet and doubled up, they are trying to cheat the probability.
    if (lastBet && !lastBet.isWin && betAmount >= (lastBet.betAmount * 1.8)) {
        // Cut the win probability severely to induce a long RED streak
        edge = 0.40;
    }

    // Rule 2: Greedy Whale Penalty
    // If betting more than 20% of current wealth, induce a hard lose probability.
    if (betAmount > (balance * 0.20)) {
        edge = Math.min(edge, 0.45);
    }

    // Rule 3: High Multiplier Tax
    if (multiplier >= 10) edge = Math.min(edge, 0.75);
    if (multiplier >= 50) edge = Math.min(edge, 0.50);

    const winChance = (100 * edge) / multiplier;
    const thresholdHI = 10000 - (winChance * 100);
    const thresholdLO = winChance * 100;

    const rolledNumber = crypto.randomInt(0, 10001);

    let isWin = false;
    if (type === 'hi' && rolledNumber > thresholdHI) isWin = true;
    if (type === 'lo' && rolledNumber < thresholdLO) isWin = true;

    return isWin;
}

function runSimulation() {
    let balance = 20000;
    let baseBet = 100;
    let currentBet = baseBet;
    let multiplier = 2;
    let history = [];
    let maxBalance = balance;

    console.log(`==============================`);
    console.log(`Starting Balance: ${balance} ELIXIR`);
    console.log(`Strategy: MARTINGALE (x2 on Loss)`);
    console.log(`==============================`);

    for (let i = 1; i <= 100; i++) {
        if (balance < currentBet) {
            console.log(`\n❌ [BANKRUPT] User got completely drained at bet #${i}!`);
            console.log(`Required Bet: ${currentBet}, Balance Left: ${balance.toFixed(2)}`);
            break;
        }

        balance -= currentBet;
        let isWin = roll(currentBet, multiplier, 'hi', history, balance + currentBet);

        let previousBet = currentBet;
        if (isWin) {
            balance += (currentBet * multiplier);
            currentBet = baseBet; // Reset to base upon win
        } else {
            currentBet *= 2; // Double the bet upon loss (Martingale)
        }

        if (balance > maxBalance) maxBalance = balance;
        history.push({ betAmount: previousBet, isWin });

        // Console output to see the psychological wave
        const icon = isWin ? '🟢 WIN ' : '🔴 LOSE';
        console.log(`Roll ${i.toString().padStart(3, '0')} | ${icon} | Bet: ${previousBet.toString().padStart(5, ' ')} | Bal: ${balance.toFixed(2)}`);
    }

    console.log(`\n==============================`);
    console.log(`End Balance: ${balance.toFixed(2)} ELIXIR`);
    console.log(`Highest Peak: ${maxBalance.toFixed(2)} ELIXIR`);
    console.log(`==============================\n`);
}

runSimulation();
