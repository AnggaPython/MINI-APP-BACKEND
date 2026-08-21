const mongoose = require('mongoose');
const uri = 'mongodb+srv://pin289c2fa2_db_user:iGe1BiUuCZ6RqCdX@mini-app.5ouixml.mongodb.net/miniapp?retryWrites=true&w=majority';

(async () => {
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('liquiditypools');
  
  const pairs = [
    { name: 'IRON/ELIXCOIN', mid: 0.005, spread: 0.004, min: 0.0049, max: 0.0051 },
    { name: 'COPPER/ELIXCOIN', mid: 0.01, spread: 0.004, min: 0.009, max: 0.011 },
    { name: 'SILVER/ELIXCOIN', mid: 0.1, spread: 0.004, min: 0.09, max: 0.11 },
    { name: 'GOLD/ELIXCOIN', mid: 1, spread: 0.004, min: 0.9, max: 1.1 },
  ];

  for (const p of pairs) {
    await col.updateOne({ pair: p.name }, {
      $set: {
        pair: p.name,
        baseReserve: 10_000_000, 
        quoteReserve: 10_000_000 * p.mid,
        lastMid: p.mid,
        midMin: p.min,
        midMax: p.max,
        spreadPct: p.spread,
        feePct: 0.015,
        botEnabled: true,
        botIntervalMinutes: 15,
        updatedAt: new Date(),
        createdAt: new Date(),
      }
    }, { upsert: true });
    console.log(`Seeded ${p.name} pool with mid ${p.mid}`);
  }
  process.exit(0);
})();
