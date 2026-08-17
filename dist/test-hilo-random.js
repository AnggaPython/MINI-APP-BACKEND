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
const telegramId = "RANDOM_PLAYER_888";
function runSim(i, multiplier) {
    const type = (i % 2 === 0) ? 'hi' : 'lo';
    const baseWinChance = 100 / multiplier;
    const thresholdHI = Math.floor(10000 - (baseWinChance * 100));
    const thresholdLO = Math.ceil(baseWinChance * 100);
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const clientSeed = `${telegramId}-${Date.now()}-${i}`;
    const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
    const rolledNumber = parseInt(hash.substring(0, 5), 16) % 10001;
    let isWin = false;
    if (type === 'hi' && rolledNumber >= thresholdHI)
        isWin = true;
    if (type === 'lo' && rolledNumber <= thresholdLO)
        isWin = true;
    return {
        type: type.toUpperCase(),
        multiplier,
        rolledNumber,
        isWin,
        baseWinChance
    };
}
const stats = {};
let totalWins = 0;
let totalLosses = 0;
console.log("=== SIMULASI 500 ROLL DENGAN MULTIPLIER ACAK (1.01x - 1.90x) ===");
for (let i = 0; i < 500; i++) {
    const randomMult = Number((Math.random() * (1.90 - 1.01) + 1.01).toFixed(2));
    const r = runSim(i, randomMult);
    const bracket = (Math.floor(randomMult * 10) / 10).toFixed(1) + "x - " + (Math.floor(randomMult * 10) / 10 + 0.09).toFixed(2) + "x";
    if (!stats[bracket]) {
        stats[bracket] = { total: 0, win: 0, loss: 0 };
    }
    stats[bracket].total++;
    if (r.isWin) {
        stats[bracket].win++;
        totalWins++;
    }
    else {
        stats[bracket].loss++;
        totalLosses++;
    }
    if (i < 15) {
        const rollFormatted = r.rolledNumber.toString().padStart(4, '0');
        const statusStr = r.isWin ? "✅ MENANG" : "❌ KALAH ";
        console.log(`Bet: ${r.type} pada [${r.multiplier.toFixed(2)}x] | Dadu: ${rollFormatted} | Peluang Murni: ${r.baseWinChance.toFixed(1)}% | Status: ${statusStr}`);
    }
}
console.log("\n-------------------------------------------------------");
console.log(`RINGKASAN TOTAL (500 TARUHAN BEBAS ACAK):`);
console.log(`Total Menang Keseluruhan : ${totalWins}`);
console.log(`Total Kalah Keseluruhan  : ${totalLosses} \n`);
console.log(`Rekapitulasi Berdasarkan Interval Multiplier:`);
const sortedKeys = Object.keys(stats).sort((a, b) => parseFloat(a) - parseFloat(b));
for (const key of sortedKeys) {
    const s = stats[key];
    const actualWinPct = ((s.win / s.total) * 100).toFixed(1);
    const midPoint = parseFloat(key) + 0.045;
    const expectedApprox = (100 / midPoint).toFixed(1);
    console.log(`Rentang ${key} | Total Main: ${s.total.toString().padStart(3, ' ')} | Menang: ${s.win.toString().padStart(3, ' ')} | Kalah: ${s.loss.toString().padStart(3, ' ')} | Win Rate Nyata: ~${actualWinPct}% (Teori Dasar Matematika: ~${expectedApprox}%)`);
}
//# sourceMappingURL=test-hilo-random.js.map