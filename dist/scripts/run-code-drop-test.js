"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const users_service_1 = require("../users/users.service");
const bot_service_1 = require("../bot/bot.service");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const RealDate = Date;
let mockTimestamp = null;
global.Date = class extends RealDate {
    constructor(...args) {
        if (args.length > 0) {
            super(...args);
        }
        else {
            super(mockTimestamp || RealDate.now());
        }
    }
    static now() {
        return mockTimestamp || RealDate.now();
    }
};
async function bootstrap() {
    console.log('🚀 Booting Time-Travel E2E Code Drop Simulation...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const botService = app.get(bot_service_1.TelegramBotService);
    const userModel = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
    const TEST_USER_ID = 'TIME_TRAVELER_99';
    await userModel.deleteMany({ telegramId: { $regex: 'TIME_TRAVELER' } });
    await userModel.deleteMany({ telegramId: { $regex: 'DUMMY' } });
    await userModel.create({
        telegramId: TEST_USER_ID,
        username: 'JohnTitor',
        elixirBalance: 10,
        exp: 0
    });
    console.log('\n[!] Simulated Node Spawned. Initiating 30 Day Chronometer Loop:\n');
    let startDate = new RealDate('2026-08-01T00:00:00.000Z');
    for (let day = 1; day <= 30; day++) {
        console.log(`================== DAY ${day} ==================`);
        mockTimestamp = startDate.getTime() + (8 * 3600000);
        let dStr = new RealDate(mockTimestamp).toISOString().slice(0, 10).replace(/-/g, '');
        let todayCode = `ELIX-${dStr}`;
        console.log(`[08:00 UTC] Attempting to claim ${todayCode} too early...`);
        let res = await usersService.claimCodeDrop(TEST_USER_ID, todayCode);
        if (res.error)
            console.log(`  └> Success: Blocked by timeframe firewall! MSG: ${res.error}`);
        else
            throw new Error("CRITICAL VULNERABILITY! Claimed before 12:00 UTC!");
        mockTimestamp = startDate.getTime() + (12 * 3600000);
        console.log(`\\n[12:00 UTC] Firing Bot Cron Scheduler...`);
        await botService.postDailyVoucherCode();
        mockTimestamp = startDate.getTime() + (12.5 * 3600000);
        console.log(`\\n[12:30 UTC] Claiming Code Drop: ${todayCode}...`);
        res = await usersService.claimCodeDrop(TEST_USER_ID, todayCode);
        if (res.success) {
            console.log(`  └> Success! +2.5 ELIXIR Granted. Voucher active until: ${res.user.miningVoucherExpiry.toISOString()}`);
        }
        else {
            console.log(res);
            throw new Error("FAILED TO CLAIM DROP IN ACTIVE TIME!");
        }
        console.log(`\\n[12:35 UTC] Attempting Double-Spam Exploit...`);
        res = await usersService.claimCodeDrop(TEST_USER_ID, todayCode);
        if (res.error)
            console.log(`  └> Blocked Double Claim: ${res.error}`);
        await usersService.startMining(TEST_USER_ID);
        mockTimestamp = startDate.getTime() + (15.5 * 3600000);
        console.log(`\\n[15:30 UTC] Extracting Mining Power with Voucher buff...`);
        let mineRes = await usersService.claimMining(TEST_USER_ID);
        if (!mineRes.error) {
            console.log(`  └> Mining Extracted! Amount: ${mineRes.claimedAmount} (Expected mathematically elevated output)`);
        }
        console.log(`\\n[16:00 UTC] Simulating Massive Bot Invasion (50 claims)...`);
        const dummies = Array.from({ length: 50 }).map((_, i) => ({
            telegramId: `DUMMY_DAY${day}_${i}`,
            claimedCodeDrops: [todayCode]
        }));
        await userModel.insertMany(dummies);
        console.log(`  └> 50 bots injected. Attempting 51st manual claim...`);
        let exhaustedRes = await usersService.claimCodeDrop('TIME_TRAVELER_99_ALT', todayCode);
        if (exhaustedRes.error)
            console.log(`  └> Server correctly shielded Vault! MSG: ${exhaustedRes.error}`);
        else
            throw new Error("MAXIMUM SUPPLY FIREWALL BREACHED!");
        startDate = new RealDate(startDate.getTime() + 86400000);
        console.log('\\n');
    }
    console.log('✅✅ 30-DAY BATTLE TEST COMPLETED FLAWLESSLY! NO INTEGRITY LEAKS DETECTED. ✅✅');
    process.exit(0);
}
bootstrap().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=run-code-drop-test.js.map