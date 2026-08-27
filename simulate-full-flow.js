#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  FULL FLOW SIMULATION — CaseBox → Trade Spot → Buff → Mining → Upgrade
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * This script simulates the ENTIRE game loop to find bugs and conflicts:
 * 
 *  1. User grinds case box → gets buff item → sells at trade spot
 *  2. User buys buff at trade spot → equips → mines/casebox with buff effect
 *  3. User gets material tools from case box → sells at trade spot
 *  4. User buys material tools → uses for pickaxe upgrade
 * 
 * It analyzes data flow across ALL services to find integration bugs.
 */

const readline = require('readline');

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATED DATA — mirrors exact backend schemas and constants
// ══════════════════════════════════════════════════════════════════════════════

// ── Case Box Constants ────────────────────────────────────────────────────
const OUTCOME_WEIGHTS = { MATERIAL: 20, BUFF: 45, ZONK: 25, ELIXCOIN: 10 };
const BUFF_RARITY_WEIGHTS = { COMMON: 60, MEDIUM: 15, RARE: 5, ULTRA_RARE: 0.5 };
const BUFF_TYPE_WEIGHTS = { ATK: 25, ECONOMY: 25, DURABILITY: 25, DROPRATE: 25 };

// ── Buff Item Assignments (backend format — buffId = collectionItemId) ─────
const BUFF_ASSIGNMENTS = {
  ATK: {
    COMMON: ["roman-coin","inca-gold","iron-coin","tartar-bow","celtic-torc","bronze-bull","eagle-figure","small-dragon","wolf-figure","bear-statue"],
    MEDIUM: ["greek-god","golden-garuda","marble-lion","knight-statue","samurai-armor","dragon-lid","ming-vase","cloisonne","pharaoh-ring","gem-brooch"],
    RARE: ["excalibur","javanese-keris","poseidon-trident","thors-hammer","artemis-bow","shadow-blade","aegis-shield","katana","dragon-keris","guard-halberd"],
    ULTRA_RARE: ["emperor-crown","solomon-ring","ras-necklace","caduceus","dragon-orb","dragon-chest","hellfire-chest","divine-chest","multiverse-chest","kings-gold-chest"],
  },
  ECONOMY: {
    COMMON: ["sumerian-tablet","mayan-disk","chinese-seal","persian-astro","babylon-seal","mini-scarab","mini-sun-disk","brass-lamp","wooden-box","metal-tin"],
    MEDIUM: ["kings-crown","queens-tiara","pearl-necklace","silver-bracelet","moon-pendant","jade-earrings","star-diadem","moon-circlet","jade-vase","jeweled-vase"],
    RARE: ["gem-chest","crystal-chest","mystery-chest","eternal-chest","sky-chest","dragon-map","dragon-letter","dragon-tome","dragon-compass","dragon-seal"],
    ULTRA_RARE: ["meissen-porcelain","wedgwood-jasper","millefiori","greek-amphora","cubist-vase","globe-vase","golden-pharaoh","jade-dragon","phoenix-statue","jade-tortoise"],
  },
  DURABILITY: {
    COMMON: ["clay-pot","blue-ceramic","white-porcelain","roman-pottery","batik-vase","sakura-vase","celadon-vase","majolica-vase","raku-pottery","sancai-vase"],
    MEDIUM: ["meissen-porcelain","jade-vase","cloisonne","goddess-lakshmi","greek-god","quartz-crystal","ruby-stone","sapphire-stone","emerald-stone","amethyst-crystal"],
    RARE: ["gem-chest","crystal-chest","dragon-orb","ras-necklace","solomon-ring","caduceus","emperor-crown","divine-chest","eternal-chest","multiverse-chest"],
    ULTRA_RARE: ["cubist-vase","jeweled-vase","globe-vase","millefiori","greek-amphora","wedgwood-jasper","golden-pharaoh","jade-dragon","phoenix-statue","jade-tortoise"],
  },
  DROPRATE: {
    COMMON: ["viking-compass","greek-figure","dream-rock","norse-rune","korean-cup","ancient-chakra","tiki-figure","small-buddha","bastet-cat","peacock-figure"],
    MEDIUM: ["spell-book","treasure-map","royal-decree","ancient-codex","buddhist-sutra","mayan-codex","ancient-atlas","prophecy-book","star-chart","egypt-papyrus"],
    RARE: ["mystery-chest","sky-chest","dragon-map","dragon-letter","dragon-tome","dragon-compass","dragon-seal","dragon-chest","hellfire-chest","kings-gold-chest"],
    ULTRA_RARE: ["topaz-stone","opal-stone","lapis-lazuli","garnet-stone","aquamarine","gem-brooch","pharaoh-ring","kings-crown","queens-tiara","pearl-necklace"],
  },
};

const BUFF_VALUES = {
  COMMON: [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.55, 0.60],
  MEDIUM: [1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50],
  RARE: [3.75, 4.00, 4.25, 4.50, 4.75, 5.00, 5.25, 5.50, 5.75, 6.00],
  ULTRA_RARE: [6.00, 9.00, 12.00, 15.00, 18.00, 21.00, 24.00, 27.00, 30.00, 33.00],
};

// ── Material Tools ────────────────────────────────────────────────────────
const MATERIALS = {
  COMMON: ["Rusty Nail","Wooden Handle","Iron Shard","Copper Wire","Flint Stone","Hemp Rope","Leather Strap","Clay Mold","Tin Plate","Bone Fragment","Sandstone Grit","Charcoal Lump","Glass Shard","Rubber Grip","Brass Rivet","Canvas Wrap","Iron Bolt","Slate Chip","Twine Coil","Wax Seal","Stone Wheel","Bronze Pin","Ash Plank","Cloth Strip","Pig Iron Ingot"],
  MEDIUM: ["Steel Alloy","Silver Filament","Copper Coil","Magnet Core","Quartz Crystal","Reinforced Spring","Tempered Glass","Gold Plating","Titanium Screw","Carbon Fiber","Enchanted Rune","Sapphire Lens","Power Cell","Hydraulic Pump","Servo Motor","Platinum Wire","Crystal Gear","Obsidian Blade","Neon Capacitor","Phantom Core","Emerald Driver","Chrono Spring","Plasma Coil","Arcane Alloy","Magnetic Array"],
  RARE: ["Void Diamond","Phoenix Feather","Dragon Scale","Celestial Core","Quantum Shard","Starforged Ingot","Infinity Crystal","Thunder Essence","Abyss Pearl","Solar Fragment","Lunar Prism","Chaos Ember","Titan Heart","Etherium Wire","Rift Anchor","Frost Nova Core","Pyroclasm Gem","Nebula Dust","Singularity Bolt","Godslayer Alloy","Timeless Gear","Dimension Key","Eternity Matrix","Primordial Ore","Omega Circuit"],
};

// ── Trade Spot Pairs ──────────────────────────────────────────────────────
const TRADE_SPOT_PAIRS = {};
// Generate all pairs from buff items
for (const [type, rarities] of Object.entries(BUFF_ASSIGNMENTS)) {
  for (const [rarity, items] of Object.entries(rarities)) {
    for (const item of items) {
      const pairKey = `${item.toUpperCase()}/ELIXCOIN`;
      const mult = { COMMON: 400, MEDIUM: 571, RARE: 3333, ULTRA_RARE: 7576 };
      const values = BUFF_VALUES[rarity];
      const idx = items.indexOf(item);
      const sellPrice = Math.round(values[idx] * mult[rarity]);
      TRADE_SPOT_PAIRS[pairKey] = { mid: sellPrice, spread: 0.004, fee: 0.015 };
    }
  }
}
// Material pairs
for (const [rarity, items] of Object.entries(MATERIALS)) {
  const matPrices = { COMMON: 50, MEDIUM: 500, RARE: 5000 };
  for (const item of items) {
    const pairKey = `${item.toUpperCase().replace(/\s+/g, '-')}/ELIXCOIN`;
    TRADE_SPOT_PAIRS[pairKey] = { mid: matPrices[rarity], spread: 0.004, fee: 0.015 };
  }
}
// Mineral pairs
for (const [pair, mid] of Object.entries({
  "IRON/USDC": 0.00000030, "COPPER/USDC": 0.00000060, "SILVER/USDC": 0.00000068,
  "GOLD/USDC": 0.0000068, "DIAMOND/USDC": 0.000068,
  "ELIXCOIN/ELIXIR": 0.09674384, "ELIXCOIN/USDC": 0.00000967,
})) {
  TRADE_SPOT_PAIRS[pair] = { mid, spread: 0.004, fee: 0.015 };
}

// ── Pickaxe Upgrade Costs ─────────────────────────────────────────────────
const PICKAXE_TIERS = ["Common","Uncommon","Rare","Epic","Legendary","Mythic"];
const PICKAXE_UPGRADE_COST = {
  Common:    { IRON: 2500, COPPER: 1000, materialRarity: "COMMON" },
  Uncommon:  { COPPER: 2500, SILVER: 1500, materialRarity: "COMMON" },
  Rare:      { SILVER: 2000, GOLD: 250, materialRarity: "MEDIUM" },
  Epic:      { GOLD: 1000, DIAMOND: 50, materialRarity: "MEDIUM" },
  Legendary: { GOLD: 2500, DIAMOND: 150, materialRarity: "RARE" },
  Mythic:    { GOLD: 5000, DIAMOND: 500, materialRarity: "RARE" },
};

// ── Frontend Old Format (BUFF_BY_ID uses buffId = "ATK-COMMON-01") ────────
// This is what the OLD frontend buff-mapping.ts generates
const OLD_FRONTEND_BUFF_BY_ID = {};
let oldIdx = 0;
for (const [type, rarities] of Object.entries(BUFF_ASSIGNMENTS)) {
  for (const [rarity, items] of Object.entries(rarities)) {
    for (let i = 0; i < items.length; i++) {
      const buffId = `${type}-${rarity}-${String(i + 1).padStart(2, "0")}`;
      OLD_FRONTEND_BUFF_BY_ID[buffId] = {
        buffId,
        collectionItemId: items[i],
        buffType: type,
        rarity,
        buffValue: BUFF_VALUES[rarity][i],
      };
      oldIdx++;
    }
  }
}

// ── Backend DB (BuffItem schema) — uses collectionItemId as buffId ────────
// The backend seedBuffItems() stores: buffId = collectionItemId = "roman-coin"
const BACKEND_BUFF_ITEMS = {};
for (const [type, rarities] of Object.entries(BUFF_ASSIGNMENTS)) {
  for (const [rarity, items] of Object.entries(rarities)) {
    for (let i = 0; i < items.length; i++) {
      const itemId = items[i];
      BACKEND_BUFF_ITEMS[itemId] = {
        buffId: itemId,       // ← backend uses collectionItemId as buffId!
        collectionItemId: itemId,
        buffType: type,
        rarity,
        buffValue: BUFF_VALUES[rarity][i],
      };
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function weightedPick(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [key, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return key;
  }
  return Object.keys(weights).pop();
}

function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmt(n) { return typeof n === 'number' ? n.toLocaleString() : n; }

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATED USER STATE
// ══════════════════════════════════════════════════════════════════════════════

function createUser(id) {
  return {
    telegramId: id,
    firstName: "SimUser",
    cryptoBalances: {
      ELIXIR: 10000, ELIXCOIN: 50000, USDC: 100,
      IRON: 5000, COPPER: 3000, SILVER: 500, GOLD: 100, DIAMOND: 10,
    },
    materials: {},
    ownedPickaxes: ["Common"],
    pickaxeUpgrades: { Common: 0 },
    adTickets: 10,
    level: 10,
    // Buff collection
    buffCollection: {
      inventory: [],
      activeInstanceIds: [],
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATION 1: CaseBox → Get Buff Item → Sell at Trade Spot
// ══════════════════════════════════════════════════════════════════════════════

function simulate1_CaseBoxToTradeSpot(user) {
  console.log("\n" + "═".repeat(70));
  console.log("  SIMULATION 1: CaseBox → Get Item → Sell at Trade Spot");
  console.log("═".repeat(70));

  const results = { opens: 0, buffs: 0, materials: 0, elixcoin: 0, zonk: 0, soldAtTradeSpot: 0, errors: [] };

  // Open 100 case boxes
  for (let i = 0; i < 100; i++) {
    results.opens++;
    const outcome = weightedPick(OUTCOME_WEIGHTS);

    if (outcome === "BUFF") {
      const buffRarity = weightedPick(BUFF_RARITY_WEIGHTS);
      const buffType = weightedPick(BUFF_TYPE_WEIGHTS);
      const available = BUFF_ASSIGNMENTS[buffType]?.[buffRarity] || [];
      const ownedIds = new Set(user.buffCollection.inventory.map(inst => inst.baseItemId));
      const unowned = available.filter(id => !ownedIds.has(id));

      if (unowned.length > 0) {
        const picked = randChoice(unowned);
        const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        user.buffCollection.inventory.push({
          instanceId,
          baseItemId: picked,  // ← backend stores collectionItemId as baseItemId
          acquiredAt: new Date(),
        });
        results.buffs++;

        // ── TRY TO SELL AT TRADE SPOT ────────────────────────────────────
        // Step 1: User clicks grid → frontend constructs pair
        const frontendPairName = `${picked.toUpperCase()}/ELIXCOIN`;
        const pairExists = !!TRADE_SPOT_PAIRS[frontendPairName];

        if (!pairExists) {
          results.errors.push(`❌ PAIR NOT FOUND: ${frontendPairName}`);
        }

        // Step 2: Auction house listing — backend uses baseItemId = "roman-coin"
        const auctionBaseItemId = picked; // backend stores "roman-coin"
        const auctionPairKey = `${auctionBaseItemId.toUpperCase()}/ELIXCOIN`;
        const auctionPairExists = !!TRADE_SPOT_PAIRS[auctionPairKey];

        if (auctionPairExists) {
          results.soldAtTradeSpot++;
        } else {
          results.errors.push(`❌ AUCTION PAIR NOT FOUND: ${auctionPairKey}`);
        }

        // Step 3: Frontend BUFF_BY_ID lookup for min price
        const oldBuffId = `${buffType}-${buffRarity}-${String(available.indexOf(picked) + 1).padStart(2, "0")}`;
        const oldLookup = OLD_FRONTEND_BUFF_BY_ID[oldBuffId];
        const backendLookup = BACKEND_BUFF_ITEMS[picked];

        if (!oldLookup) {
          results.errors.push(`❌ OLD FRONTEND LOOKUP FAILED: BUFF_BY_ID["${oldBuffId}"] = undefined`);
        }
        if (!backendLookup) {
          results.errors.push(`❌ BACKEND LOOKUP FAILED: buffItem["${picked}"] = undefined`);
        }

        if (oldLookup && backendLookup) {
          // Check if old buffId matches what backend expects
          if (oldLookup.collectionItemId !== backendLookup.buffId) {
            results.errors.push(`⚠️  ID MISMATCH: old buffId="${oldBuffId}" → collectionItemId="${oldLookup.collectionItemId}" vs backend buffId="${backendLookup.buffId}"`);
          }
        }
      } else {
        // Fallback: ELIXCOIN
        user.cryptoBalances.ELIXCOIN += randInt(1, 5);
        results.elixcoin++;
      }
    } else if (outcome === "MATERIAL") {
      const matRarity = weightedPick({ COMMON: 70, MEDIUM: 22, RARE: 8 });
      const matName = randChoice(MATERIALS[matRarity]);
      user.cryptoBalances[matName] = (user.cryptoBalances[matName] || 0) + 1;
      results.materials++;

      // Try to sell material at trade spot
      const matPairKey = `${matName.toUpperCase().replace(/\s+/g, '-')}/ELIXCOIN`;
      const matPairExists = !!TRADE_SPOT_PAIRS[matPairKey];
      if (matPairExists) {
        results.soldAtTradeSpot++;
      } else {
        results.errors.push(`❌ MATERIAL PAIR NOT FOUND: ${matPairKey}`);
      }
    } else if (outcome === "ELIXCOIN") {
      user.cryptoBalances.ELIXCOIN += randInt(1, 5);
      results.elixcoin++;
    } else {
      results.zonk++;
    }
  }

  console.log(`\n  📊 Results (100 case box opens):`);
  console.log(`     BUFF items:     ${results.buffs}`);
  console.log(`     MATERIAL items: ${results.materials}`);
  console.log(`     ELIXCOIN:       ${results.elixcoin}`);
  console.log(`     ZONK:           ${results.zonk}`);
  console.log(`     Sold at Trade:  ${results.soldAtTradeSpot}`);

  if (results.errors.length > 0) {
    console.log(`\n  🐛 BUGS FOUND:`);
    for (const err of results.errors) {
      console.log(`     ${err}`);
    }
  } else {
    console.log(`\n  ✅ No errors found in simulation 1`);
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATION 2: Buy Buff at Trade Spot → Equip → Mine with Buff Effect
// ══════════════════════════════════════════════════════════════════════════════

function simulate2_BuyBuffEquipMine(user) {
  console.log("\n" + "═".repeat(70));
  console.log("  SIMULATION 2: Buy Buff → Equip → Mine with Effect");
  console.log("═".repeat(70));

  const errors = [];

  // Simulate buying 10 buff items from trade spot
  const testBuffItems = [
    { pair: "ROMAN-COIN/ELIXCOIN", itemId: "roman-coin", type: "ATK", rarity: "COMMON" },
    { pair: "GREEK-GOD/ELIXCOIN", itemId: "greek-god", type: "ATK", rarity: "MEDIUM" },
    { pair: "EXCALIBUR/ELIXCOIN", itemId: "excalibur", type: "ATK", rarity: "RARE" },
    { pair: "EMPEROR-CROWN/ELIXCOIN", itemId: "emperor-crown", type: "ATK", rarity: "ULTRA_RARE" },
    { pair: "SUMERIAN-TABLET/ELIXCOIN", itemId: "sumerian-tablet", type: "ECONOMY", rarity: "COMMON" },
    { pair: "KINGS-CROWN/ELIXCOIN", itemId: "kings-crown", type: "ECONOMY", rarity: "MEDIUM" },
    { pair: "CLAY-POT/ELIXCOIN", itemId: "clay-pot", type: "DURABILITY", rarity: "COMMON" },
    { pair: "VIKING-COMPASS/ELIXCOIN", itemId: "viking-compass", type: "DROPRATE", rarity: "COMMON" },
    { pair: "SPELL-BOOK/ELIXCOIN", itemId: "spell-book", type: "DROPRATE", rarity: "MEDIUM" },
    { pair: "TOPAZ-STONE/ELIXCOIN", itemId: "topaz-stone", type: "DROPRATE", rarity: "ULTRA_RARE" },
  ];

  console.log(`\n  🛒 Buying 10 buff items from trade spot...`);

  for (const item of testBuffItems) {
    // Step 1: Check pair exists
    const pairData = TRADE_SPOT_PAIRS[item.pair];
    if (!pairData) {
      errors.push(`❌ PAIR NOT FOUND: ${item.pair}`);
      continue;
    }

    // Step 2: Buy (deduct ELIXCOIN, grant buff)
    const price = pairData.mid;
    if (user.cryptoBalances.ELIXCOIN < price) {
      errors.push(`❌ INSUFFICIENT ELIXCOIN for ${item.pair}: need ${fmt(price)}`);
      continue;
    }
    user.cryptoBalances.ELIXCOIN -= price;

    // Step 3: Grant buff to collection (backend stores buffId = collectionItemId)
    const instanceId = `buy-${item.itemId}-${Date.now()}`;
    user.buffCollection.inventory.push({
      instanceId,
      baseItemId: item.itemId,  // ← "roman-coin" (backend format)
      acquiredAt: new Date(),
    });

    // Step 4: Activate (equip) the buff
    user.buffCollection.activeInstanceIds.push(instanceId);

    // Step 5: Verify buff effect calculation
    const backendItem = BACKEND_BUFF_ITEMS[item.itemId];
    if (!backendItem) {
      errors.push(`❌ BACKEND BUFF ITEM NOT FOUND: ${item.itemId}`);
      continue;
    }

    // Calculate buff totals (simulates getUserBuffTotals)
    let totals = { ATK: 0, ECONOMY: 0, DURABILITY: 0, DROPRATE: 0 };
    for (const inst of user.buffCollection.inventory) {
      if (user.buffCollection.activeInstanceIds.includes(inst.instanceId)) {
        const bi = BACKEND_BUFF_ITEMS[inst.baseItemId];
        if (bi) totals[bi.buffType] += bi.buffValue;
      }
    }

    console.log(`     ✅ Bought ${item.itemId} (${item.type}/${item.rarity}) for ${fmt(price)} ELIX → equipped`);
  }

  // Calculate final buff totals
  let totals = { ATK: 0, ECONOMY: 0, DURABILITY: 0, DROPRATE: 0 };
  for (const inst of user.buffCollection.inventory) {
    if (user.buffCollection.activeInstanceIds.includes(inst.instanceId)) {
      const bi = BACKEND_BUFF_ITEMS[inst.baseItemId];
      if (bi) totals[bi.buffType] += bi.buffValue;
    }
  }

  console.log(`\n  📊 Active Buff Totals:`);
  console.log(`     ATK:       +${totals.ATK.toFixed(2)} flat`);
  console.log(`     ECONOMY:   +${totals.ECONOMY.toFixed(2)}%`);
  console.log(`     DURABILITY: +${totals.DURABILITY.toFixed(2)} flat`);
  console.log(`     DROPRATE:  +${totals.DROPRATE.toFixed(2)}%`);

  // Simulate mining with buffs
  console.log(`\n  ⛏️  Simulating mining with active buffs...`);
  const baseResourcePerHit = 10;
  const economyMultiplier = 1 + totals.ECONOMY / 100;
  const droprateBonus = totals.DROPRATE;
  const atkBonus = totals.ATK;

  console.log(`     Base resource/hit:  ${baseResourcePerHit}`);
  console.log(`     Economy multiplier: ${economyMultiplier.toFixed(4)}x`);
  console.log(`     Effective resource: ${(baseResourcePerHit * economyMultiplier).toFixed(2)}/hit`);
  console.log(`     ATK bonus:          +${atkBonus} (faster case break)`);
  console.log(`     Drop rate bonus:    +${droprateBonus}% (rarer drops)`);

  // Simulate case box with DROPRATE buff
  console.log(`\n  📦 Case box with DROPRATE buff...`);
  const boostedBuffWeights = { ...BUFF_RARITY_WEIGHTS };
  if (droprateBonus > 0) {
    const rareBoost = Math.min(droprateBonus, 30);
    boostedBuffWeights.RARE += rareBoost;
    boostedBuffWeights.COMMON = Math.max(10, boostedBuffWeights.COMMON - rareBoost);
  }

  let rareCount = 0, ultraCount = 0;
  for (let i = 0; i < 1000; i++) {
    const roll = weightedPick(boostedBuffWeights);
    if (roll === "RARE") rareCount++;
    if (roll === "ULTRA_RARE") ultraCount++;
  }
  console.log(`     1000 buff drops → RARE: ${rareCount} (${(rareCount/10).toFixed(1)}%), ULTRA_RARE: ${ultraCount} (${(ultraCount/10).toFixed(2)}%)`);
  console.log(`     (Base rates: RARE 5%, ULTRA_RARE 0.5%)`);

  if (errors.length > 0) {
    console.log(`\n  🐛 BUGS FOUND:`);
    for (const err of errors) console.log(`     ${err}`);
  } else {
    console.log(`\n  ✅ No errors found in simulation 2`);
  }

  return { totals, errors };
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATION 3: Get Material from CaseBox → Sell at Trade Spot
// ══════════════════════════════════════════════════════════════════════════════

function simulate3_MaterialFromCaseBoxToTradeSpot(user) {
  console.log("\n" + "═".repeat(70));
  console.log("  SIMULATION 3: Material Tools from CaseBox → Sell at Trade Spot");
  console.log("═".repeat(70));

  const errors = [];
  let totalSold = 0, totalRevenue = 0;

  // Simulate getting 50 material tools from case box
  console.log(`\n  📦 Opening case boxes to get material tools...`);
  const materialsEarned = {};
  for (let i = 0; i < 200; i++) {
    const outcome = weightedPick(OUTCOME_WEIGHTS);
    if (outcome === "MATERIAL") {
      const matRarity = weightedPick({ COMMON: 70, MEDIUM: 22, RARE: 8 });
      const matName = randChoice(MATERIALS[matRarity]);
      user.cryptoBalances[matName] = (user.cryptoBalances[matName] || 0) + 1;
      materialsEarned[matName] = (materialsEarned[matName] || 0) + 1;
    }
  }

  console.log(`     Earned ${Object.keys(materialsEarned).length} unique materials:`);
  for (const [name, count] of Object.entries(materialsEarned).slice(0, 10)) {
    console.log(`       ${name} x${count}`);
  }
  if (Object.keys(materialsEarned).length > 10) {
    console.log(`       ... and ${Object.keys(materialsEarned).length - 10} more`);
  }

  // Try to sell each material at trade spot
  console.log(`\n  💰 Selling materials at trade spot...`);
  for (const [matName, count] of Object.entries(materialsEarned)) {
    const pairKey = `${matName.toUpperCase().replace(/\s+/g, '-')}/ELIXCOIN`;
    const pairData = TRADE_SPOT_PAIRS[pairKey];

    if (!pairData) {
      errors.push(`❌ MATERIAL PAIR NOT FOUND: ${pairKey}`);
      continue;
    }

    // Sell all copies
    for (let j = 0; j < count; j++) {
      if ((user.cryptoBalances[matName] || 0) <= 0) break;

      const sellPrice = pairData.mid;
      const fee = sellPrice * 0.015;
      const net = sellPrice - fee;

      user.cryptoBalances[matName] -= 1;
      user.cryptoBalances.ELIXCOIN += net;
      totalSold++;
      totalRevenue += net;
    }

    console.log(`     ✅ Sold ${count}x ${matName} @ ${fmt(pairData.mid)} ELIX each → +${fmt(Math.round(totalRevenue))} ELIX total`);
  }

  if (errors.length > 0) {
    console.log(`\n  🐛 BUGS FOUND:`);
    for (const err of errors) console.log(`     ${err}`);
  } else {
    console.log(`\n  ✅ No errors found in simulation 3`);
    console.log(`     Total sold: ${totalSold} materials`);
    console.log(`     Total revenue: ${fmt(Math.round(totalRevenue))} ELIXCOIN`);
  }

  return { totalSold, totalRevenue, errors };
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATION 4: Buy Material at Trade Spot → Use for Pickaxe Upgrade
// ══════════════════════════════════════════════════════════════════════════════

function simulate4_BuyMaterialUpgradePickaxe(user) {
  console.log("\n" + "═".repeat(70));
  console.log("  SIMULATION 4: Buy Material at Trade Spot → Pickaxe Upgrade");
  console.log("═".repeat(70));

  const errors = [];

  // Test upgrading each pickaxe tier
  for (const tier of PICKAXE_TIERS) {
    const cost = PICKAXE_UPGRADE_COST[tier];
    const requiredRarity = cost.materialRarity;

    console.log(`\n  🔧 Testing ${tier} pickaxe upgrade (requires ${requiredRarity} material):`);

    // Step 1: Find a material to buy at trade spot
    const availableMats = MATERIALS[requiredRarity];
    if (!availableMats || availableMats.length === 0) {
      errors.push(`❌ NO MATERIALS for rarity ${requiredRarity}`);
      continue;
    }

    const matToBuy = availableMats[0]; // e.g., "Rusty Nail" for COMMON
    const pairKey = `${matToBuy.toUpperCase().replace(/\s+/g, '-')}/ELIXCOIN`;
    const pairData = TRADE_SPOT_PAIRS[pairKey];

    if (!pairData) {
      errors.push(`❌ TRADE SPOT PAIR NOT FOUND for material: ${pairKey}`);
      continue;
    }

    // Step 2: Buy material from trade spot
    const buyPrice = pairData.mid;
    if (user.cryptoBalances.ELIXCOIN < buyPrice) {
      errors.push(`❌ INSUFFICIENT ELIXCOIN to buy ${matToBuy}: need ${fmt(buyPrice)}`);
      continue;
    }
    user.cryptoBalances.ELIXCOIN -= buyPrice;
    user.cryptoBalances[matToBuy] = (user.cryptoBalances[matToBuy] || 0) + 1;
    console.log(`     ✅ Bought ${matToBuy} from trade spot for ${fmt(buyPrice)} ELIX`);

    // Step 3: Check upgrade resource costs
    const resourceCosts = {};
    for (const [resource, amount] of Object.entries(cost)) {
      if (resource === "materialRarity") continue;
      resourceCosts[resource] = amount || 0;
    }

    let canUpgrade = true;
    for (const [resource, needed] of Object.entries(resourceCosts)) {
      const have = user.cryptoBalances[resource] || 0;
      if (have < needed) {
        console.log(`     ⚠️  Insufficient ${resource}: need ${fmt(needed)}, have ${fmt(have)}`);
        canUpgrade = false;
      }
    }

    // Step 4: Check material availability
    let materialFound = null;
    for (const [name, count] of Object.entries(user.cryptoBalances)) {
      if (name.startsWith("ELIX") || name === "USDC" || count <= 0) continue;
      // Check if this is a material tool
      const matRarity = Object.entries(MATERIALS).find(([r, items]) => items.includes(name))?.[0];
      if (matRarity) {
        const rarityOrder = ["COMMON", "MEDIUM", "RARE"];
        if (rarityOrder.indexOf(matRarity) >= rarityOrder.indexOf(requiredRarity)) {
          materialFound = name;
          break;
        }
      }
    }

    if (!materialFound) {
      console.log(`     ❌ No suitable ${requiredRarity}+ material found in inventory`);
      errors.push(`❌ MATERIAL CHECK FAILED for ${tier}: no ${requiredRarity} material`);
      continue;
    }

    if (canUpgrade) {
      // Execute upgrade
      for (const [resource, needed] of Object.entries(resourceCosts)) {
        user.cryptoBalances[resource] -= needed;
      }
      user.cryptoBalances[materialFound] -= 1;
      user.pickaxeUpgrades[tier] = (user.pickaxeUpgrades[tier] || 0) + 1;
      console.log(`     ✅ Upgraded ${tier} to level ${user.pickaxeUpgrades[tier]}!`);
      console.log(`        Used: ${Object.entries(resourceCosts).map(([r,a]) => `${fmt(a)} ${r}`).join(', ')} + 1x ${materialFound}`);
    } else {
      console.log(`     ⏭️  Skipped (insufficient resources)`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n  🐛 BUGS FOUND:`);
    for (const err of errors) console.log(`     ${err}`);
  } else {
    console.log(`\n  ✅ No errors found in simulation 4`);
  }

  return { errors };
}

// ══════════════════════════════════════════════════════════════════════════════
// CROSS-SYSTEM CONFLICT ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCrossSystemConflicts() {
  console.log("\n" + "═".repeat(70));
  console.log("  🔍 CROSS-SYSTEM CONFLICT ANALYSIS");
  console.log("═".repeat(70));

  const conflicts = [];

  // ── Conflict 1: Frontend buffId format vs backend buffId format ────────
  console.log(`\n  [1] Frontend BUFF_BY_ID vs Backend BuffItem.buffId`);
  const frontendFormat = "ATK-COMMON-01";  // old frontend format
  const backendFormat = "roman-coin";       // new backend format

  const frontendExists = !!OLD_FRONTEND_BUFF_BY_ID[frontendFormat];
  const backendExists = !!BACKEND_BUFF_ITEMS[backendFormat];

  console.log(`     Frontend format: "${frontendFormat}" → exists: ${frontendExists}`);
  console.log(`     Backend format:  "${backendFormat}" → exists: ${backendExists}`);

  if (frontendExists && backendExists) {
    const frontendItem = OLD_FRONTEND_BUFF_BY_ID[frontendFormat];
    const backendItem = BACKEND_BUFF_ITEMS[backendFormat];
    console.log(`     Frontend buffId:     ${frontendItem.buffId}`);
    console.log(`     Frontend collection: ${frontendItem.collectionItemId}`);
    console.log(`     Backend buffId:      ${backendItem.buffId}`);
    console.log(`     Backend collection:  ${backendItem.collectionItemId}`);

    if (frontendItem.buffId !== backendItem.buffId) {
      conflicts.push({
        severity: "🔴 CRITICAL",
        issue: "Frontend uses ATK-COMMON-01 format, backend uses roman-coin format",
        impact: "BUFF_BY_ID[atk-common-01] = undefined → min price defaults to 1000 for ALL items",
        fix: "Frontend catalog must use collectionItemId as baseItemId (DONE in previous fix)"
      });
    }
  }

  // ── Conflict 2: Auction house baseItemId vs trade spot pair ────────────
  console.log(`\n  [2] Auction House baseItemId vs Trade Spot Pair Name`);
  const auctionFormat = "roman-coin";  // auction house stores this
  const pairFormat = "ROMAN-COIN/ELIXCOIN";  // trade spot pair

  console.log(`     Auction stores:    "${auctionFormat}"`);
  console.log(`     Trade pair needs:  "${pairFormat}"`);

  const pairLookup = `${auctionFormat.toUpperCase()}/ELIXCOIN`;
  const pairExists = !!TRADE_SPOT_PAIRS[pairLookup];
  console.log(`     Pair "${pairLookup}" exists: ${pairExists}`);

  if (!pairExists) {
    conflicts.push({
      severity: "🔴 CRITICAL",
      issue: "Auction house item names don't match trade spot pair format",
      impact: "Items can't be listed or found at trade spot",
      fix: "Ensure auction house converts item names to pair format correctly"
    });
  }

  // ── Conflict 3: Material name format across systems ────────────────────
  console.log(`\n  [3] Material Name Format Across Systems`);
  const matName = "Rusty Nail";
  const matPairKey = `${matName.toUpperCase().replace(/\s+/g, '-')}/ELIXCOIN`;

  console.log(`     CaseBox grants:    "${matName}" (cryptoBalances)`);
  console.log(`     Auction stores:    "${matName}" (baseItemId)`);
  console.log(`     Trade pair needs:  "${matPairKey}"`);
  console.log(`     Pair exists:       ${!!TRADE_SPOT_PAIRS[matPairKey]}`);

  // Check if all material pairs exist
  let missingMatPairs = 0;
  for (const [rarity, items] of Object.entries(MATERIALS)) {
    for (const item of items) {
      const pk = `${item.toUpperCase().replace(/\s+/g, '-')}/ELIXCOIN`;
      if (!TRADE_SPOT_PAIRS[pk]) {
        missingMatPairs++;
        if (missingMatPairs <= 3) console.log(`     ❌ Missing pair: ${pk}`);
      }
    }
  }
  if (missingMatPairs > 3) console.log(`     ... and ${missingMatPairs - 3} more missing pairs`);
  if (missingMatPairs === 0) console.log(`     ✅ All 75 material pairs exist`);

  // ── Conflict 4: Buff activation flow ───────────────────────────────────
  console.log(`\n  [4] Buff Activation Flow`);
  console.log(`     User buys buff → buff stored in inventory (baseItemId = "roman-coin")`);
  console.log(`     User activates → activeInstanceIds.push(instanceId)`);
  console.log(`     Mining reads → getUserBuffTotals() → looks up buffItem by buffId`);
  console.log(`     Backend buffId = "roman-coin" ← matches inventory baseItemId ✅`);

  // ── Conflict 5: Pickaxe upgrade material flow ──────────────────────────
  console.log(`\n  [5] Pickaxe Upgrade Material Flow`);
  console.log(`     CaseBox grants → cryptoBalances["Rusty Nail"] += 1`);
  console.log(`     Upgrade checks → materials["Rusty Nail"] ≥ 1`);
  console.log(`     ⚠️  MISMATCH: CaseBox writes to cryptoBalances, upgrade reads from materials!`);

  // Check the actual upgrade code
  const caseBoxWrites = "cryptoBalances";
  const upgradeReads = "materials";
  if (caseBoxWrites !== upgradeReads) {
    conflicts.push({
      severity: "🔴 CRITICAL",
      issue: "CaseBox stores materials in cryptoBalances, but pickaxe upgrade reads from materials",
      impact: "Materials earned from case box CANNOT be used for upgrades!",
      fix: "Either change CaseBox to write to materials, or change upgrade to read from cryptoBalances"
    });
  }

  // ── Conflict 6: Trade spot sell vs upgrade consume ─────────────────────
  console.log(`\n  [6] Trade Spot Sell vs Upgrade Consume`);
  console.log(`     Auction house sell → deducts from cryptoBalances[materialName]`);
  console.log(`     Pickaxe upgrade → deducts from materials[materialName]`);
  console.log(`     These are DIFFERENT fields! A user could sell AND upgrade the same material.`);

  // ── Conflict 7: Cross-item-name duplicates ─────────────────────────────
  console.log(`\n  [7] Cross-Type Duplicate Item Names`);
  const allBuffItems = new Set();
  const duplicateNames = [];
  for (const [type, rarities] of Object.entries(BUFF_ASSIGNMENTS)) {
    for (const [rarity, items] of Object.entries(rarities)) {
      for (const item of items) {
        if (allBuffItems.has(item)) {
          duplicateNames.push(item);
        }
        allBuffItems.add(item);
      }
    }
  }
  if (duplicateNames.length > 0) {
    console.log(`     ⚠️  ${duplicateNames.length} items appear in multiple buff types:`);
    for (const name of [...new Set(duplicateNames)].slice(0, 5)) {
      const types = [];
      for (const [type, rarities] of Object.entries(BUFF_ASSIGNMENTS)) {
        for (const [rarity, items] of Object.entries(rarities)) {
          if (items.includes(name)) types.push(`${type}/${rarity}`);
        }
      }
      console.log(`       "${name}" → ${types.join(', ')}`);
    }
    conflicts.push({
      severity: "🟡 MEDIUM",
      issue: `${duplicateNames.length} buff items appear in multiple buff types`,
      impact: "Same item can have different buff values depending on which type it's assigned to",
      fix: "Deduplicate: each item should only appear in ONE buff type"
    });
  } else {
    console.log(`     ✅ No duplicate item names across buff types`);
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log(`\n  ${"─".repeat(66)}`);
  console.log(`  📋 CONFLICT SUMMARY`);
  console.log(`  ${"─".repeat(66)}`);

  if (conflicts.length === 0) {
    console.log(`  ✅ No cross-system conflicts found!`);
  } else {
    for (let i = 0; i < conflicts.length; i++) {
      const c = conflicts[i];
      console.log(`\n  ${c.severity} Conflict #${i + 1}:`);
      console.log(`  Issue:  ${c.issue}`);
      console.log(`  Impact: ${c.impact}`);
      console.log(`  Fix:    ${c.fix}`);
    }
  }

  return conflicts;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
console.log("║  FULL FLOW SIMULATION — CaseBox → Trade Spot → Buff → Mining → Upgrade   ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════╝");

const user = createUser("sim-user-001");

// Run all simulations
const sim1 = simulate1_CaseBoxToTradeSpot(user);
const sim2 = simulate2_BuyBuffEquipMine(user);
const sim3 = simulate3_MaterialFromCaseBoxToTradeSpot(user);
const sim4 = simulate4_BuyMaterialUpgradePickaxe(user);
const conflicts = analyzeCrossSystemConflicts();

// Final summary
console.log("\n" + "═".repeat(70));
console.log("  📊 FINAL SUMMARY");
console.log("═".repeat(70));
console.log(`  Simulation 1 (CaseBox → Sell):     ${sim1.errors.length} errors`);
console.log(`  Simulation 2 (Buy Buff → Mine):    ${sim2.errors.length} errors`);
console.log(`  Simulation 3 (Material → Sell):    ${sim3.errors.length} errors`);
console.log(`  Simulation 4 (Material → Upgrade): ${sim4.errors.length} errors`);
console.log(`  Cross-system conflicts:            ${conflicts.length}`);

const totalErrors = sim1.errors.length + sim2.errors.length + sim3.errors.length + sim4.errors.length + conflicts.length;
if (totalErrors === 0) {
  console.log(`\n  🎉 ALL SYSTEMS GREEN — No bugs found!`);
} else {
  console.log(`\n  ⚠️  ${totalErrors} total issues need attention`);
}

console.log("");
