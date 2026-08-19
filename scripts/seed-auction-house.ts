#!/usr/bin/env ts-node
/**
 * Seed 25 buff collection items for a test user and create ~20 auction listings.
 * Run: cd backend-mini-app && npx ts-node scripts/seed-auction-house.ts
 */
import * as mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ── Schemas (inline to avoid NestJS import chain) ─────────────────────────

const BuffItemSchema = new mongoose.Schema(
  {
    buffId: { type: String, required: true, unique: true },
    collectionItemId: { type: String, required: true },
    buffType: {
      type: String,
      required: true,
      enum: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"],
    },
    rarity: {
      type: String,
      required: true,
      enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"],
    },
    buffValue: { type: Number, required: true },
    buffUnit: { type: String, required: true, enum: ["flat", "percent"] },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
  },
  { timestamps: true, collection: "buff_items" }
);

const UserBuffCollectionSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    ownedBuffIds: { type: [String], default: [] },
    activeBuffIds: { type: [String], default: [] },
  },
  { timestamps: true, collection: "user_buff_collections" }
);

const UserSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    username: String,
    cryptoBalances: { type: Object, default: {} },
  },
  { timestamps: true }
);

const AuctionSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, required: true },
    buffId: { type: String, required: true, index: true },
    buffType: {
      type: String,
      required: true,
      enum: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"],
    },
    rarity: {
      type: String,
      required: true,
      enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"],
    },
    price: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["active", "sold", "cancelled"],
      default: "active",
    },
    listedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    collateralDeposit: { type: Number, required: true, default: 10000 },
    collateralReturned: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    buyerId: { type: String, default: null },
  },
  { timestamps: true, collection: "auctions" }
);

// ── Buff item definitions we want to grant ─────────────────────────────────

const BUFFS_TO_GRANT: string[] = [
  // COMMON (8 items)
  "ATK-COMMON-01", "ATK-COMMON-03", "ATK-COMMON-05",
  "ECONOMY-COMMON-02", "ECONOMY-COMMON-07",
  "DURABILITY-COMMON-01", "DURABILITY-COMMON-04",
  "DROPRATE-COMMON-03",

  // MEDIUM (8 items)
  "ATK-MEDIUM-02", "ATK-MEDIUM-06",
  "ECONOMY-MEDIUM-03", "ECONOMY-MEDIUM-05",
  "DURABILITY-MEDIUM-01", "DURABILITY-MEDIUM-08",
  "DROPRATE-MEDIUM-04", "DROPRATE-MEDIUM-09",

  // RARE (6 items)
  "ATK-RARE-01", "ATK-RARE-05",
  "ECONOMY-RARE-03",
  "DURABILITY-RARE-07",
  "DROPRATE-RARE-02", "DROPRATE-RARE-06",

  // ULTRA RARE (3 items)
  "ATK-ULTRA_RARE-01",
  "ECONOMY-ULTRA_RARE-04",
  "DROPRATE-ULTRA_RARE-02",
];

// Listings to create: buffId → price in ELIXCOIN
// Each listing costs 10K collateral deposit, so we give user 500K ELIX to cover
const LISTINGS_TO_CREATE: { buffId: string; price: number }[] = [
  // COMMON listings (1,000 - 3,000 range)
  { buffId: "ATK-COMMON-01", price: 1500 },
  { buffId: "ATK-COMMON-05", price: 2500 },
  { buffId: "ECONOMY-COMMON-02", price: 1800 },
  { buffId: "DURABILITY-COMMON-01", price: 1200 },
  { buffId: "DROPRATE-COMMON-03", price: 2200 },

  // MEDIUM listings (10,000 - 20,000 range)
  { buffId: "ATK-MEDIUM-02", price: 12000 },
  { buffId: "ATK-MEDIUM-06", price: 15000 },
  { buffId: "ECONOMY-MEDIUM-03", price: 11000 },
  { buffId: "ECONOMY-MEDIUM-05", price: 18000 },
  { buffId: "DURABILITY-MEDIUM-01", price: 10500 },
  { buffId: "DURABILITY-MEDIUM-08", price: 14000 },
  { buffId: "DROPRATE-MEDIUM-04", price: 16000 },
  { buffId: "DROPRATE-MEDIUM-09", price: 13000 },

  // RARE listings (25,000 - 40,000 range)
  { buffId: "ATK-RARE-01", price: 30000 },
  { buffId: "ATK-RARE-05", price: 35000 },
  { buffId: "ECONOMY-RARE-03", price: 28000 },
  { buffId: "DURABILITY-RARE-07", price: 26000 },

  // ULTRA RARE listings (50,000 - 80,000 range)
  { buffId: "ATK-ULTRA_RARE-01", price: 65000 },
  { buffId: "DROPRATE-ULTRA_RARE-02", price: 75000 },
];

// Also create some "sold" listings to make marketplace look alive
const SOLD_LISTINGS: { buffId: string; price: number }[] = [
  { buffId: "ATK-COMMON-02", price: 1100 },
  { buffId: "ECONOMY-COMMON-01", price: 1300 },
  { buffId: "ATK-MEDIUM-01", price: 10500 },
  { buffId: "DURABILITY-COMMON-06", price: 1400 },
  { buffId: "DROPRATE-COMMON-01", price: 1600 },
  { buffId: "ATK-RARE-03", price: 27000 },
  { buffId: "ECONOMY-ULTRA_RARE-01", price: 52000 },
  { buffId: "DROPRATE-MEDIUM-02", price: 11500 },
];

// Multiple sellers to make marketplace look active
const SELLERS = [
  { telegramId: "999001", firstName: "Alex", username: "alex_miner" },
  { telegramId: "999002", firstName: "Maya", username: "maya_digger" },
  { telegramId: "999003", firstName: "Kai", username: "kai_trader" },
];

const TEST_USER = "12345678";
const LISTING_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PLATFORM_TAX = 0.19;
const COLLATERAL = 10000;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected!\n");

  const BuffItem = mongoose.model("BuffItem", BuffItemSchema);
  const UserBuff = mongoose.model("UserBuffCollection", UserBuffCollectionSchema);
  const User = mongoose.model("User", UserSchema);
  const Auction = mongoose.model("Auction", AuctionSchema);

  // ── Step 1: Ensure test user exists with 500K ELIXCOIN ───────────────
  console.log("Step 1: Creating test user with 500,000 ELIXCOIN...");
  await User.findOneAndUpdate(
    { telegramId: TEST_USER },
    {
      $setOnInsert: {
        telegramId: TEST_USER,
        firstName: "Dev",
        username: "dev_tester",
      },
      $set: {
        "cryptoBalances.ELIXCOIN": 500_000,
      },
    },
    { upsert: true }
  );
  console.log("  ✅ Test user ready (500,000 ELIXCOIN)\n");

  // ── Step 2: Create secondary seller accounts ──────────────────────────
  console.log("Step 2: Creating seller accounts...");
  for (const seller of SELLERS) {
    await User.findOneAndUpdate(
      { telegramId: seller.telegramId },
      {
        $setOnInsert: {
          telegramId: seller.telegramId,
          firstName: seller.firstName,
          username: seller.username,
        },
        $set: {
          "cryptoBalances.ELIXCOIN": 200_000,
        },
      },
      { upsert: true }
    );
  }
  console.log("  ✅ 3 seller accounts ready\n");

  // ── Step 3: Grant 25 buff items to test user ──────────────────────────
  console.log("Step 3: Granting 25 buff items to test user...");
  // Ensure collection doc exists
  await UserBuff.findOneAndUpdate(
    { telegramId: TEST_USER },
    { $setOnInsert: { telegramId: TEST_USER, ownedBuffIds: [], activeBuffIds: [] } },
    { upsert: true }
  );

  for (const buffId of BUFFS_TO_GRANT) {
    await UserBuff.findOneAndUpdate(
      { telegramId: TEST_USER },
      { $addToSet: { ownedBuffIds: buffId } },
      { upsert: true }
    );
  }
  console.log(`  ✅ Granted ${BUFFS_TO_GRANT.length} buff items\n`);

  // ── Step 4: Create active listings from test user ─────────────────────
  console.log("Step 4: Creating active listings...");
  let listedCount = 0;
  const now = Date.now();

  for (const listing of LISTINGS_TO_CREATE) {
    const buffItem = await BuffItem.findOne({ buffId: listing.buffId });
    if (!buffItem) {
      console.log(`  ⚠️  Buff ${listing.buffId} not found in DB, skipping`);
      continue;
    }

    // Remove from user's owned buffs (escrow)
    await UserBuff.findOneAndUpdate(
      { telegramId: TEST_USER },
      { $pull: { ownedBuffIds: listing.buffId, activeBuffIds: listing.buffId } }
    );

    const tax = Math.round(listing.price * PLATFORM_TAX * 100) / 100;
    const net = Math.round((listing.price - tax) * 100) / 100;

    await Auction.create({
      sellerId: TEST_USER,
      sellerName: "Dev",
      buffId: listing.buffId,
      buffType: buffItem.buffType,
      rarity: buffItem.rarity,
      price: listing.price,
      tax,
      netAmount: net,
      status: "active",
      listedAt: new Date(now - Math.random() * 3 * 24 * 60 * 60 * 1000), // random within 3 days
      expiresAt: new Date(now + LISTING_DURATION_MS - Math.random() * 2 * 24 * 60 * 60 * 1000),
      collateralDeposit: COLLATERAL,
      collateralReturned: false,
    });
    listedCount++;
  }
  console.log(`  ✅ Created ${listedCount} active listings\n`);

  // ── Step 5: Create sold listings from secondary sellers ────────────────
  console.log("Step 5: Creating sold history listings...");
  let soldCount = 0;
  for (let i = 0; i < SOLD_LISTINGS.length; i++) {
    const listing = SOLD_LISTINGS[i];
    const buffItem = await BuffItem.findOne({ buffId: listing.buffId });
    if (!buffItem) continue;

    const seller = SELLERS[i % SELLERS.length];
    const buyerId = SELLERS[(i + 1) % SELLERS.length].telegramId;

    const tax = Math.round(listing.price * PLATFORM_TAX * 100) / 100;
    const net = Math.round((listing.price - tax) * 100) / 100;
    const daysAgo = 1 + Math.floor(Math.random() * 5);

    await Auction.create({
      sellerId: seller.telegramId,
      sellerName: seller.firstName,
      buffId: listing.buffId,
      buffType: buffItem.buffType,
      rarity: buffItem.rarity,
      price: listing.price,
      tax,
      netAmount: net,
      status: "sold",
      listedAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now + LISTING_DURATION_MS),
      resolvedAt: new Date(now - (daysAgo - 1) * 24 * 60 * 60 * 1000),
      collateralDeposit: COLLATERAL,
      collateralReturned: true,
      buyerId,
    });
    soldCount++;
  }
  console.log(`  ✅ Created ${soldCount} sold history listings\n`);

  // ── Summary ───────────────────────────────────────────────────────────
  const totalActive = await Auction.countDocuments({ status: "active" });
  const totalSold = await Auction.countDocuments({ status: "sold" });
  const totalOwned = await UserBuff.findOne({ telegramId: TEST_USER });
  const totalBuffItems = await BuffItem.countDocuments();

  console.log("═══════════════════════════════════════");
  console.log("  📊 SEED SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`  Total buff items in DB:  ${totalBuffItems}`);
  console.log(`  User owned buffs:        ${totalOwned?.ownedBuffIds?.length || 0}`);
  console.log(`  Active listings:         ${totalActive}`);
  console.log(`  Sold history:            ${totalSold}`);
  console.log(`  Total marketplace items: ${totalActive + totalSold}`);
  console.log("═══════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Done! Disconnecting.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
