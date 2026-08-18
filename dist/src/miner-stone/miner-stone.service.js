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
var MinerStoneService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinerStoneService = exports.PICKAXE_COSTS = exports.PICKAXE_TIERS = exports.ELIX_RATES = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const mining_stone_schema_1 = require("./schemas/mining-stone.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_service_1 = require("../users/users.service");
const TIER_CONFIG = {
    Common: {
        hpMin: 30,
        hpMax: 80,
        weight: 85000,
        rewards: {
            IRON: [500, 10000],
            COPPER: [250, 5000],
        },
    },
    Medium: {
        hpMin: 60,
        hpMax: 160,
        weight: 97000,
        rewards: {
            SILVER: [100, 2000],
            GOLD: [5, 10],
        },
    },
    Rare: {
        hpMin: 90,
        hpMax: 360,
        weight: 100000,
        rewards: {
            GOLD: [10, 50],
            DIAMOND: [5, 10],
        },
    },
};
const SPAWN_THROTTLE_MS = 800;
const ACTIVE_STONE_TTL_MS = 2 * 60 * 60 * 1000;
const CLAIMED_STONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 50;
const ZONK_CHANCE = 0.1;
exports.ELIX_RATES = {
    IRON: 0.00005,
    COPPER: 0.000075,
    SILVER: 0.1,
    GOLD: 1,
    DIAMOND: 20,
};
exports.PICKAXE_TIERS = [
    "Common",
    "Uncommon",
    "Rare",
    "Epic",
    "Legendary",
    "Mythic",
];
exports.PICKAXE_COSTS = {
    Uncommon: { GOLD: 1000, DIAMOND: 10 },
    Rare: { GOLD: 5000, DIAMOND: 50 },
    Epic: { GOLD: 20000, DIAMOND: 200 },
    Legendary: { GOLD: 100000, DIAMOND: 1000 },
    Mythic: { GOLD: 500000, DIAMOND: 5000 },
};
const PICKAXE_PREV = {
    Uncommon: "Common",
    Rare: "Uncommon",
    Epic: "Rare",
    Legendary: "Epic",
    Mythic: "Legendary",
};
const PICKAXE_REPAIR_COSTS = {
    Common: { IRON: 1000 },
    Uncommon: { SILVER: 800 },
    Rare: { GOLD: 150 },
    Epic: { GOLD: 500 },
    Legendary: { GOLD: 2000 },
    Mythic: { GOLD: 5000, DIAMOND: 50 },
};
const RESOURCE_KEYS = ["IRON", "COPPER", "SILVER", "GOLD", "DIAMOND"];
let MinerStoneService = MinerStoneService_1 = class MinerStoneService {
    miningStoneModel;
    userModel;
    usersService;
    logger = new common_1.Logger(MinerStoneService_1.name);
    lastSpawnAt = new Map();
    constructor(miningStoneModel, userModel, usersService) {
        this.miningStoneModel = miningStoneModel;
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
    round2(n) {
        return Math.round(n * 100) / 100;
    }
    async spawn(telegramId) {
        const now = Date.now();
        const last = this.lastSpawnAt.get(telegramId);
        if (last && now - last < SPAWN_THROTTLE_MS) {
            return {
                success: false,
                error: "Please wait a moment before spawning a new stone.",
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
        const tierRoll = this.roll01(clientSeed, "tier");
        let tier;
        if (tierRoll < TIER_CONFIG.Common.weight / 100000)
            tier = "Common";
        else if (tierRoll < TIER_CONFIG.Medium.weight / 100000)
            tier = "Medium";
        else
            tier = "Rare";
        const cfg = TIER_CONFIG[tier];
        const hpRoll = this.roll01(clientSeed, "hp");
        const maxHp = this.round2(cfg.hpMin + (cfg.hpMax - cfg.hpMin) * hpRoll);
        const zonk = this.roll01(clientSeed, "zonk") < ZONK_CHANCE;
        const stone = await new this.miningStoneModel({
            telegramId,
            tier,
            maxHp,
            zonk,
            status: "active",
            expireAt: new Date(now + ACTIVE_STONE_TTL_MS),
        }).save();
        return {
            success: true,
            stone: {
                stoneId: stone._id.toString(),
                tier: stone.tier,
                maxHp: stone.maxHp,
                zonk: stone.zonk,
            },
        };
    }
    async purchasePickaxe(telegramId, tier) {
        const cost = exports.PICKAXE_COSTS[tier];
        if (!cost) {
            return { success: false, error: "Invalid pickaxe tier" };
        }
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user) {
            return {
                success: false,
                error: "User account not found. Please reload the app.",
            };
        }
        const owned = user.ownedPickaxes?.length ? user.ownedPickaxes : ["Common"];
        if (owned.includes(tier)) {
            return { success: false, error: "Pickaxe already owned" };
        }
        const prev = PICKAXE_PREV[tier];
        if (!owned.includes(prev)) {
            return {
                success: false,
                error: `Unlock ${prev} pickaxe first`,
            };
        }
        const updated = await this.userModel
            .findOneAndUpdate({
            telegramId,
            ownedPickaxes: { $nin: [tier] },
            "cryptoBalances.GOLD": { $gte: cost.GOLD },
            "cryptoBalances.DIAMOND": { $gte: cost.DIAMOND },
        }, {
            $inc: {
                "cryptoBalances.GOLD": -cost.GOLD,
                "cryptoBalances.DIAMOND": -cost.DIAMOND,
            },
            $addToSet: { ownedPickaxes: { $each: ["Common", tier] } },
        }, { returnDocument: "after" })
            .exec();
        if (!updated) {
            return {
                success: false,
                error: "Insufficient Gold/Diamond or pickaxe already owned",
            };
        }
        return {
            success: true,
            tier,
            ownedPickaxes: updated.ownedPickaxes?.length
                ? updated.ownedPickaxes
                : ["Common", tier],
            balances: {
                GOLD: updated.cryptoBalances?.GOLD || 0,
                DIAMOND: updated.cryptoBalances?.DIAMOND || 0,
            },
        };
    }
    async repairPickaxe(telegramId, tier) {
        const cost = PICKAXE_REPAIR_COSTS[tier];
        if (!cost) {
            return { success: false, error: "Invalid pickaxe tier" };
        }
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user) {
            return {
                success: false,
                error: "User account not found. Please reload the app.",
            };
        }
        const owned = user.ownedPickaxes?.length ? user.ownedPickaxes : ["Common"];
        if (!owned.includes(tier)) {
            return { success: false, error: "Pickaxe not owned" };
        }
        const filter = {
            telegramId,
            $or: [{ ownedPickaxes: { $in: owned } }, { ownedPickaxes: { $exists: false } }],
        };
        const inc = {};
        for (const [resource, amount] of Object.entries(cost)) {
            filter[`cryptoBalances.${resource}`] = { $gte: amount };
            inc[`cryptoBalances.${resource}`] = -amount;
        }
        const now = new Date();
        const updated = await this.userModel
            .findOneAndUpdate(filter, {
            $inc: { ...inc, [`pickaxeRepairs.${tier}.count`]: 1 },
            $set: { [`pickaxeRepairs.${tier}.lastRepairAt`]: now },
            $addToSet: { ownedPickaxes: { $each: ["Common", tier] } },
        }, { returnDocument: "after" })
            .exec();
        if (!updated) {
            return {
                success: false,
                error: "Insufficient resources to repair this pickaxe",
            };
        }
        const balances = {};
        for (const key of RESOURCE_KEYS) {
            balances[key] = updated.cryptoBalances?.[key] || 0;
        }
        return {
            success: true,
            tier,
            cost,
            repairedAt: now,
            balances,
            ownedPickaxes: updated.ownedPickaxes?.length
                ? updated.ownedPickaxes
                : ["Common"],
        };
    }
    async destroy(telegramId, stoneId) {
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user) {
            return {
                success: false,
                error: "User account not found. Please reload the app.",
            };
        }
        const stone = await this.miningStoneModel
            .findOneAndUpdate({ _id: stoneId, telegramId, status: "active" }, {
            $set: {
                status: "claimed",
                claimedAt: new Date(),
                expireAt: new Date(Date.now() + CLAIMED_STONE_TTL_MS),
            },
        }, { returnDocument: "after" })
            .exec();
        if (!stone) {
            return { success: false, error: "Stone not found or already claimed." };
        }
        if (stone.zonk) {
            await this.miningStoneModel
                .updateOne({ _id: stone._id }, { $set: { rewards: {} } })
                .exec();
            return {
                success: true,
                zonk: true,
                adRequired: stone.tier === "Medium" || stone.tier === "Rare",
                stone: {
                    stoneId: stone._id.toString(),
                    tier: stone.tier,
                    maxHp: stone.maxHp,
                },
                rewards: {},
            };
        }
        const cfg = TIER_CONFIG[stone.tier];
        const quality = Math.max(0, Math.min(1, (stone.maxHp - cfg.hpMin) / (cfg.hpMax - cfg.hpMin)));
        const rewards = {};
        for (const [resource, [min, max]] of Object.entries(cfg.rewards)) {
            const point = min + (max - min) * quality;
            const jitter = 0.75 + Math.random() * 0.5;
            rewards[resource] = Math.max(min, Math.min(max, Math.round(point * jitter)));
        }
        await this.miningStoneModel
            .updateOne({ _id: stone._id }, { $set: { rewards } })
            .exec();
        return {
            success: true,
            zonk: false,
            adRequired: stone.tier === "Medium" || stone.tier === "Rare",
            stone: {
                stoneId: stone._id.toString(),
                tier: stone.tier,
                maxHp: stone.maxHp,
            },
            rewards,
        };
    }
    async claimRewards(telegramId, stoneId, action) {
        if (action !== "save" && action !== "sell") {
            return { success: false, error: "Invalid claim action" };
        }
        const user = await this.usersService.findByTelegramId(telegramId);
        if (!user) {
            return {
                success: false,
                error: "User account not found. Please reload the app.",
            };
        }
        const pending = await this.miningStoneModel
            .findOne({ _id: stoneId, telegramId, status: "claimed", claimAction: null })
            .lean()
            .exec();
        if (!pending) {
            return {
                success: false,
                error: "Rewards already claimed or stone not found.",
            };
        }
        const adRequired = pending.tier === "Medium" || pending.tier === "Rare";
        if (adRequired && (user.adTickets || 0) < 1) {
            return {
                success: false,
                adRequired: true,
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }
        const stone = await this.miningStoneModel
            .findOneAndUpdate({ _id: stoneId, telegramId, status: "claimed", claimAction: null }, {
            $set: {
                claimAction: action,
                finalizedAt: new Date(),
            },
        }, { returnDocument: "after" })
            .exec();
        if (!stone) {
            return {
                success: false,
                error: "Rewards already claimed or stone not found.",
            };
        }
        const rewards = stone.rewards || {};
        const credited = {};
        let elixir = 0;
        if (Object.keys(rewards).length > 0) {
            if (action === "save") {
                const inc = {};
                for (const [resource, amount] of Object.entries(rewards)) {
                    inc[`cryptoBalances.${resource}`] = amount;
                }
                if (adRequired)
                    inc["adTickets"] = -1;
                const saved = await this.userModel
                    .findOneAndUpdate(adRequired
                    ? { telegramId, adTickets: { $gte: 1 } }
                    : { telegramId }, { $inc: inc })
                    .exec();
                if (adRequired && !saved) {
                    return {
                        success: false,
                        adRequired: true,
                        error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap Save again to retry.",
                    };
                }
                Object.assign(credited, rewards);
            }
            else {
                elixir = 0;
                for (const [resource, amount] of Object.entries(rewards)) {
                    const rate = exports.ELIX_RATES[resource] || 0;
                    elixir += amount * rate;
                }
                elixir = Math.round(elixir * 100) / 100;
                if (elixir > 0) {
                    const inc = {
                        "cryptoBalances.ELIXCOIN": elixir,
                    };
                    if (adRequired)
                        inc["adTickets"] = -1;
                    const sold = await this.userModel
                        .findOneAndUpdate(adRequired
                        ? { telegramId, adTickets: { $gte: 1 } }
                        : { telegramId }, { $inc: inc })
                        .exec();
                    if (adRequired && !sold) {
                        return {
                            success: false,
                            adRequired: true,
                            error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap Sell again to retry.",
                        };
                    }
                }
            }
        }
        const fresh = await this.userModel.findOne({ telegramId }).exec();
        const freshCrypto = (fresh?.cryptoBalances || {});
        return {
            success: true,
            action,
            stoneId: stone._id.toString(),
            credited,
            elixir,
            cryptoBalances: freshCrypto,
            elixcoinBalance: freshCrypto.ELIXCOIN || 0,
        };
    }
    async history(telegramId) {
        const stones = await this.miningStoneModel
            .find({ telegramId, status: "claimed" })
            .sort({ claimedAt: -1 })
            .limit(HISTORY_LIMIT)
            .lean()
            .exec();
        return {
            success: true,
            history: stones.map((stone) => ({
                stoneId: stone._id.toString(),
                tier: stone.tier,
                maxHp: stone.maxHp,
                rewards: stone.rewards || {},
                claimedAt: stone.claimedAt,
            })),
        };
    }
};
exports.MinerStoneService = MinerStoneService;
exports.MinerStoneService = MinerStoneService = MinerStoneService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mining_stone_schema_1.MiningStone.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService])
], MinerStoneService);
//# sourceMappingURL=miner-stone.service.js.map