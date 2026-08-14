// SIMULASI MATEMATIKA SESUAI LOGIKA DI users.service.ts

function getUserVipRank(exp: number) {
    if (exp >= 500) return { name: 'SILVER', miningBoost: 0.10 };
    return { name: 'BRONZE', miningBoost: 0.0 };
}

function simulateMining(isBoosted: boolean, exp: number, hasDropVoucher: boolean) {
    const secondsToClaim = 7200; // 2 Jam full (100% matang)
    
    // Baris 347 (dari users.service.ts)
    const baseReward = isBoosted ? 5 : 2.5;
    let baseEarned = (baseReward / 7200) * secondsToClaim;

    const vipRank = getUserVipRank(exp);
    let totalBonusMultiplier = vipRank.miningBoost; 
    
    if (hasDropVoucher) {
        totalBonusMultiplier += 0.5; // +50%
    }

    const reward = baseEarned + (baseEarned * totalBonusMultiplier);
    
    return {
        baseEarned,
        vipRank: vipRank.name,
        vipBoost: vipRank.miningBoost * 100 + "%",
        dropVoucher: hasDropVoucher ? "Yes (+50%)" : "No (+0%)",
        totalMultiplier: totalBonusMultiplier * 100 + "%",
        finalReward: reward
    };
}

console.log("=== SIMULASI 1: VIP SILVER + DROP VOUCHER 50% (Skenario Pertama) ===");
const sim1 = simulateMining(true, 500, true);
console.log(sim1);

console.log("\n=== SIMULASI 2: HANYA VIP SILVER (TANPA DROP VOUCHER) ===");
const sim2 = simulateMining(true, 500, false);
console.log(sim2);
