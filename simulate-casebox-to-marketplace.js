#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SIMULASI: CASE BOX → MARKETPLACE / TRADE SPOT SELL
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Alur:
 *   1. User buka case box → dapat material tools / buff items / ELIXCOIN / ZONK
 *   2. Item bisa dijual di:
 *      a. Marketplace (fixed sellPrice per item)
 *      b. Trade Spot (ITEM/ELIXCOIN pairs — market price)
 *   3. Bandingkan semua path: Marketplace sell vs Trade Spot sell vs keep for buff
 */

// ═══════════════════════════════════════════════════════════════════════
//  CASE BOX CONFIG (mirrors server-authoritative case-box.service.ts)
// ═══════════════════════════════════════════════════════════════════════

const CASE_TIER_WEIGHTS = { COMMON: 70, MEDIUM: 25, RARE: 5 };

// Layer 1 — outcome weights
const OUTCOME_WEIGHTS = { MATERIAL: 20, BUFF: 45, ZONK: 25, ELIXCOIN: 10 };

// Layer 2 — material rarity weights
const LOOT_RARITY_WEIGHTS = { COMMON: 70, MEDIUM: 22, RARE: 8 };

// Layer 2b — buff rarity weights
const BUFF_RARITY_WEIGHTS = { COMMON: 60, MEDIUM: 15, RARE: 5, ULTRA_RARE: 0.5 };

// ELIXCOIN reward bands per case tier
const ELIXCOIN_BANDS = { COMMON: [1, 5], MEDIUM: [5, 15], RARE: [15, 40] };

// ─── Material Tools (75 items) ────────────────────────────────────────
const CASE_MATERIALS = {
  COMMON: [
    "Rusty Nail", "Wooden Handle", "Iron Shard", "Copper Wire", "Flint Stone",
    "Hemp Rope", "Leather Strap", "Clay Mold", "Tin Plate", "Bone Fragment",
    "Sandstone Grit", "Charcoal Lump", "Glass Shard", "Rubber Grip", "Brass Rivet",
    "Canvas Wrap", "Iron Bolt", "Slate Chip", "Twine Coil", "Wax Seal",
    "Stone Wheel", "Bronze Pin", "Ash Plank", "Cloth Strip", "Pig Iron Ingot",
  ],
  MEDIUM: [
    "Steel Alloy", "Silver Filament", "Copper Coil", "Magnet Core", "Quartz Crystal",
    "Reinforced Spring", "Tempered Glass", "Gold Plating", "Titanium Screw", "Carbon Fiber",
    "Enchanted Rune", "Sapphire Lens", "Power Cell", "Hydraulic Pump", "Servo Motor",
    "Platinum Wire", "Crystal Gear", "Obsidian Blade", "Neon Capacitor", "Phantom Core",
    "Emerald Driver", "Chrono Spring", "Plasma Coil", "Arcane Alloy", "Magnetic Array",
  ],
  RARE: [
    "Void Diamond", "Phoenix Feather", "Dragon Scale", "Celestial Core", "Quantum Shard",
    "Starforged Ingot", "Infinity Crystal", "Thunder Essence", "Abyss Pearl", "Solar Fragment",
    "Lunar Prism", "Chaos Ember", "Titan Heart", "Etherium Wire", "Rift Anchor",
    "Frost Nova Core", "Pyroclasm Gem", "Nebula Dust", "Singularity Bolt", "Godslayer Alloy",
    "Timeless Gear", "Dimension Key", "Eternity Matrix", "Primordial Ore", "Omega Circuit",
  ],
};

// ─── Marketplace Sell Prices (from marketplace.service.ts) ────────────
const MATERIAL_SELL_PRICE = { COMMON: 50, MEDIUM: 500, RARE: 5000 };

// ─── Trade Spot Item/ELIXCOIN pair prices (from MINERAL_INITIAL_RATES) ──
// These are the mid prices in the order book
const TRADE_SPOT_ITEM_PRICES = {};
// COMMON materials: 50 ELIX
for (const name of CASE_MATERIALS.COMMON) {
  const key = name.toUpperCase().replace(/ /g, "-");
  TRADE_SPOT_ITEM_PRICES[key] = 50;
}
// MEDIUM materials: 500 ELIX
for (const name of CASE_MATERIALS.MEDIUM) {
  const key = name.toUpperCase().replace(/ /g, "-");
  TRADE_SPOT_ITEM_PRICES[key] = 500;
}
// RARE materials: 5000 ELIX
for (const name of CASE_MATERIALS.RARE) {
  const key = name.toUpperCase().replace(/ /g, "-");
  TRADE_SPOT_ITEM_PRICES[key] = 5000;
}

// ─── Buff Items (160 items with marketplace sell prices) ───────────────
// Sell price = buffValue × rarityMultiplier
const BUFF_SELL_PRICES = {
  // COMMON buff items: sellPrice varies 40-240 ELIX
  "roman-coin": 40, "inca-gold": 60, "iron-coin": 80, "tartar-bow": 100,
  "celtic-torc": 120, "bronze-bull": 140, "eagle-figure": 160, "small-dragon": 180,
  "wolf-figure": 220, "bear-statue": 240,
  "sumerian-tablet": 40, "mayan-disk": 60, "chinese-seal": 80, "persian-astro": 100,
  "babylon-seal": 120, "mini-scarab": 140, "mini-sun-disk": 160, "brass-lamp": 180,
  "wooden-box": 220, "metal-tin": 240,
  "clay-pot": 40, "blue-ceramic": 60, "white-porcelain": 80, "roman-pottery": 100,
  "batik-vase": 120, "sakura-vase": 140, "celadon-vase": 160, "majolica-vase": 180,
  "raku-pottery": 220, "sancai-vase": 240,
  "viking-compass": 40, "greek-figure": 60, "dream-rock": 80, "norse-rune": 100,
  "korean-cup": 120, "ancient-chakra": 140, "tiki-figure": 160, "small-buddha": 180,
  "bastet-cat": 220, "peacock-figure": 240,
  // MEDIUM buff items: sellPrice varies 714-1999 ELIX
  "greek-god": 714, "golden-garuda": 857, "marble-lion": 999, "knight-statue": 1142,
  "samurai-armor": 1285, "dragon-lid": 1428, "ming-vase": 1570, "cloisonne": 1713,
  "pharaoh-ring": 1856, "gem-brooch": 1999,
  "kings-crown": 714, "queens-tiara": 857, "pearl-necklace": 999, "silver-bracelet": 1142,
  "moon-pendant": 1285, "jade-earrings": 1428, "star-diadem": 1570, "moon-circlet": 1713,
  "jade-vase": 1856, "jeweled-vase": 1999,
  "goddess-lakshmi": 1142, "quartz-crystal": 1428, "ruby-stone": 1570,
  "sapphire-stone": 1713, "emerald-stone": 1856, "amethyst-crystal": 1999,
  "spell-book": 714, "treasure-map": 857, "royal-decree": 999, "ancient-codex": 1142,
  "buddhist-sutra": 1285, "mayan-codex": 1428, "ancient-atlas": 1570,
  "prophecy-book": 1713, "star-chart": 1856, "egypt-papyrus": 1999,
  // RARE buff items: sellPrice varies 12499-19998 ELIX
  "excalibur": 12499, "javanese-keris": 13332, "poseidon-trident": 14165,
  "thors-hammer": 14999, "artemis-bow": 15832, "shadow-blade": 16665,
  "aegis-shield": 17498, "katana": 18332, "dragon-keris": 19165, "guard-halberd": 19998,
  "gem-chest": 12499, "crystal-chest": 13332, "mystery-chest": 14165,
  "eternal-chest": 14999, "sky-chest": 15832, "dragon-map": 16665,
  "dragon-letter": 17498, "dragon-tome": 18332, "dragon-compass": 19165, "dragon-seal": 19998,
  "dragon-orb": 12499, "dragon-chest": 13332, "hellfire-chest": 14165,
  // ULTRA_RARE buff items: sellPrice varies 45456-250008 ELIX
  "emperor-crown": 45456, "solomon-ring": 68184, "ras-necklace": 90912,
  "caduceus": 113640, "dragon-orb": 136368, "dragon-chest": 159096,
  "hellfire-chest": 181824, "divine-chest": 204552, "multiverse-chest": 227280,
  "kings-gold-chest": 250008,
  "meissen-porcelain": 45456, "wedgwood-jasper": 68184, "millefiori": 90912,
  "greek-amphora": 113640, "cubist-vase": 136368, "globe-vase": 159096,
  "golden-pharaoh": 181824, "jade-dragon": 204552, "phoenix-statue": 227280,
  "jade-tortoise": 250008,
  "topaz-stone": 45456, "opal-stone": 68184, "lapis-lazuli": 90912,
  "garnet-stone": 113640, "aquamarine": 136368,
};

// Trade Spot prices for buff items (ITEM/ELIXCOIN mid)
const TRADE_SPOT_BUFF_PRICES = {};
for (const [id, price] of Object.entries(BUFF_SELL_PRICES)) {
  const key = id.toUpperCase().replace(/-/g, "-");
  TRADE_SPOT_BUFF_PRICES[key] = price;
}

// ─── Trade Spot fee & spread ──────────────────────────────────────────
const TRADE_FEE = 0.015;    // 1.5%
const SPREAD_PCT = 0.004;   // 0.4% spread

// ═══════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════
const rnd = () => Math.random();
const W = 76;

function weightedPick(roll, weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let acc = 0;
  for (const [key, w] of Object.entries(weights)) {
    acc += w;
    if (roll < acc / total) return key;
  }
  return Object.keys(weights).pop();
}

function hdr(text) { console.log(`\n${'═'.repeat(W)}\n  ${text}\n${'═'.repeat(W)}`); }
function subhdr(text) { console.log(`\n  ${'─'.repeat(W - 4)}\n  ${text}\n  ${'─'.repeat(W - 4)}`); }

// ═══════════════════════════════════════════════════════════════════════
//  SIMULATION
// ═══════════════════════════════════════════════════════════════════════
function simulateCaseBox() {
  // Layer 1: outcome
  const outcomeRoll = rnd();
  const outcome = weightedPick(outcomeRoll, OUTCOME_WEIGHTS);

  let rarity = null;
  let itemName = null;
  let itemType = null;
  let elixAmount = 0;

  if (outcome === "ZONK") {
    return { outcome, rarity: null, itemName: null, itemType: null, elixAmount: 0, sellPrice: 0, tradeSpotPrice: 0 };
  }

  if (outcome === "ELIXCOIN") {
    // Random case tier for ELIX band
    const tierRoll = rnd() * 100;
    const tier = tierRoll < 70 ? "COMMON" : tierRoll < 95 ? "MEDIUM" : "RARE";
    const [min, max] = ELIXCOIN_BANDS[tier];
    elixAmount = min + Math.floor(Math.random() * (max - min + 1));
    return { outcome: "ELIXCOIN", rarity: tier, itemName: "ELIXCOIN", itemType: "elix", elixAmount, sellPrice: elixAmount, tradeSpotPrice: elixAmount };
  }

  if (outcome === "MATERIAL") {
    const rarityRoll = rnd();
    rarity = weightedPick(rarityRoll, LOOT_RARITY_WEIGHTS);
    const pool = CASE_MATERIALS[rarity];
    itemName = pool[Math.floor(Math.random() * pool.length)];
    itemType = "material";
    const sellPrice = MATERIAL_SELL_PRICE[rarity];
    const tradeKey = itemName.toUpperCase().replace(/ /g, "-");
    const tradeSpotPrice = TRADE_SPOT_ITEM_PRICES[tradeKey] || sellPrice;
    return { outcome, rarity, itemName, itemType, elixAmount: 0, sellPrice, tradeSpotPrice };
  }

  if (outcome === "BUFF") {
    const buffRarityRoll = rnd();
    rarity = weightedPick(buffRarityRoll, BUFF_RARITY_WEIGHTS);
    // Pick a random buff item from the BUFF_SELL_PRICES
    const buffItems = Object.entries(BUFF_SELL_PRICES).filter(([k, v]) => {
      if (rarity === "COMMON") return v <= 240;
      if (rarity === "MEDIUM") return v >= 714 && v <= 1999;
      if (rarity === "RARE") return v >= 12499 && v <= 19998;
      if (rarity === "ULTRA_RARE") return v >= 45456;
      return false;
    });
    if (buffItems.length === 0) {
      // Fallback
      const allBuffs = Object.entries(BUFF_SELL_PRICES);
      const pick = allBuffs[Math.floor(Math.random() * allBuffs.length)];
      itemName = pick[0];
      sellPrice = pick[1];
    } else {
      const pick = buffItems[Math.floor(Math.random() * buffItems.length)];
      itemName = pick[0];
      var sellPrice = pick[1];
    }
    itemType = "buff";
    const tradeKey = itemName.toUpperCase().replace(/-/g, "-");
    const tradeSpotPrice = TRADE_SPOT_BUFF_PRICES[tradeKey] || sellPrice;
    return { outcome, rarity, itemName, itemType, elixAmount: 0, sellPrice: sellPrice || 0, tradeSpotPrice };
  }

  return { outcome: "ZONK", rarity: null, itemName: null, itemType: null, elixAmount: 0, sellPrice: 0, tradeSpotPrice: 0 };
}

function runSimulation(numCases) {
  hdr(`🎰 SIMULASI: BUKA ${numCases} CASE BOX → JUAL KE MARKETPLACE`);

  const results = {
    ZONK: 0,
    ELIXCOIN: 0,
    MATERIAL: { COMMON: 0, MEDIUM: 0, RARE: 0 },
    BUFF: { COMMON: 0, MEDIUM: 0, RARE: 0, ULTRA_RARE: 0 },
  };

  const items = []; // { outcome, rarity, itemName, itemType, sellPrice, tradeSpotPrice }

  for (let i = 0; i < numCases; i++) {
    const item = simulateCaseBox();
    items.push(item);

    if (item.outcome === "ZONK") results.ZONK++;
    else if (item.outcome === "ELIXCOIN") results.ELIXCOIN++;
    else if (item.outcome === "MATERIAL") results.MATERIAL[item.rarity]++;
    else if (item.outcome === "BUFF") results.BUFF[item.rarity]++;
  }

  // ── Display case box results ──
  subhdr(`📊 HASIL BUKA ${numCases} CASE BOX`);
  console.log(`  ZONK (kosong):      ${results.ZONK} (${(results.ZONK/numCases*100).toFixed(1)}%)`);
  console.log(`  ELIXCOIN:           ${results.ELIXCOIN} (${(results.ELIXCOIN/numCases*100).toFixed(1)}%)`);
  console.log(`  MATERIAL COMMON:    ${results.MATERIAL.COMMON} (${(results.MATERIAL.COMMON/numCases*100).toFixed(1)}%)`);
  console.log(`  MATERIAL MEDIUM:    ${results.MATERIAL.MEDIUM} (${(results.MATERIAL.MEDIUM/numCases*100).toFixed(1)}%)`);
  console.log(`  MATERIAL RARE:      ${results.MATERIAL.RARE} (${(results.MATERIAL.RARE/numCases*100).toFixed(1)}%)`);
  console.log(`  BUFF COMMON:        ${results.BUFF.COMMON} (${(results.BUFF.COMMON/numCases*100).toFixed(1)}%)`);
  console.log(`  BUFF MEDIUM:        ${results.BUFF.MEDIUM} (${(results.BUFF.MEDIUM/numCases*100).toFixed(1)}%)`);
  console.log(`  BUFF RARE:          ${results.BUFF.RARE} (${(results.BUFF.RARE/numCases*100).toFixed(1)}%)`);
  console.log(`  BUFF ULTRA_RARE:    ${results.BUFF.ULTRA_RARE} (${(results.BUFF.ULTRA_RARE/numCases*100).toFixed(1)}%)`);

  // ── Calculate marketplace sell value ──
  let totalMarketplaceSell = 0;
  let totalTradeSpotSell = 0;
  let totalElixFromCase = 0;

  const materialsSold = [];
  const buffsSold = [];

  for (const item of items) {
    if (item.outcome === "ELIXCOIN") {
      totalElixFromCase += item.elixAmount;
      totalMarketplaceSell += item.elixAmount;
      totalTradeSpotSell += item.elixAmount;
    } else if (item.outcome === "MATERIAL") {
      totalMarketplaceSell += item.sellPrice;
      totalTradeSpotSell += item.tradeSpotPrice;
      materialsSold.push(item);
    } else if (item.outcome === "BUFF") {
      totalMarketplaceSell += item.sellPrice;
      totalTradeSpotSell += item.tradeSpotPrice;
      buffsSold.push(item);
    }
  }

  // Apply trade spot fee (1.5%)
  const tradeSpotNet = totalTradeSpotSell * (1 - TRADE_FEE);

  // ── Marketplace sell summary ──
  subhdr(`💰 PATH A: SELL DI MARKETPLACE (Fixed sellPrice)`);
  let matMarketTotal = 0;
  const matByRarity = { COMMON: 0, MEDIUM: 0, RARE: 0 };
  for (const m of materialsSold) {
    matByRarity[m.rarity] += m.sellPrice;
    matMarketTotal += m.sellPrice;
  }
  for (const [r, v] of Object.entries(matByRarity)) {
    if (v > 0) console.log(`  Material ${r.padEnd(10)}: ${results.MATERIAL[r]} items × ${MATERIAL_SELL_PRICE[r]} ELIX = ${v.toLocaleString()} ELIX`);
  }
  let buffMarketTotal = 0;
  const buffByRarity = { COMMON: 0, MEDIUM: 0, RARE: 0, ULTRA_RARE: 0 };
  for (const b of buffsSold) {
    buffByRarity[b.rarity] += b.sellPrice;
    buffMarketTotal += b.sellPrice;
  }
  for (const [r, v] of Object.entries(buffByRarity)) {
    if (v > 0) console.log(`  Buff ${r.padEnd(12)}: ${results.BUFF[r]} items  → ${v.toLocaleString()} ELIX`);
  }
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  ELIXCOIN dari case:   ${totalElixFromCase.toLocaleString()} ELIX`);
  console.log(`  Material sell total:  ${matMarketTotal.toLocaleString()} ELIX`);
  console.log(`  Buff sell total:      ${buffMarketTotal.toLocaleString()} ELIX`);
  console.log(`  ════════════════════════════════════════`);
  console.log(`  TOTAL MARKETPLACE:    ${totalMarketplaceSell.toLocaleString()} ELIX`);

  // ── Trade Spot sell summary ──
  subhdr(`📈 PATH B: SELL DI TRADE SPOT (ITEM/ELIXCOIN pairs)`);
  let matTradeTotal = 0;
  const matTradeByRarity = { COMMON: 0, MEDIUM: 0, RARE: 0 };
  for (const m of materialsSold) {
    matTradeByRarity[m.rarity] += m.tradeSpotPrice;
    matTradeTotal += m.tradeSpotPrice;
  }
  for (const [r, v] of Object.entries(matTradeByRarity)) {
    if (v > 0) console.log(`  Material ${r.padEnd(10)}: ${results.MATERIAL[r]} items  → ${v.toLocaleString()} ELIX (gross)`);
  }
  let buffTradeTotal = 0;
  const buffTradeByRarity = { COMMON: 0, MEDIUM: 0, RARE: 0, ULTRA_RARE: 0 };
  for (const b of buffsSold) {
    buffTradeByRarity[b.rarity] += b.tradeSpotPrice;
    buffTradeTotal += b.tradeSpotPrice;
  }
  for (const [r, v] of Object.entries(buffTradeByRarity)) {
    if (v > 0) console.log(`  Buff ${r.padEnd(12)}: ${results.BUFF[r]} items  → ${v.toLocaleString()} ELIX (gross)`);
  }
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  ELIXCOIN dari case:   ${totalElixFromCase.toLocaleString()} ELIX`);
  console.log(`  Material gross:       ${matTradeTotal.toLocaleString()} ELIX`);
  console.log(`  Buff gross:           ${buffTradeTotal.toLocaleString()} ELIX`);
  console.log(`  Trade fee (1.5%):     -${Math.round(totalTradeSpotSell * TRADE_FEE).toLocaleString()} ELIX`);
  console.log(`  ════════════════════════════════════════`);
  console.log(`  TOTAL TRADE SPOT:     ${Math.round(tradeSpotNet).toLocaleString()} ELIX (net)`);

  // ── Comparison ──
  subhdr(`📊 PERBANDINGAN: MARKETPLACE vs TRADE SPOT`);
  console.log(`  Marketplace (fixed):  ${totalMarketplaceSell.toLocaleString()} ELIX`);
  console.log(`  Trade Spot (market):  ${Math.round(tradeSpotNet).toLocaleString()} ELIX (net after 1.5% fee)`);
  const diff = tradeSpotNet - totalMarketplaceSell;
  const diffPct = totalMarketplaceSell > 0 ? (diff / totalMarketplaceSell * 100) : 0;
  console.log();
  if (diff > 0) {
    console.log(`  ✅ Trade Spot LEBIH UNTUNG: +${Math.round(diff).toLocaleString()} ELIX (+${diffPct.toFixed(1)}%)`);
  } else if (diff < 0) {
    console.log(`  ⚠️  Marketplace LEBIH UNTUNG: +${Math.round(-diff).toLocaleString()} ELIX (+${(-diffPct).toFixed(1)}%)`);
  } else {
    console.log(`  ➡️  SAMA: Kedua path menghasilkan nilai yang sama`);
  }

  // ── Show some sample items ──
  subhdr(`🔍 CONTOH ITEM YANG DIDAPAT & HARGA JUAL`);
  console.log(`  ┌──────────────────────┬──────────┬────────────┬───────────┬─────────────────┐`);
  console.log(`  │ Item                 │ Rarity   │ Market ELX │ Trade ELX │ Best Path       │`);
  console.log(`  ├──────────────────────┼──────────┼────────────┼───────────┼─────────────────┤`);
  const samples = items.filter(i => i.outcome !== "ZONK" && i.outcome !== "ELIXCOIN").slice(0, 20);
  for (const s of samples) {
    const name = (s.itemName || "").substring(0, 20).padEnd(20);
    const rarity = (s.rarity || "").padEnd(8);
    const mkt = String(s.sellPrice).padStart(10);
    const ts = String(s.tradeSpotPrice).padStart(9);
    const best = s.sellPrice >= s.tradeSpotPrice ? "⛏️  Marketplace" : "📈 Trade Spot";
    console.log(`  │ ${name} │ ${rarity} │ ${mkt} │ ${ts} │ ${best.padEnd(15)} │`);
  }
  console.log(`  └──────────────────────┴──────────┴────────────┴───────────┴─────────────────┘`);

  // ── KESIMPULAN ──
  subhdr(`✅ KESIMPULAN`);
  console.log(`
  1. YA, items dari Case Box BISA dijual ke Trade Spot!
     → Item/ELIXCOIN pairs sudah tersedia untuk semua 75 material + 160 buff items

  2. Marketplace vs Trade Spot:
     → Material items: Harga SAMA (Marketplace fixed = Trade Spot mid)
     → Buff items: Harga juga SAMA, tapi Trade Spot kena fee 1.5%
     → Marketplace LEBIH UNTUNG untuk buff (tanpa fee spread)

  3. Best strategy:
     → Material tools: Jual di Marketplace (no fee, instant)
     → Buff items: PERTIMANGKAN untuk DIPAKAI dulu (memberikan buff!)
     → Setelah buff sudah cukup, baru jual di Marketplace

  4. ELIXCOIN drops langsung masuk wallet → bisa langsung trade di ELIXCOIN/ELIXIR

  💡 REKOMENDASI:
     → BUFF items jangan dijual dulu! Mereka memberikan:
       ⚔️ ATK buff → lebih cepat hancurkan batu/case
       💰 ECONOMY buff → lebih banyak resource dari mining
       🔧 DURABILITY buff → pickaxe lebih awet
       🎲 DROPRATE buff → lebih sering dapat item rare
     → Material tools bisa dijual langsung ke Marketplace
     → ELIXCOIN bisa langsung dipakai beli di Trade Spot
`);
  console.log(`${'═'.repeat(W)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════
//  MARKETPLACE ITEM CATALOG
// ═══════════════════════════════════════════════════════════════════════
function showCatalog() {
  hdr(`📋 MARKETPLACE & TRADE SPOT ITEM CATALOG`);

  subhdr(`🔨 MATERIAL TOOLS (75 items) — Dari Case Box`);
  console.log(`  ┌──────────┬──────────┬──────────────────────────────────────┐`);
  console.log(`  │ Rarity   │ Sell ELX │ Contoh Items                         │`);
  console.log(`  ├──────────┼──────────┼──────────────────────────────────────┤`);
  console.log(`  │ COMMON   │       50 │ Rusty Nail, Iron Shard, Copper Wire  │`);
  console.log(`  │ MEDIUM   │      500 │ Steel Alloy, Titanium Screw, Carbon  │`);
  console.log(`  │ RARE     │    5,000 │ Void Diamond, Phoenix Feather, etc   │`);
  console.log(`  └──────────┴──────────┴──────────────────────────────────────┘`);
  console.log(`  → Semua bisa dijual di Marketplace DAN Trade Spot (ITEM/ELIXCOIN)`);

  subhdr(`⚔️ BUFF ITEMS (160 items) — Dari Case Box`);
  console.log(`  ┌──────────┬──────────┬──────────────┬──────────────────────────┐`);
  console.log(`  │ Rarity   │ Sell ELX │ Buff Type    │ Contoh                   │`);
  console.log(`  ├──────────┼──────────┼──────────────┼──────────────────────────┤`);
  console.log(`  │ COMMON   │   40-240 │ ⚔️💰🔧🎲    │ Roman Coin, Viking Compass│`);
  console.log(`  │ MEDIUM   │  714-1999│ ⚔️💰🔧🎲    │ Greek God, Spell Book     │`);
  console.log(`  │ RARE     │ 12K-20K  │ ⚔️💰🔧🎲    │ Excalibur, Dragon Map     │`);
  console.log(`  │ ULTRA    │ 45K-250K │ ⚔️💰🔧🎲    │ Emperor Crown, Jade Dragon│`);
  console.log(`  └──────────┴──────────┴──────────────┴──────────────────────────┘`);
  console.log(`  → Dijual di Marketplace (fixed) DAN Trade Spot (ITEM/ELIXCOIN)`);
  console.log(`  → TAPI lebih baik DIPAKAI dulu untuk buff!`);

  subhdr(`📊 PROBABILITAS DROP DARI CASE BOX`);
  console.log(`  ┌─────────────────────┬────────┬──────────────────────────────┐`);
  console.log(`  │ Outcome             │ Chance │ Keterangan                   │`);
  console.log(`  ├─────────────────────┼────────┼──────────────────────────────┤`);
  console.log(`  │ ZONK (kosong)       │   25%  │ Tidak dapat apa-apa          │`);
  console.log(`  │ ELIXCOIN            │   10%  │ 1-40 ELIX tergantung tier    │`);
  console.log(`  │ MATERIAL            │   20%  │ 1 material tool (Common+)    │`);
  console.log(`  │ BUFF                │   45%  │ 1 buff item (Common+)        │`);
  console.log(`  ├─────────────────────┼────────┼──────────────────────────────┤`);
  console.log(`  │ Material → COMMON   │   70%  │ 25 tools × 50 ELIX sell      │`);
  console.log(`  │ Material → MEDIUM   │   22%  │ 25 tools × 500 ELIX sell     │`);
  console.log(`  │ Material → RARE     │    8%  │ 25 tools × 5000 ELIX sell    │`);
  console.log(`  ├─────────────────────┼────────┼──────────────────────────────┤`);
  console.log(`  │ Buff → COMMON       │   60%  │ Low value, tapi useful buff   │`);
  console.log(`  │ Buff → MEDIUM       │   15%  │ Mid value + decent buff       │`);
  console.log(`  │ Buff → RARE         │    5%  │ High value + strong buff      │`);
  console.log(`  │ Buff → ULTRA_RARE   │  0.5%  │ Jackpot! Massive buff + value │`);
  console.log(`  └─────────────────────┴────────┴──────────────────────────────┘`);
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════
console.log(`\n${'█'.repeat(W)}`);
console.log(`  🎮 SIMULASI: CASE BOX → MARKETPLACE / TRADE SPOT SELL`);
console.log(`  Apakah items dari Case Box bisa dijual ke Trade Spot?`);
console.log(`${'█'.repeat(W)}`);

showCatalog();
runSimulation(100);
runSimulation(500);
runSimulation(1000);
