"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const leveling_service_1 = require("./src/leveling-miner/leveling.service");
const users_service_1 = require("./src/users/users.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const SIM_ID = "SIM_XP_005";
const fails = [];
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c)
    fails.push(m); };
async function main() {
    console.log("t=0 connecting...");
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log("connected");
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const raw = mongoose_1.default.connection.db.collection("users");
    const leveling = new leveling_service_1.LevelingService(userModel);
    const U = () => userModel.findOne({ telegramId: SIM_ID }).lean().exec();
    const stillNull = await raw.countDocuments({ $or: [{ vipExp: null }, { vipExp: { $exists: false } }] });
    ok(stillNull === 0, `backfill holds (remaining null: ${stillNull})`);
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    await userModel.create({ telegramId: SIM_ID, level: 1, gameExp: 0, exp: 0 });
    console.log("rates:", JSON.stringify(leveling_service_1.STAR_XP_PER_TIER));
    ok(leveling_service_1.STAR_XP_PER_TIER.Common === 10 && leveling_service_1.STAR_XP_PER_TIER.Medium === 25 && leveling_service_1.STAR_XP_PER_TIER.Rare === 60, "rates 10/25/60");
    for (const [tier, rate] of [["Common", 10], ["Medium", 25], ["Rare", 60], ["COMMON", 10], ["MEDIUM", 25], ["RARE", 60]]) {
        for (let i = 0; i < 6; i++) {
            const r = await leveling.awardStoneXp(SIM_ID, tier);
            if (!(r.starCount >= 1 && r.starCount <= 5))
                ok(false, `${tier}: star out of range ${r.starCount}`);
            if (r.xpAwarded !== r.starCount * rate)
                ok(false, `${tier}: xpAwarded ${r.xpAwarded} != ${r.starCount}x${rate}`);
        }
    }
    console.log("PH2 done (36 breaks)");
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { vipExp: 0, profileXp: 0 } }).exec();
    const vip = async () => (await U()).vipExp ?? -999;
    await leveling.awardStoneXp(SIM_ID, "Common");
    ok((await vip()) === 0, "Common -> vipExp 0");
    await leveling.awardStoneXp(SIM_ID, "COMMON");
    ok((await vip()) === 0, "COMMON case -> vipExp 0");
    await leveling.awardStoneXp(SIM_ID, "Medium");
    ok((await vip()) === 1, "Medium -> vipExp 1");
    await leveling.awardStoneXp(SIM_ID, "MEDIUM");
    ok((await vip()) === 2, "MEDIUM case -> vipExp 2");
    await leveling.awardStoneXp(SIM_ID, "Rare");
    ok((await vip()) === 3, "Rare -> vipExp 3");
    await leveling.awardStoneXp(SIM_ID, "RARE");
    ok((await vip()) === 4, "RARE case -> vipExp 4");
    console.log("PH3 done");
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { vipExp: 99, gameExp: 50000, exp: 50000 } }).exec();
    ok((0, users_service_1.getUserVipRank)(99).name === "NON-VIP", "vipExp 99 + gameExp 50k -> NON-VIP");
    ok((0, users_service_1.getUserVipRank)(100).name === "BRONZE", "vipExp 100 -> BRONZE");
    ok((0, users_service_1.getUserVipRank)(1000).name === "SILVER" && (0, users_service_1.getUserVipRank)(2000).name === "GOLD", "ladder intact");
    console.log("PH4 done");
    await userModel.updateOne({ telegramId: SIM_ID }, { $set: { level: 1, gameExp: 0, exp: 0, lockedLevel: null, pendingStars: 0 } }).exec();
    let sumXp = 0, n = 0;
    for (let i = 0; i < 40; i++) {
        const r = await leveling.awardStoneXp(SIM_ID, "Common");
        sumXp += r.starCount * 10;
        n++;
        const u = await U();
        if ((u.level ?? 1) >= 6 || u.lockedLevel)
            break;
    }
    const u5 = await U();
    ok((u5.gameExp ?? -1) === sumXp, `gameExp ${u5.gameExp} == sum ${sumXp} (${n} stones)`);
    console.log(`PH5: Lv${u5.level} gameExp=${u5.gameExp} locked=${u5.lockedLevel ?? "-"}`);
    await userModel.deleteOne({ telegramId: SIM_ID }).exec();
    console.log(`FAILS=${fails.length}`);
    if (fails.length) {
        console.log("FAILURES:\n- " + fails.join("\n- "));
        process.exitCode = 2;
        return;
    }
    console.log("XP SIM ALL PASSED");
    await mongoose_1.default.disconnect();
}
main().then(() => process.exit(0)).catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-xp2.tmp.js.map