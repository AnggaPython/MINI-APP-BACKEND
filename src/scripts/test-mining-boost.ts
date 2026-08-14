import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { UsersService } from "../users/users.service";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "../users/schemas/user.schema";
import { Model } from "mongoose";
import * as mongoose from "mongoose";

async function runTest() {
  console.log("=== SIMULASI MINING BOOST (VIP + CODE DROP) ===");
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const TEST_ID = "miner_test_999";

  // 1. Setup User Dummy dengan EXP setara VIP Silver (10% Boost)
  await userModel.deleteOne({ telegramId: TEST_ID });
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - 3); // Mundurkan 3 jam untuk jaminan 100% matang (max 7200s / 2 jam)

  const expiryVoucher = new Date();
  expiryVoucher.setHours(expiryVoucher.getHours() + 5); // Code drop aktif untuk 5 jam ke depan

  // EXP 500 = VIP SILVER = 10%
  await userModel.create({
    telegramId: TEST_ID,
    username: "MiningTester",
    firstName: "Tester",
    lastName: "",
    exp: 500, 
    miningStartDate: startDate,
    isMiningBoosted: true, // Boost Aktif (Base harusnya 5)
    miningVoucherExpiry: expiryVoucher, // Voucher Aktif (Boost +50%)
    adTickets: 1, // Syarat claim valid
  });

  console.log("Menjalankan klaim mining...");
  const result = await usersService.claimMining(TEST_ID);

  if (result.error) {
    console.log("❌ Klaim gagal:", result.error);
  } else {
    console.log("✅ KLAIM BERHASIL!");
    console.log(`- Base (Is Boosted?): Ya (5 ELIXIR Base)`);
    console.log(`- Durasi mining: Max 2 Jam (100% utuh)`);
    console.log(`- VIP Tier Power: Silver (+10%)`);
    console.log(`- Code Drop Power: Aktif (+50%)`);
    console.log(`===========================================`);
    console.log(`�� TOTAL DITERIMA: ${result.claimedAmount} ELIXIR`);
    
    if (result.claimedAmount === 8) {
        console.log(`🎯 TES SUKSES: Matematika sempurna (5 + 60% = 8 ELIXIR)`);
    } else {
        console.log(`⚠️ TES GAGAL: Harusnya 8 ELIXIR, malah dapat ${result.claimedAmount}`);
    }
  }

  await userModel.deleteOne({ telegramId: TEST_ID });
  await app.close();
  process.exit(0);
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
