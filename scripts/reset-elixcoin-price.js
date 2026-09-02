/**
 * One-time migration: reset ELIXCOIN to anchor price + recalculate all pool mids.
 * Run: node scripts/reset-elixcoin-price.js
 * Requires MONGODB_URI env var (same as backend).
 */
const { MongoClient } = require("mongodb");

const ELIXCOIN_ANCHOR = 0.00000967;
const COPPER_ANCHOR = 0.00000060;
const IRON_ANCHOR = 0.00000030;
const SILVER_ANCHOR = 0.00000068;
const GOLD_ANCHOR = 0.00000068;
const DIAMOND_ANCHOR = 0.000068;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI first: export MONGODB_URI=mongodb://...");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  // 1. Reset ELIXCOIN price to anchor
  const assetResult = await db
    .collection("assetregistries")
    .updateOne(
      { asset: "ELIXCOIN" },
      { $set: { usdPrice: ELIXCOIN_ANCHOR } }
    );
  console.log(`ELIXCOIN price reset: ${assetResult.modifiedCount} doc(s)`);

  // 2. Recalculate all pool mids from asset registry
  const assets = {};
  for (const [name, anchor] of Object.entries({
    ELIXCOIN: ELIXCOIN_ANCHOR,
    COPPER: COPPER_ANCHOR,
    IRON: IRON_ANCHOR,
    SILVER: SILVER_ANCHOR,
    GOLD: GOLD_ANCHOR,
    DIAMOND: DIAMOND_ANCHOR,
  })) {
    const doc = await db.collection("assetregistries").findOne({ asset: name });
    assets[name] = doc?.usdPrice || anchor;
  }
  console.log("Current asset prices:", assets);

  // For each pool, recalculate mid = base.USD / quote.USD
  const pools = await db.collection("liquiditypools").find({}).toArray();
  let updated = 0;
  for (const pool of pools) {
    const [base, quote] = pool.pair.split("/");
    const baseUsd = assets[base];
    const quoteUsd = assets[quote];
    if (baseUsd && quoteUsd && quoteUsd > 0) {
      const newMid = Math.round((baseUsd / quoteUsd) * 1e8) / 1e8;
      if (Math.abs(newMid - pool.lastMid) > 0.0001) {
        await db
          .collection("liquiditypools")
          .updateOne({ _id: pool._id }, { $set: { lastMid: newMid } });
        console.log(`${pool.pair}: ${pool.lastMid} → ${newMid}`);
        updated++;
      }
    }
  }
  console.log(`\nDone. ${updated} pool(s) updated.`);
  await client.close();
}

main().catch(console.error);
