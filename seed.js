const mongoose = require('mongoose');
const uri = 'mongodb+srv://pin289c2fa2_db_user:iGe1BiUuCZ6RqCdX@mini-app.5ouixml.mongodb.net/miniapp?retryWrites=true&w=majority';

(async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection;
  const col = db.collection('liquiditypools');
  await col.updateOne({ pair: 'ELIXCOIN/USDC' }, {
    $set: {
      pair: 'ELIXCOIN/USDC',
      baseReserve: 10_000_000,
      quoteReserve: 147,
      elixcoinReserve: 10_000_000, 
      elixirReserve: 147,          
      lastMid: 0.0000147,
      midMin: 0.0000146,
      midMax: 0.0000148,
      spreadPct: 0.004,
      feePct: 0.015,
      botEnabled: true,
      botIntervalMinutes: 15,
      updatedAt: new Date(),
      createdAt: new Date(),
    }
  }, { upsert: true });
  console.log("Seeded ELIXCOIN/USDC pool");
  process.exit(0);
})();
