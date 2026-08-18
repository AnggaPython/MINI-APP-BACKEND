"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseBoxService = exports.CASE_MATERIALS = exports.CASE_DURABILITY_COST = exports.CASE_HP_BANDS = exports.MATERIAL_AMOUNTS = exports.ELIXCOIN_BANDS = exports.LOOT_RARITY_WEIGHTS = exports.OUTCOME_WEIGHTS = exports.CASE_TIER_WEIGHTS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const case_box_schema_1 = require("./schemas/case-box.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_service_1 = require("../users/users.service");
exports.CASE_TIER_WEIGHTS = {
    COMMON: 70,
    MEDIUM: 25,
    RARE: 5,
};
exports.OUTCOME_WEIGHTS = {
    MATERIAL: 30,
    ZONK: 35,
    ELIXCOIN: 35,
};
exports.LOOT_RARITY_WEIGHTS = {
    COMMON: 70,
    MEDIUM: 22,
    RARE: 8,
};
exports.ELIXCOIN_BANDS = {
    COMMON: [100, 500],
    MEDIUM: [300, 1200],
    RARE: [800, 3000],
};
exports.MATERIAL_AMOUNTS = {
    COMMON: [1, 1],
    MEDIUM: [1, 1],
    RARE: [1, 1],
};
exports.CASE_HP_BANDS = {
    COMMON: [12, 24],
    MEDIUM: [18, 36],
    RARE: [27, 54],
};
exports.CASE_DURABILITY_COST = 3;
exports.CASE_MATERIALS = {
    COMMON: [
        "Rusty Nail",
        "Wooden Handle",
        "Iron Shard",
        "Copper Wire",
        "Flint Stone",
        "Hemp Rope",
        "Leather Strap",
        "Clay Mold",
        "Tin Plate",
        "Bone Fragment",
        "Sandstone Grit",
        "Charcoal Lump",
        "Glass Shard",
        "Rubber Grip",
        "Brass Rivet",
        "Canvas Wrap",
        "Iron Bolt",
        "Slate Chip",
        "Twine Coil",
        "Wax Seal",
        "Stone Wheel",
        "Bronze Pin",
        "Ash Plank",
        "Cloth Strip",
        "Pig Iron Ingot",
    ],
    MEDIUM: [
        "Steel Alloy",
        "Silver Filament",
        "Copper Coil",
        "Magnet Core",
        "Quartz Crystal",
        "Reinforced Spring",
        "Tempered Glass",
        "Gold Plating",
        "Titanium Screw",
        "Carbon Fiber",
        "Enchanted Rune",
        "Sapphire Lens",
        "Power Cell",
        "Hydraulic Pump",
        "Servo Motor",
        "Platinum Wire",
        "Crystal Gear",
        "Obsidian Blade",
        "Neon Capacitor",
        "Phantom Core",
        "Emerald Driver",
        "Chrono Spring",
        "Plasma Coil",
        "Arcane Alloy",
        "Magnetic Array",
    ],
    RARE: [
        "Void Diamond",
        "Phoenix Feather",
        "Dragon Scale",
        "Celestial Core",
        "Quantum Shard",
        "Starforged Ingot",
        "Infinity Crystal",
        "Thunder Essence",
        "Abyss Pearl",
        "Solar Fragment",
        "Lunar Prism",
        "Chaos Ember",
        "Titan Heart",
        "Etherium Wire",
        "Rift Anchor",
        "Frost Nova Core",
        "Pyroclasm Gem",
        "Nebula Dust",
        "Singularity Bolt",
        "Godslayer Alloy",
        "Timeless Gear",
        "Dimension Key",
        "Eternity Matrix",
        "Primordial Ore",
        "Omega Circuit",
    ],
};
const SPAWN_THROTTLE_MS = 800;
const ACTIVE_CASE_TTL_MS = 2 * 60 * 60 * 1000;
const OPENED_CASE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 50;
let CaseBoxService = class CaseBoxService {
    caseBoxModel;
    userModel;
    usersService;
    lastSpawnAt = new Map();
    constructor(caseBoxModel, userModel, usersService) {
        this.caseBoxModel = caseBoxModel;
        this.userModel = userModel;
        this.usersService = usersService;
    }
    roll01(clientSeed, purpose) {
        const serverSeed = crypto.randomBytes(16).toString("hex");
        const hash = crypto
            .createHmac("sha256", serverSeed)
            .update(`${clientSeed}:${purpose}`)
            .digest("hex");
        const parsed = parseInt(hash.substring(0, 8), 16);
        return parsed / 0xffffffff;
    }
    weightedPick(roll, weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let acc = 0;
        for (const [key, w] of Object.entries(weights)) {
            acc += w;
            if (roll < acc / total)
                return key;
        }
        return Object.keys(weights)[Object.keys(weights).length - 1];
    }
    async spawn(telegramId) {
        const now = Date.now();
        const last = this.lastSpawnAt.get(telegramId);
        if (last && now - last < SPAWN_THROTTLE_MS) {
            return {
                success: false,
                error: "Please wait a moment before spawning a new case.",
            };
        }
        this.lastSpawnAt.set(telegramId, now);
        if (this.lastSpawnAt.size > 5000) {
            for (const [key, ts] of this.lastSpawnAt) {
                if (now - ts > 60000)
                    this.lastSpawnAt.delete(key);
            }
        }
        const clientSeed = `${telegramId}:${now}`;
        const tierRoll = this.roll01(clientSeed, "case-tier");
        const tier = this.weightedPick(tierRoll, exports.CASE_TIER_WEIGHTS);
        const hpRoll = this.roll01(clientSeed, "case-hp");
        const [hpMin, hpMax] = exports.CASE_HP_BANDS[tier];
        const maxHp = Math.round(hpMin + (hpMax - hpMin) * hpRoll);
        const box = await new this.caseBoxModel({
            telegramId,
            tier,
            maxHp,
            status: "active",
            expireAt: new Date(now + ACTIVE_CASE_TTL_MS),
        }).save();
        return {
            success: true,
            durabilityCost: exports.CASE_DURABILITY_COST,
            box: {
                caseId: box._id.toString(),
                tier: box.tier,
                maxHp: box.maxHp,
            },
        };
    }
    async destroy(telegramId, caseId) {
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user) {
            return {
                success: false,
                error: "User account not found. Please reload the app.",
            };
        }
        const pending = await this.caseBoxModel
            .findOne({ _id: caseId, telegramId, status: "active" })
            .lean()
            .exec();
        if (!pending) {
            return { success: false, error: "Case not found or already opened." };
        }
        const box = await this.caseBoxModel
            .findOneAndUpdate({ _id: caseId, telegramId, status: "active" }, { $set: { status: "opened" } }, { returnDocument: "after" })
            .exec();
        if (!box) {
            return { success: false, error: "Case not found or already opened." };
        }
        const clientSeed = `${telegramId}:${box._id}:${Date.now()}`;
        const outcomeRoll = this.roll01(clientSeed, "case-outcome");
        const outcome = this.weightedPick(outcomeRoll, exports.OUTCOME_WEIGHTS);
        let rarity = null;
        let loot = null;
        if (outcome === "ZONK") {
            loot = null;
        }
        else if (outcome === "ELIXCOIN") {
            const [min, max] = exports.ELIXCOIN_BANDS[box.tier];
            const amount = Math.floor(min + Math.random() * (max - min + 1));
            loot = { ELIXCOIN: amount };
        }
        else {
            const rarityRoll = this.roll01(clientSeed, "case-rarity");
            rarity = this.weightedPick(rarityRoll, exports.LOOT_RARITY_WEIGHTS);
            const pool = exports.CASE_MATERIALS[rarity];
            const lootName = pool[Math.floor(Math.random() * pool.length)];
            loot = { [lootName]: 1 };
        }
        await this.caseBoxModel
            .updateOne({ _id: caseId }, {
            $set: {
                rarity,
                outcome,
                loot,
                openedAt: new Date(),
            },
        })
            .exec();
        return {
            success: true,
            caseId: box._id.toString(),
            tier: pending.tier,
            outcome,
            rarity,
            loot,
        };
    }
    async claimCase(caseId, telegramId) {
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { success: false, error: "User not found" };
        const opened = await this.caseBoxModel
            .findOne({ _id: caseId, telegramId, status: "opened" })
            .lean()
            .exec();
        if (!opened) {
            return { success: false, error: "Case not ready for claim or already claimed." };
        }
        const { tier, outcome, loot } = opened;
        const adRequired = tier === "MEDIUM" || tier === "RARE";
        if (outcome !== "ZONK" && adRequired && (user.adTickets || 0) < 1) {
            return {
                success: false,
                adRequired: true,
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }
        const boxToClaim = await this.caseBoxModel
            .findOneAndUpdate({ _id: caseId, telegramId, status: "opened" }, { $set: { status: "claimed" } }, { returnDocument: "after" })
            .exec();
        if (!boxToClaim) {
            return { success: false, error: "Concurreny error: already claimed." };
        }
        if (outcome !== "ZONK" && loot) {
            const inc = {};
            for (const [key, value] of Object.entries(loot)) {
                inc[`cryptoBalances.${key}`] = value;
            }
            if (adRequired)
                inc["adTickets"] = -1;
            const credited = await this.userModel
                .findOneAndUpdate(adRequired ? { telegramId, adTickets: { $gte: 1 } } : { telegramId }, { $inc: inc })
                .exec();
            if (adRequired && !credited) {
                return {
                    success: false,
                    adRequired: true,
                    error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap to claim again.",
                };
            }
        }
        return { success: true };
    }
    async history(telegramId) {
        const boxes = await this.caseBoxModel
            .find({ telegramId, status: "opened" })
            .sort({ openedAt: -1 })
            .limit(HISTORY_LIMIT)
            .lean()
            .exec();
        return {
            success: true,
            history: boxes.map((box) => ({
                caseId: box._id.toString(),
                tier: box.tier,
                maxHp: box.maxHp,
                outcome: box.outcome,
                rarity: box.lootRarity,
                loot: box.loot || {},
                openedAt: box.openedAt,
            })),
        };
    }
};
exports.CaseBoxService = CaseBoxService;
exports.CaseBoxService = CaseBoxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(case_box_schema_1.CaseBox.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService])
], CaseBoxService);
//# sourceMappingURL=case-box.service.js.map