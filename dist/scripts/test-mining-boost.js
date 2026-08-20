"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const users_service_1 = require("../users/users.service");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
async function runTest() {
    console.log("=== SIMULASI MINING BOOST (VIP + CODE DROP) ===");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const userModel = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
    const TEST_ID = "miner_test_999";
    await userModel.deleteOne({ telegramId: TEST_ID });
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 3);
    const expiryVoucher = new Date();
    expiryVoucher.setHours(expiryVoucher.getHours() + 5);
    await userModel.create({
        telegramId: TEST_ID,
        username: "MiningTester",
        firstName: "Tester",
        lastName: "",
        exp: 500,
        miningStartDate: startDate,
        isMiningBoosted: true,
        miningVoucherExpiry: expiryVoucher,
        adTickets: 1,
    });
    console.log("Menjalankan klaim mining...");
    const result = await usersService.claimMining(TEST_ID);
    if (result.error) {
        console.log("❌ Klaim gagal:", result.error);
    }
    else {
        console.log("✅ KLAIM BERHASIL!");
        console.log(`- Base (Is Boosted?): Ya (5 ELIXIR Base)`);
        console.log(`- Durasi mining: Max 2 Jam (100% utuh)`);
        console.log(`- VIP Tier Power: Silver (+10%)`);
        console.log(`- Code Drop Power: Aktif (+50%)`);
        console.log(`===========================================`);
        console.log(`�� TOTAL DITERIMA: ${result.claimedAmount} ELIXIR`);
        if (result.claimedAmount === 8) {
            console.log(`🎯 TES SUKSES: Matematika sempurna (5 + 60% = 8 ELIXIR)`);
        }
        else {
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
//# sourceMappingURL=test-mining-boost.js.map