"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const telegramId = "TEST_USER_100x";
function runSim(i, multiplier) {
    const type = 'hi';
    const baseWinChance = (100 / multiplier) * 0.90;
    const thresholdHI = Math.floor(10000 - (baseWinChance * 100));
    const thresholdLO = Math.ceil(baseWinChance * 100);
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const clientSeed = `${telegramId}-${Date.now()}-${i}`;
    const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
    const rolledNumber = parseInt(hash.substring(0, 5), 16) % 10001;
    let isWin = false;
    if (rolledNumber >= thresholdHI)
        isWin = true;
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
    if (round <= 5 || round % 25 === 0) {
        process.stdout.write(`Putaran ${round.toString().padStart(3, ' ')} | Dadu: ${r.rolledNumber.toString().padStart(4, '0')} | ❌ KALAH (Di bawah target ${testChance.thresholdHI})\n`);
    }
    round++;
    if (round > 2000) {
        console.log(`\nKelewat batas simulasi 2000 putaran, sedang sangat tidak hoki.`);
        break;
    }
}
//# sourceMappingURL=test-hilo.js.map