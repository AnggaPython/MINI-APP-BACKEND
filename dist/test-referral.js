"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const users_service_1 = require("./src/users/users.service");
async function runTest() {
    console.log("🚀 Bootstraping backend modules...");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const UPLINE = "UPLINE_" + Date.now();
    const DOWNLINE = "DOWNLINE_" + Date.now();
    console.log("\n[1] Mendaftarkan Upline");
    await usersService.syncTelegramUser({ id: UPLINE, first_name: 'Upline' }, undefined);
    console.log("[2] Mensimulasikan Race Condition pendaftaran Downline (tanpa start_param dulu dari page.tsx)");
    await usersService.syncTelegramUser({ id: DOWNLINE, first_name: 'Downline' }, undefined);
    console.log("[3] Mensimulasikan /sync kedua pada Downline DENGAN start_param dari header.tsx");
    await usersService.syncTelegramUser({ id: DOWNLINE, first_name: 'Downline' }, UPLINE);
    console.log("\n[Cek Validasi] Mengecek apakah Downline berhasil di-capture oleh server...");
    const stats = await usersService.getReferralStats(UPLINE);
    console.log(`- Total Referral Milik Upline (Network): ${stats.totalReferrals} users`);
    if (stats.totalReferrals > 0) {
        console.log("✅ SUKSES! Start_param terselamatkan dari Race Condition.");
    }
    else {
        console.log("❌ GAGAL! Start_param hilang.");
    }
    console.log("\n[4] 💵 Simulasi Downline komplit 1 task Airdrop...");
    const uplineCut = 15.5;
    await usersService.creditReferralBonus(UPLINE, uplineCut, "downline_user", "Test Ad Task");
    const stats2 = await usersService.getReferralStats(UPLINE);
    console.log(`- Earning Balance Upline (Komisi Task Downline): ${stats2.referralBalance} ELIXIR`);
    if (stats2.referralBalance === 15.5) {
        console.log("✅ SUKSES! Komisi task otomatis mendarat sempurna ke saldo Referral Murni Upline.");
    }
    await app.close();
    process.exit(0);
}
runTest();
//# sourceMappingURL=test-referral.js.map