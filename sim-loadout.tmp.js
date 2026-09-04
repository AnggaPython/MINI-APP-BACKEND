"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const auto_mining_service_1 = require("./src/auto-mining/auto-mining.service");
const buff_item_collections_service_1 = require("./src/buff-item-collections/buff-item-collections.service");
const user_schema_1 = require("./src/users/schemas/user.schema");
const buff_item_schema_1 = require("./src/buff-item-collections/schemas/buff-item.schema");
const user_buff_collection_schema_1 = require("./src/buff-item-collections/schemas/user-buff-collection.schema");
const mining_stone_schema_1 = require("./src/miner-stone/schemas/mining-stone.schema");
const case_box_schema_1 = require("./src/case-box/schemas/case-box.schema");
const auto_mining_schema_1 = require("./src/auto-mining/schemas/auto-mining.schema");
const SIM = "SIM_LOADOUT_008";
const fails = [];
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c)
    fails.push(m); };
async function main() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const userModel = mongoose_1.default.model("User", user_schema_1.UserSchema);
    const raw = mongoose_1.default.connection.db;
    const buffSvc = new buff_item_collections_service_1.BuffItemCollectionsService(mongoose_1.default.model("BuffItem", buff_item_schema_1.BuffItemSchema), mongoose_1.default.model("UserBuffCollection", user_buff_collection_schema_1.UserBuffCollectionSchema), userModel);
    const subModel = mongoose_1.default.model("AutoMiningSub", auto_mining_schema_1.AutoMiningSubSchema);
    const svc = new auto_mining_service_1.AutoMiningService(subModel, mongoose_1.default.model("AutoMiningDay", auto_mining_schema_1.AutoMiningDaySchema), userModel, mongoose_1.default.model("MiningStone", mining_stone_schema_1.MiningStoneSchema), mongoose_1.default.model("CaseBox", case_box_schema_1.CaseBoxSchema), {}, {}, buffSvc);
    await userModel.deleteOne({ telegramId: SIM }).exec();
    await raw.collection("user_buff_collections").deleteOne({ telegramId: SIM });
    await userModel.create({ telegramId: SIM, level: 20, elixirBalance: 1000000, ownedPickaxes: ["Common", "Uncommon"] });
    await raw.collection("user_buff_collections").insertOne({
        telegramId: SIM,
        inventory: [
            { instanceId: "sim-i1", baseItemId: "sim-buff-a", acquiredAt: new Date() },
            { instanceId: "sim-i2", baseItemId: "sim-buff-b", acquiredAt: new Date() },
            { instanceId: "sim-i3", baseItemId: "sim-buff-c", acquiredAt: new Date() },
        ],
        activeInstanceIds: ["sim-i3"],
    });
    const active = async () => (await raw.collection("user_buff_collections").findOne({ telegramId: SIM }))?.activeInstanceIds ?? [];
    let r = await svc.subscribe(SIM, { target: "stone", buffIds: ["nope-buff"] });
    ok(!r.success && /not owned/.test(r.error || ""), `L1 unowned buff rejected (got: ${r.error})`);
    const u1 = await userModel.findOne({ telegramId: SIM }).lean().exec();
    ok(u1.elixirBalance === 1000000, "L1 no charge on validation failure");
    r = await svc.subscribe(SIM, { target: "stone", buffIds: ["a", "b", "c", "d", "e", "f", "g"] });
    ok(!r.success && /At most 6/.test(r.error || ""), "L2 7 buffs rejected");
    r = await svc.subscribe(SIM, { target: "stone", favPickaxe: "Mythic" });
    ok(!r.success && /not owned/i.test(r.error || ""), `L3 unowned pickaxe rejected (got: ${r.error})`);
    r = await svc.subscribe(SIM, { target: "split", splitStonePct: 50, favPickaxe: "Uncommon", buffIds: ["sim-buff-a", "sim-buff-b"] });
    ok(r.success, `L4 subscribed (err: ${r.error || "-"})`);
    const act = await active();
    ok(act.includes("sim-i1") && act.includes("sim-i2") && !act.includes("sim-i3") && act.length === 2, `L4 buffs swapped to plan set (${JSON.stringify(act)})`);
    const sub = await subModel.findOne({ telegramId: SIM }).lean().exec();
    console.log("SUBDOC:", JSON.stringify(sub));
    ok(sub?.favPickaxe === "Uncommon" && JSON.stringify(sub?.planBuffs) === JSON.stringify(["sim-buff-a", "sim-buff-b"]), "L4 loadout stored");
    await svc.cancel(SIM);
    const act5 = await active();
    ok(act5.length === 0, `L5 cancel released buffs (${JSON.stringify(act5)})`);
    await userModel.deleteOne({ telegramId: SIM }).exec();
    await raw.collection("user_buff_collections").deleteOne({ telegramId: SIM });
    await subModel.deleteOne({ telegramId: SIM }).exec();
    await mongoose_1.default.model("AutoMiningDay", auto_mining_schema_1.AutoMiningDaySchema).deleteMany({ telegramId: SIM }).exec();
    console.log(`FAILS=${fails.length}`);
    if (fails.length)
        process.exit(2);
    console.log("LOADOUT SIM ALL PASSED");
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
//# sourceMappingURL=sim-loadout.tmp.js.map