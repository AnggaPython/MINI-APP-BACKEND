// P0 Migration: legacy reserves + exp split + material double-write
// Run: node scripts/migrate-p0-legacy.js
// Requires: MONGODB_URI env
const mongoose = require('mongoose');
async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI required');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Pools: backfill baseReserve/quoteReserve dari legacy jika 0
  const pools = db.collection('liquiditypools');
  const poolRes = await pools.updateMany(
    { $or: [{ baseReserve: 0 }, { quoteReserve: 0 }] },
    [
      {
        $set: {
          baseReserve: { $ifNull: ['$baseReserve', '$elixcoinReserve'] },
          quoteReserve: { $ifNull: ['$quoteReserve', '$elixirReserve'] },
        },
      },
    ]
  );
  console.log(`[MIGRATE] Pools backfilled: ${poolRes.modifiedCount}`);

  // 2. Users: split exp -> vipExp + gameExp (dual-write period)
  const users = db.collection('users');
  const userRes = await users.updateMany(
    { vipExp: { $exists: false } },
    [{ $set: { vipExp: '$exp', gameExp: '$exp' } }]
  );
  console.log(`[MIGRATE] Users exp split: ${userRes.modifiedCount}`);

  // 3. Materials: cryptoBalances["RUSTY-NAIL"] -> materials["Rusty Nail"]
  // Hanya untuk material tools (isMaterialBase), bukan coin
  const materialSlugToName = (slug) => slug.split('-').map(w=>w[0]+w.slice(1).toLowerCase()).join(' ');
  const commonSlugs = ["RUSTY-NAIL","WOODEN-HANDLE","IRON-SHARD","COPPER-WIRE","FLINT-STONE","HEMP-ROPE","LEATHER-STRAP","CLAY-MOLD","TIN-PLATE","BONE-FRAGMENT","SANDSTONE-GRIT","CHARCOAL-LUMP","GLASS-SHARD","RUBBER-GRIP","BRASS-RIVET","CANVAS-WRAP","IRON-BOLT","SLATE-CHIP","TWINE-COIL","WAX-SEAL","STONE-WHEEL","BRONZE-PIN","ASH-PLANK","CLOTH-STRIP","PIG-IRON-INGOT","STEEL-ALLOY","SILVER-FILAMENT","COPPER-COIL","MAGNET-CORE","REINFORCED-SPRING","TEMPERED-GLASS","GOLD-PLATING","TITANIUM-SCREW","CARBON-FIBER","ENCHANTED-RUNE","SAPPHIRE-LENS","POWER-CELL","HYDRAULIC-PUMP","SERVO-MOTOR","PLATINUM-WIRE","CRYSTAL-GEAR","OBSIDIAN-BLADE","NEON-CAPACITOR","PHANTOM-CORE","EMERALD-DRIVER","CHRONO-SPRING","PLASMA-COIL","ARCANE-ALLOY","MAGNETIC-ARRAY","VOID-DIAMOND","PHOENIX-FEATHER","DRAGON-SCALE","CELESTIAL-CORE","QUANTUM-SHARD","STARFORGED-INGOT","INFINITY-CRYSTAL","THUNDER-ESSENCE","ABYSS-PEARL","SOLAR-FRAGMENT","LUNAR-PRISM","CHAOS-EMBER","TITAN-HEART","ETHERIUM-WIRE","RIFT-ANCHOR","FROST-NOVA-CORE","PYROCLASM-GEM","NEBULA-DUST","SINGULARITY-BOLT","GODSLAYER-ALLOY","TIMELESS-GEAR","DIMENSION-KEY","ETERNITY-MATRIX","PRIMORDIAL-ORE","OMEGA-CIRCUIT"];
  let moved = 0;
  const cursor = users.find({ "cryptoBalances": { $exists: true } });
  for await (const u of cursor) {
    const inc = {};
    const unset = {};
    for (const slug of commonSlugs) {
      const val = u.cryptoBalances?.[slug];
      if (val && val > 0) {
        const name = materialSlugToName(slug);
        inc[`materials.${name}`] = val;
        unset[`cryptoBalances.${slug}`] = 1;
      }
    }
    if (Object.keys(inc).length) {
      await users.updateOne({ _id: u._id }, { $inc: inc, $unset: unset });
      moved++;
    }
  }
  console.log(`[MIGRATE] Users material moved: ${moved}`);

  // 4. Optional cleanup legacy fields setelah verifikasi (uncomment setelah backup)
  // await pools.updateMany({}, { $unset: { elixcoinReserve: 1, elixirReserve: 1 } });
  // console.log('[MIGRATE] Legacy reserve fields unset - DONE');

  await mongoose.disconnect();
  console.log('Migration complete - verify then unset legacy fields');
}
run().catch(e=>{console.error(e);process.exit(1)});
