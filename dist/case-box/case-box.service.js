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
exports.CaseBoxService = exports.CASE_MATERIALS = exports.CASE_DURABILITY_COST = exports.CASE_HP_BANDS = exports.MATERIAL_AMOUNTS = exports.ELIXCOIN_BANDS = exports.BUFF_RARITY_WEIGHTS = exports.LOOT_RARITY_WEIGHTS = exports.OUTCOME_WEIGHTS = exports.CASE_TIER_WEIGHTS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const case_box_schema_1 = require("./schemas/case-box.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_service_1 = require("../users/users.service");
const buff_item_collections_service_1 = require("../buff-item-collections/buff-item-collections.service");
const leveling_service_1 = require("../leveling-miner/leveling.service");
exports.CASE_TIER_WEIGHTS = {
    COMMON: 70,
    MEDIUM: 25,
    RARE: 5,
};
exports.OUTCOME_WEIGHTS = {
    MATERIAL: 20,
    BUFF: 45,
    ZONK: 25,
    ELIXCOIN: 10,
};
exports.LOOT_RARITY_WEIGHTS = {
    COMMON: 70,
    MEDIUM: 22,
    RARE: 8,
};
exports.BUFF_RARITY_WEIGHTS = {
    COMMON: 60,
    MEDIUM: 15,
    RARE: 5,
    ULTRA_RARE: 0.5,
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
    COMMON: [180, 200],
    MEDIUM: [200, 250],
    RARE: [250, 400],
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
const MAX_PLAYER_ATK = 120;
const HIT_INTERVAL_MS = 1700;
const CASE_COOLDOWN_MS = 78_000;
const DESTROY_RATE_LIMIT = 5;
const DESTROY_RATE_WINDOW_MS = 60_000;
let CaseBoxService = class CaseBoxService {
    caseBoxModel;
    userModel;
    usersService;
    buffCollectionsService;
    levelingService;
    lastSpawnAt = new Map();
    destroyTimestamps = new Map();
    lastClaimAt = new Map();
    constructor(caseBoxModel, userModel, usersService, buffCollectionsService, levelingService) {
        this.caseBoxModel = caseBoxModel;
        this.userModel = userModel;
        this.usersService = usersService;
        this.buffCollectionsService = buffCollectionsService;
        this.levelingService = levelingService;
    }
    evictRateLimit(telegramId, now) {
        const ts = this.destroyTimestamps.get(telegramId);
        if (!ts)
            return;
        const cutoff = now - DESTROY_RATE_WINDOW_MS;
        const filtered = ts.filter((t) => t > cutoff);
        if (filtered.length === 0) {
            this.destroyTimestamps.delete(telegramId);
        }
        else {
            this.destroyTimestamps.set(telegramId, filtered);
        }
    }
    getCooldownLeft(telegramId, now) {
        const last = this.lastClaimAt.get(telegramId);
        if (!last)
            return 0;
        return Math.max(0, CASE_COOLDOWN_MS - (now - last));
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
        const cooldownLeft = this.getCooldownLeft(telegramId, now);
        if (cooldownLeft > 0) {
            return {
                success: false,
                error: "Please wait before opening another case.",
                cooldownLeft,
            };
        }
        let levelMultiplier = 1;
        try {
            const userDoc = await this.userModel.findOne({ telegramId }).lean().exec();
            const userLevel = userDoc?.level || 1;
            levelMultiplier = (0, leveling_service_1.getLevelMultiplier)(userLevel);
        }
        catch { }
        const clientSeed = `${telegramId}:${now}`;
        const tierRoll = this.roll01(clientSeed, "case-tier");
        const tier = this.weightedPick(tierRoll, exports.CASE_TIER_WEIGHTS);
        const hpRoll = this.roll01(clientSeed, "case-hp");
        const [hpMin, hpMax] = exports.CASE_HP_BANDS[tier];
        const baseHp = hpMin + (hpMax - hpMin) * hpRoll;
        const maxHp = Math.round(baseHp * levelMultiplier);
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
        const now = Date.now();
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user) {
            return {
                success: false,
                error: "User account not found. Please reload the app.",
            };
        }
        this.evictRateLimit(telegramId, now);
        const recentDestroys = this.destroyTimestamps.get(telegramId) || [];
        if (recentDestroys.length >= DESTROY_RATE_LIMIT) {
            return {
                success: false,
                error: "Too many requests. Please wait a moment.",
            };
        }
        const pending = await this.caseBoxModel
            .findOne({ _id: caseId, telegramId, status: "active" })
            .lean()
            .exec();
        if (!pending) {
            return { success: false, error: "Case not found or already opened." };
        }
        const minHits = Math.ceil(pending.maxHp / MAX_PLAYER_ATK);
        const minRequiredTime = Math.max(0, (minHits - 1) * HIT_INTERVAL_MS - 500);
        const caseAge = now - new Date(pending.createdAt).getTime();
        if (caseAge < minRequiredTime) {
            return {
                success: false,
                error: "Case not ready yet. Keep hitting the lock!",
            };
        }
        const box = await this.caseBoxModel
            .findOneAndUpdate({ _id: caseId, telegramId, status: "active" }, { $set: { status: "opened" } }, { returnDocument: "after" })
            .exec();
        if (!box) {
            return { success: false, error: "Case not found or already opened." };
        }
        let economyMultiplier = 1;
        let droprateBonus = 0;
        try {
            const buffTotals = await this.buffCollectionsService.getUserBuffTotals(telegramId);
            if (buffTotals.totals?.ECONOMY)
                economyMultiplier = 1 + buffTotals.totals.ECONOMY / 100;
            if (buffTotals.totals?.DROPRATE)
                droprateBonus = buffTotals.totals.DROPRATE;
        }
        catch { }
        const boostedMaterialWeights = { ...exports.LOOT_RARITY_WEIGHTS };
        const boostedBuffWeights = { ...exports.BUFF_RARITY_WEIGHTS };
        if (droprateBonus > 0) {
            const rareBoost = Math.min(droprateBonus, 30);
            const ultraBoost = rareBoost * 0.3;
            boostedMaterialWeights.RARE = exports.LOOT_RARITY_WEIGHTS.RARE + rareBoost;
            boostedMaterialWeights.COMMON = Math.max(10, exports.LOOT_RARITY_WEIGHTS.COMMON - rareBoost);
            boostedBuffWeights.RARE = exports.BUFF_RARITY_WEIGHTS.RARE + rareBoost;
            boostedBuffWeights.ULTRA_RARE = exports.BUFF_RARITY_WEIGHTS.ULTRA_RARE + ultraBoost;
            boostedBuffWeights.COMMON = Math.max(10, exports.BUFF_RARITY_WEIGHTS.COMMON - rareBoost - ultraBoost);
        }
        const clientSeed = `${telegramId}:${box._id}:${Date.now()}`;
        const outcomeRoll = this.roll01(clientSeed, "case-outcome");
        const outcome = this.weightedPick(outcomeRoll, exports.OUTCOME_WEIGHTS);
        let rarity = null;
        let loot = null;
        let buffGranted = null;
        if (outcome === "ZONK") {
            loot = null;
        }
        else if (outcome === "ELIXCOIN") {
            let levelMult = 1;
            try {
                const userDoc = await this.userModel.findOne({ telegramId }).lean().exec();
                const userLevel = userDoc?.level || 1;
                levelMult = (0, leveling_service_1.getLevelMultiplier)(userLevel);
            }
            catch { }
            const [min, max] = exports.ELIXCOIN_BANDS[box.tier];
            const scaledMin = Math.round(min * levelMult);
            const scaledMax = Math.round(max * levelMult);
            const base = Math.floor(scaledMin + Math.random() * (scaledMax - scaledMin + 1));
            const amount = Math.round(base * economyMultiplier);
            loot = { ELIXCOIN: amount };
        }
        else if (outcome === "MATERIAL") {
            const rarityRoll = this.roll01(clientSeed, "case-rarity");
            rarity = this.weightedPick(rarityRoll, boostedMaterialWeights);
            const pool = exports.CASE_MATERIALS[rarity];
            const lootName = pool[Math.floor(Math.random() * pool.length)];
            loot = { [lootName]: 1 };
        }
        else if (outcome === "BUFF") {
            const buffRarityRoll = this.roll01(clientSeed, "case-buff-rarity");
            const buffRarity = this.weightedPick(buffRarityRoll, boostedBuffWeights);
            const grantResult = await this.buffCollectionsService.grantRandomBuff(telegramId, buffRarity);
            buffGranted = grantResult;
            if (grantResult?.buffItem) {
                rarity = grantResult.buffItem.rarity;
                loot = { [grantResult.buffItem.name]: 1 };
            }
            else {
                let levelMultFallback = 1;
                try {
                    const userDoc = await this.userModel.findOne({ telegramId }).lean().exec();
                    const userLevel = userDoc?.level || 1;
                    levelMultFallback = (0, leveling_service_1.getLevelMultiplier)(userLevel);
                }
                catch { }
                const [min, max] = exports.ELIXCOIN_BANDS[box.tier];
                const scaledMinFb = Math.round(min * levelMultFallback);
                const scaledMaxFb = Math.round(max * levelMultFallback);
                const base = Math.floor(scaledMinFb + Math.random() * (scaledMaxFb - scaledMinFb + 1));
                const amount = Math.round(base * economyMultiplier);
                loot = { ELIXCOIN: amount };
            }
        }
        const userTimestamps = this.destroyTimestamps.get(telegramId) || [];
        userTimestamps.push(now);
        this.destroyTimestamps.set(telegramId, userTimestamps);
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
        let starResult;
        try {
            starResult = await this.levelingService.awardCaseXp(telegramId, pending.tier);
        }
        catch {
            starResult = { starCount: Math.floor(Math.random() * 5) + 1, xpAwarded: 0, level: 1, levelUp: false, newLevel: 1, pickaxeGrants: [], pendingStars: 0, lockedLevel: null };
        }
        let levelMultiplier = 1;
        try {
            const userDoc = await this.userModel.findOne({ telegramId }).lean().exec();
            const userLevel = userDoc?.level || 1;
            levelMultiplier = (0, leveling_service_1.getLevelMultiplier)(userLevel);
        }
        catch { }
        return {
            success: true,
            caseId: box._id.toString(),
            tier: pending.tier,
            outcome,
            rarity,
            loot,
            buffGranted: outcome === "BUFF" ? buffGranted : undefined,
            economyMultiplier: economyMultiplier > 1 ? economyMultiplier : undefined,
            droprateBonus: droprateBonus > 0 ? droprateBonus : undefined,
            starCount: starResult.starCount,
            xpAwarded: starResult.xpAwarded,
            level: starResult.level,
            levelUp: starResult.levelUp,
            newLevel: starResult.newLevel,
            pickaxeGrants: starResult.pickaxeGrants,
            pendingStars: starResult.pendingStars,
            lockedLevel: starResult.lockedLevel,
            levelMultiplier,
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
            .findOneAndUpdate({ _id: caseId, telegramId, status: "opened" }, { $set: { status: "claimed", claimedAt: new Date() } }, { returnDocument: "after" })
            .exec();
        if (!boxToClaim) {
            return { success: false, error: "Concurreny error: already claimed." };
        }
        this.lastClaimAt.set(telegramId, Date.now());
        if (this.lastClaimAt.size > 5000) {
            const cutoff = Date.now() - CASE_COOLDOWN_MS * 2;
            for (const [key, ts] of this.lastClaimAt) {
                if (ts < cutoff)
                    this.lastClaimAt.delete(key);
            }
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
        users_service_1.UsersService,
        buff_item_collections_service_1.BuffItemCollectionsService,
        leveling_service_1.LevelingService])
], CaseBoxService);
//# sourceMappingURL=case-box.service.js.map