#!/usr/bin/env node
/**
 * Reset asset registry USDC/ELIXIR to anchor prices and recalculate all pool mids.
 * This fixes the corrupted prices caused by the pre-fix drift bug.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const ANCHOR_PRICES = {
  USDC:     1.0,
  ELIXIR:   0.001,
  ELIXCOIN: 0.00000967,
  IRON:     0.00000030,
  COPPER:   0.00000060,
  SILVER:   0.00000068,
  GOLD:     0.0000068,
  DIAMOND:  0.000068,
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;

  console.log('🔧 Resetting asset registry...');

  // Reset all asset prices to anchor
  for (const [asset, price] of Object.entries(ANCHOR_PRICES)) {
    await db.collection('assetregistries').updateOne(
      { asset },
      { $set: { usdPrice: price } },
      { upsert: true },
    );
    console.log(`  ✅ ${asset} → $${price}`);
  }

  console.log('\n🔧 Recalculating pool mid prices...');

  // Recalculate all pool mids from anchor prices
  const pools = await db.collection('liquiditypools').find({}).toArray();
  for (const pool of pools) {
    const [base, quote] = pool.pair.split('/');
    const basePrice = ANCHOR_PRICES[base];
    const quotePrice = ANCHOR_PRICES[quote];

    if (basePrice && quotePrice) {
      // mid = how many QUOTE per 1 BASE = basePrice(USD) / quotePrice(USD)
      const newMid = basePrice / quotePrice;
      await db.collection('liquiditypools').updateOne(
        { pair: pool.pair },
        { $set: { lastMid: newMid } },
      );
      console.log(`  ✅ ${pool.pair}: lastMid → ${newMid}`);
    } else {
      console.log(`  ⚠️  ${pool.pair}: unknown asset, skipped`);
    }
  }

  console.log('\n✅ Reset complete!');
  await mongoose.disconnect();
}

run().catch(e => { console.error('💥', e); process.exit(1); });
