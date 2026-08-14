import * as crypto from 'crypto';

const telegramId = "TEST_USER_100x";
function runSim(i: number, multiplier: number) {
    const type = 'hi';
    const baseWinChance = (100 / multiplier) * 0.90;
    const thresholdHI = Math.floor(10000 - (baseWinChance * 100));
    const thresholdLO = Math.ceil(baseWinChance * 100);
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const clientSeed = `${telegramId}-${Date.now()}-${i}`;
    const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
    const rolledNumber = parseInt(hash.substring(0, 5), 16) % 10001;
    let isWin = false;
    if (rolledNumber >= thresholdHI) isWin = true;
    return { rolledNumber, isWin, baseWinChance, thresholdHI };
}

console.log("=== SIMULASI MENGEJAR 100x MULTIPLIER ===");
const betAmount = 100;
const multiplier = 100;

console.log(`Taruhan per putaran : ${betAmount} ELIXIR`);
console.log(`Target Multiplier   : ${multiplier}x`);
const testChance = runSim(0, multiplier);
console.log(`Peluang Menang      : ${testChance.baseWinChance.toFixed(3)}%`);
console.log(`Target Angka        : Angka harus lebih besar atau sama dengan >= ${testChance.thresholdHI} (Dari total 10.000)\n`);

let round = 1;
let totalCost = 0;

while (true) {
    totalCost += betAmount;
    const r = runSim(round, multiplier);

    if (r.isWin) {
        const totalWin = betAmount * multiplier;
        const netProfitStr = (totalWin - totalCost) >= 0 ? `+${totalWin - totalCost}` : `${totalWin - totalCost}`;

        console.log(`\n🚨 JACKPOT! MENANG pada Putaran ke-${round}! 🚨`);
        console.log(`Dadu Keluar       : ${r.rolledNumber}`);
        console.log(`Total Modal Habis : ${totalCost} ELIXIR`);
        console.log(`Total Hadiah      : ${totalWin} ELIXIR`);
        console.log(`Net Profit Akhir  : ${netProfitStr} ELIXIR`);
        break;
    }

    // Cetak log untuk putaran awal atau setiap lompatan 25 agar tidak banjir teks
    if (round <= 5 || round % 25 === 0) {
        process.stdout.write(`Putaran ${round.toString().padStart(3, ' ')} | Dadu: ${r.rolledNumber.toString().padStart(4, '0')} | ❌ KALAH (Di bawah target ${testChance.thresholdHI})\n`);
    }

    round++;

    if (round > 2000) {
        console.log(`\nKelewat batas simulasi 2000 putaran, sedang sangat tidak hoki.`);
        break;
    }
}
