/**
 * ═══════════════════════════════════════════════════════════════════════
 * DISABLE BOT MM UNTUK SEMUA ITEM PAIRS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Hanya 12 core pairs yang bot-nya aktif:
 *   1. ELIXCOIN/ELIXIR
 *   2. ELIXCOIN/USDC
 *   3. IRON/USDC
 *   4. COPPER/USDC
 *   5. SILVER/USDC
 *   6. GOLD/USDC
 *   7. DIAMOND/USDC
 *   8. ELIXCOIN/IRON
 *   9. ELIXCOIN/COPPER
 *  10. ELIXCOIN/SILVER
 *  11. ELIXCOIN/GOLD
 *  12. ELIXCOIN/DIAMOND
 *
 * Semua ~196 item pairs (buff + material tools) → botEnabled: false
 *
 * CARA PAKAI:
 *   1. Pastikan MongoDB running dan bisa diakses
 *   2. Jalankan: node disable-item-bots.js
 *   3. Atau paste script ini di MongoDB Compass / mongosh
 *
 * CARA REVERSE (enable semua bot lagi):
 *   db.liquiditypools.updateMany({}, { $set: { botEnabled: true } })
 * ═══════════════════════════════════════════════════════════════════════
 */

const CORE_PAIRS = [
  "ELIXCOIN/ELIXIR",
  "ELIXCOIN/USDC",
  "IRON/USDC", "COPPER/USDC", "SILVER/USDC", "GOLD/USDC", "DIAMOND/USDC",
  "ELIXCOIN/IRON", "ELIXCOIN/COPPER", "ELIXCOIN/SILVER",
  "ELIXCOIN/GOLD", "ELIXCOIN/DIAMOND",
];

// ── Option 1: Run directly with mongosh ───────────────────────────────
// Paste this block into mongosh:

const disableItemBots = () => {
  const result = db.liquiditypools.updateMany(
    { pair: { $nin: CORE_PAIRS } },
    { $set: { botEnabled: false } }
  );

  const enabled = db.liquiditypools.countDocuments({ botEnabled: true });
  const disabled = db.liquiditypools.countDocuments({ botEnabled: false });
  const total = enabled + disabled;

  print(`\n✅ Bot MM disable completed!`);
  print(`   Total pools:     ${total}`);
  print(`   Bot ENABLED:     ${enabled} (core pairs only)`);
  print(`   Bot DISABLED:    ${disabled} (item pairs)`);
  print(`\n   Core pairs with bot ON:`);

  db.liquiditypools.find({ botEnabled: true }, { pair: 1, _id: 0 })
    .forEach(doc => print(`     ✅ ${doc.pair}`));

  const disabledCount = db.liquiditypools.countDocuments({ botEnabled: false });
  if (disabledCount > 0) {
    print(`\n   Sample item pairs with bot OFF:`);
    db.liquiditypools.find({ botEnabled: false }, { pair: 1, _id: 0 })
      .limit(10)
      .forEach(doc => print(`     ❌ ${doc.pair}`));
    if (disabledCount > 10) print(`     ... and ${disabledCount - 10} more`);
  }
};

// Run if in mongosh context
if (typeof db !== "undefined") {
  disableItemBots();
}


// ── Option 2: Run as Node.js script with mongoose ─────────────────────
// Uncomment below and set MONGODB_URI:

/*
const mongoose = require("mongoose");

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/freebuff";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const Pool = mongoose.model("LiquidityPool", new mongoose.Schema({}, { strict: false, collection: "liquiditypools" }));

  // Disable bot for all non-core pairs
  const result = await Pool.updateMany(
    { pair: { $nin: CORE_PAIRS } },
    { $set: { botEnabled: false } }
  );

  console.log(`\nModified ${result.modifiedCount} pools`);

  // Verify
  const enabled = await Pool.countDocuments({ botEnabled: true });
  const disabled = await Pool.countDocuments({ botEnabled: false });
  console.log(`Bot ON: ${enabled} | Bot OFF: ${disabled}`);

  const corePools = await Pool.find({ botEnabled: true }, { pair: 1 }).lean();
  console.log("\nCore pairs with bot ON:");
  corePools.forEach(p => console.log(`  ✅ ${p.pair}`));

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch(console.error);
*/
