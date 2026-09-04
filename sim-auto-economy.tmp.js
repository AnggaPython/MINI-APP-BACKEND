"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leveling_service_1 = require("./src/leveling-miner/leveling.service");
const miner_stone_service_1 = require("./src/miner-stone/miner-stone.service");
function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pickW = (r, entries) => {
    const tot = entries.reduce((s, [, w]) => s + w, 0);
    let x = r() * tot;
    for (const [k, w] of entries) {
        x -= w;
        if (x < 0)
            return k;
    }
    return entries[entries.length - 1][0];
};
const STONE_TIERS = [["Common", 85], ["Medium", 12], ["Rare", 3]];
const STONE_BANDS = {
    Common: { hp: [20, 45], drops: { IRON: [10, 100], COPPER: [5, 50] } },
    Medium: { hp: [40, 100], drops: { SILVER: [5, 40], GOLD: [1, 3] } },
    Rare: { hp: [60, 200], drops: { GOLD: [2, 10], DIAMOND: [1, 3] } },
};
const CASE_TIERS = [["COMMON", 70], ["MEDIUM", 25], ["RARE", 5]];
const CASE_HP = { COMMON: [80, 100], MEDIUM: [100, 130], RARE: [130, 200] };
const CASE_OUT = [["MATERIAL", 20], ["BUFF", 45], ["ZONK", 25], ["ELIXCOIN", 10]];
const CASE_ELIX = { COMMON: [1, 5], MEDIUM: [5, 15], RARE: [15, 40] };
const REPAIR = {
    Common0: { cost: { IRON: 100, COPPER: 50 }, maxDur: 25, power: 2 },
    Common20: { cost: { IRON: 100, COPPER: 50 }, maxDur: 55, power: 5.0 },
    Uncommon: { cost: { IRON: 150, COPPER: 80, SILVER: 20 }, maxDur: 50, power: 5 },
    Rare: { cost: { IRON: 120, COPPER: 60, SILVER: 60, GOLD: 5 }, maxDur: 75, power: 10 },
    Epic: { cost: { IRON: 100, COPPER: 50, SILVER: 80, GOLD: 10 }, maxDur: 100, power: 15 },
    Legendary: { cost: { IRON: 80, COPPER: 40, SILVER: 60, GOLD: 15, DIAMOND: 1 }, maxDur: 200, power: 30 },
    Mythic: { cost: { IRON: 60, COPPER: 30, SILVER: 50, GOLD: 20, DIAMOND: 3 }, maxDur: 400, power: 60 },
};
const R1 = 0.09674384;
const R2 = 1 / R1;
const FEE_DAY = 250000 / 30;
function simStone(r, power, lvl) {
    const hpM = (0, leveling_service_1.getHpMultiplier)(lvl), rwM = (0, leveling_service_1.getLevelMultiplier)(lvl);
    const tier = pickW(r, STONE_TIERS);
    const [h0, h1] = STONE_BANDS[tier].hp;
    const maxHp = Math.round((h0 + r() * (h1 - h0)) * hpM);
    const hits = Math.ceil(maxHp / power);
    let earn = 0;
    if (r() >= 0.1) {
        for (const [res, [a, b]] of Object.entries(STONE_BANDS[tier].drops)) {
            const lo = Math.round(a * rwM), hi = Math.round(b * rwM);
            earn += (lo + Math.floor(r() * (hi - lo + 1))) * (miner_stone_service_1.ELIX_RATES[res] || 0);
        }
    }
    return { earn, time: hits * 1.5 + 2, durUsed: 2, runs: 1 };
}
function simCase(r, power, lvl) {
    const hpM = (0, leveling_service_1.getHpMultiplier)(lvl), rwM = (0, leveling_service_1.getLevelMultiplier)(lvl);
    const tier = pickW(r, CASE_TIERS);
    const [h0, h1] = CASE_HP[tier];
    const maxHp = Math.round((h0 + r() * (h1 - h0)) * hpM);
    const hits = Math.ceil(maxHp / power);
    const out = pickW(r, CASE_OUT);
    let earn = 0;
    if (out === "ELIXCOIN") {
        const [a, b] = CASE_ELIX[tier];
        const lo = Math.round(a * rwM), hi = Math.round(b * rwM);
        earn = lo + Math.floor(r() * (hi - lo + 1));
    }
    return { earn, time: hits * 1.7 + 2, durUsed: 3, runs: 1 };
}
const repairPerPoint = (pick) => {
    const P = REPAIR[pick];
    let c = 0;
    for (const [k, v] of Object.entries(P.cost))
        c += v * (miner_stone_service_1.ELIX_RATES[k] || 0);
    return c / P.maxDur;
};
const LVL = 30, N = 20000;
function scenario(pick, atk, target, seed) {
    const r = rng(seed);
    const power = REPAIR[pick].power + atk;
    const rp = repairPerPoint(pick);
    let earn = 0, time = 0, dur = 0, n = 0;
    for (let i = 0; i < N; i++) {
        let a;
        if (target === "stone")
            a = simStone(r, power, LVL);
        else if (target === "casebox")
            a = simCase(r, power, LVL);
        else
            a = i % 2 === 0 ? simStone(r, power, LVL) : simCase(r, power, LVL);
        earn += a.earn;
        time += a.time;
        dur += a.durUsed;
        n++;
    }
    const perRun = { earn: earn / n, time: time / n, dur: dur / n };
    const fitRuns = Math.min(500, Math.floor(86400 / perRun.time));
    const repFull = perRun.dur * rp;
    const gross = perRun.earn * fitRuns;
    const row = (relief) => {
        const repCost = repFull * fitRuns * (1 - relief);
        const net = gross - repCost;
        const el = (v, rate) => v * rate;
        const roi = (rate) => ((el(net, rate) - FEE_DAY) / FEE_DAY) * 100;
        return { relief, runs: fitRuns, grossEC: gross, repEC: repCost, netEC: net, roiR1: roi(R1), roiR2: roi(R2) };
    };
    return { pick, atk, target, perRun, full: row(0), half: row(0.5), none: { ...row(1), repEC: 0 } };
}
const f2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
console.log(`Level=${LVL} hpMult=${(0, leveling_service_1.getHpMultiplier)(LVL)} rwMult=${(0, leveling_service_1.getLevelMultiplier)(LVL)} fee/day=${Math.round(FEE_DAY)} ELIXIR, N=${N}/scenario`);
const picks = ["Common0", "Common20", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
for (const p of picks) {
    const s = scenario(p, 0, "stone", 1000 + picks.indexOf(p));
    console.log(`STONE ${p} atk0 | t/run=${f2(s.perRun.time)}s fit500=${s.full.runs} | earn/run=${f2(s.perRun.earn)}EC | gross/d=${f2(s.full.grossEC)}EC | rep/d=${f2(s.full.repEC)}EC | ` +
        `netNoRep=${f2(s.none.netEC)} ROI_R1=${f2(s.none.roiR1)}% ROI_R2=${f2(s.none.roiR2)}% | netFullRep=${f2(s.full.netEC)} ROI_R1=${f2(s.full.roiR1)}% | net50%=${f2(s.half.netEC)} ROI_R1=${f2(s.half.roiR1)}%`);
}
for (const p of picks) {
    const s = scenario(p, 0, "casebox", 2000 + picks.indexOf(p));
    console.log(`CASE  ${p} atk0 | t/run=${f2(s.perRun.time)}s fit500=${s.full.runs} | earn/run=${f2(s.perRun.earn)}EC | gross/d=${f2(s.full.grossEC)}EC | rep/d=${f2(s.full.repEC)}EC | ` +
        `netNoRep=${f2(s.none.netEC)} ROI_R1=${f2(s.none.roiR1)}% ROI_R2=${f2(s.none.roiR2)}% | netFullRep=${f2(s.full.netEC)} ROI_R1=${f2(s.full.roiR1)}%`);
}
for (const [p, atk] of [["Common0", 0], ["Common0", 10], ["Rare", 0], ["Rare", 10], ["Rare", 30], ["Mythic", 0], ["Mythic", 30]]) {
    const s = scenario(p, atk, "stone", 3000 + atk);
    console.log(`BUFF stone ${p} atk+${atk} | t/run=${f2(s.perRun.time)}s fit=${s.full.runs} gross/d=${f2(s.full.grossEC)}EC netNoRep ROI_R1=${f2(s.none.roiR1)}%`);
}
for (const p of ["Rare", "Mythic"]) {
    const s = scenario(p, 10, "split", 4000);
    console.log(`SPLIT ${p} atk10 | t/run=${f2(s.perRun.time)}s fit=${s.full.runs} gross/d=${f2(s.full.grossEC)}EC netNoRep ROI_R1=${f2(s.none.roiR1)}% ROI_R2=${f2(s.none.roiR2)}%`);
}
//# sourceMappingURL=sim-auto-economy.tmp.js.map