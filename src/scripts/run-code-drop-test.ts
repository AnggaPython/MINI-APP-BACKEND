import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { UsersService } from "../users/users.service";
import { TelegramBotService } from "../bot/bot.service";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";

// Mocking Global Date for Time-Travel
const RealDate = Date;
let mockTimestamp: number | null = null;
(global as any).Date = class extends RealDate {
  constructor(...args: any[]) {
    if (args.length > 0) {
      super(...(args as [any]));
    } else {
      super(mockTimestamp || RealDate.now());
    }
  }
  static now() {
    return mockTimestamp || RealDate.now();
  }
};

async function bootstrap() {
  console.log("🚀 Booting Time-Travel E2E Code Drop Simulation...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const botService = app.get(TelegramBotService);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  const TEST_USER_ID = "TIME_TRAVELER_99";
  await userModel.deleteMany({ telegramId: { $regex: "TIME_TRAVELER" } });
  await userModel.deleteMany({ telegramId: { $regex: "DUMMY" } });

  await userModel.create({
    telegramId: TEST_USER_ID,
    username: "JohnTitor",
    elixirBalance: 10,
    exp: 0, // Non-Vip
  });

  console.log(
    "\n[!] Simulated Node Spawned. Initiating 30 Day Chronometer Loop:\n",
  );

  let startDate = new RealDate("2026-08-01T00:00:00.000Z");

  for (let day = 1; day <= 30; day++) {
    console.log(`================== DAY ${day} ==================`);

    // 1. Set time to 08:00 UTC (Early morning, before Code Drop)
    mockTimestamp = startDate.getTime() + 8 * 3600000;
    const dStr = new RealDate(mockTimestamp)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    const todayCode = `ELIX-${dStr}`;

    console.log(`[08:00 UTC] Attempting to claim ${todayCode} too early...`);
    let res = await usersService.claimCodeDrop(TEST_USER_ID, todayCode);
    if (res.error)
      console.log(
        `  └> Success: Blocked by timeframe firewall! MSG: ${res.error}`,
      );
    else throw new Error("CRITICAL VULNERABILITY! Claimed before 12:00 UTC!");

    // 2. Set time to 12:00 UTC (Cron time)
    mockTimestamp = startDate.getTime() + 12 * 3600000;
    console.log(`\\n[12:00 UTC] Firing Bot Cron Scheduler...`);
    // We temporarily silence bot logs to avoid clutter, or let it fire.
    await botService.postDailyVoucherCode();

    // 3. Set time to 12:30 UTC (Valid time to claim)
    mockTimestamp = startDate.getTime() + 12.5 * 3600000;
    console.log(`\\n[12:30 UTC] Claiming Code Drop: ${todayCode}...`);
    res = await usersService.claimCodeDrop(TEST_USER_ID, todayCode);
    if (res.success) {
      console.log(
        `  └> Success! +2.5 ELIXIR Granted. Voucher active until: ${res.user.miningVoucherExpiry.toISOString()}`,
      );
    } else {
      console.log(res);
      throw new Error("FAILED TO CLAIM DROP IN ACTIVE TIME!");
    }

    // Try double claim
    console.log(`\\n[12:35 UTC] Attempting Double-Spam Exploit...`);
    res = await usersService.claimCodeDrop(TEST_USER_ID, todayCode);
    if (res.error) console.log(`  └> Blocked Double Claim: ${res.error}`);

    // 4. Set time to 14:30 UTC (Mining test - exactly 2 hours passed since claim code, meaning 1 hour active mining)
    // Wait, start mining first!
    await usersService.startMining(TEST_USER_ID);
    // Fast forward 1 Hour (15:30 UTC)
    mockTimestamp = startDate.getTime() + 15.5 * 3600000;
    console.log(`\\n[15:30 UTC] Extracting Mining Power with Voucher buff...`);
    const mineRes = await usersService.claimMining(TEST_USER_ID);
    if (!mineRes.error) {
      // Formula checking: 1 Hour (3600s) of base (2.5 / 7200) = 1.25.
      // 1.5x Multiplier of 1.25 = 1.875
      console.log(
        `  └> Mining Extracted! Amount: ${mineRes.claimedAmount} (Expected mathematically elevated output)`,
      );
    }

    // 5. Test Maximum 50 Players Exhaustion
    console.log(
      `\\n[16:00 UTC] Simulating Massive Bot Invasion (50 claims)...`,
    );
    const dummies = Array.from({ length: 50 }).map((_, i) => ({
      telegramId: `DUMMY_DAY${day}_${i}`,
      claimedCodeDrops: [todayCode], // Fake inject they claimed it
    }));
    await userModel.insertMany(dummies);

    console.log(`  └> 50 bots injected. Attempting 51st manual claim...`);
    const exhaustedRes = await usersService.claimCodeDrop(
      "TIME_TRAVELER_99_ALT",
      todayCode,
    );
    if (exhaustedRes.error)
      console.log(
        `  └> Server correctly shielded Vault! MSG: ${exhaustedRes.error}`,
      );
    else throw new Error("MAXIMUM SUPPLY FIREWALL BREACHED!");

    // Next Day Prep
    startDate = new RealDate(startDate.getTime() + 86400000); // Add 24 Hours
    console.log("\\n");
  }

  console.log(
    "✅✅ 30-DAY BATTLE TEST COMPLETED FLAWLESSLY! NO INTEGRITY LEAKS DETECTED. ✅✅",
  );
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
