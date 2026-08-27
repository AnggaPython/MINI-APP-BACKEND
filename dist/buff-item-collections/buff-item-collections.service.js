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
var BuffItemCollectionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuffItemCollectionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const buff_item_schema_1 = require("./schemas/buff-item.schema");
const user_buff_collection_schema_1 = require("./schemas/user-buff-collection.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const BUFF_VALUES = {
    COMMON: [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.55, 0.60],
    MEDIUM: [1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50],
    RARE: [3.75, 4.00, 4.25, 4.50, 4.75, 5.00, 5.25, 5.50, 5.75, 6.00],
    ULTRA_RARE: [6.00, 9.00, 12.00, 15.00, 18.00, 21.00, 24.00, 27.00, 30.00, 33.00],
};
const BUFF_ASSIGNMENTS = {
    ATK: {
        COMMON: [
            "roman-coin",
            "inca-gold",
            "iron-coin",
            "tartar-bow",
            "celtic-torc",
            "bronze-bull",
            "eagle-figure",
            "small-dragon",
            "wolf-figure",
            "bear-statue",
        ],
        MEDIUM: [
            "greek-god",
            "golden-garuda",
            "marble-lion",
            "knight-statue",
            "samurai-armor",
            "dragon-lid",
            "ming-vase",
            "cloisonne",
            "pharaoh-ring",
            "gem-brooch",
        ],
        RARE: [
            "excalibur",
            "javanese-keris",
            "poseidon-trident",
            "thors-hammer",
            "artemis-bow",
            "shadow-blade",
            "aegis-shield",
            "katana",
            "dragon-keris",
            "guard-halberd",
        ],
        ULTRA_RARE: [
            "super-emperor-crown",
            "super-solomon-ring",
            "super-ras-necklace",
            "super-caduceus",
            "super-dragon-orb",
            "super-dragon-chest",
            "super-hellfire-chest",
            "super-divine-chest",
            "super-multiverse-chest",
            "super-kings-gold-chest",
        ],
    },
    ECONOMY: {
        COMMON: [
            "sumerian-tablet",
            "mayan-disk",
            "chinese-seal",
            "persian-astro",
            "babylon-seal",
            "mini-scarab",
            "mini-sun-disk",
            "brass-lamp",
            "wooden-box",
            "metal-tin",
        ],
        MEDIUM: [
            "kings-crown",
            "queens-tiara",
            "pearl-necklace",
            "silver-bracelet",
            "moon-pendant",
            "jade-earrings",
            "star-diadem",
            "moon-circlet",
            "jade-vase",
            "jeweled-vase",
        ],
        RARE: [
            "gem-chest",
            "crystal-chest",
            "mystery-chest",
            "eternal-chest",
            "sky-chest",
            "dragon-map",
            "dragon-letter",
            "dragon-tome",
            "dragon-compass",
            "dragon-seal",
        ],
        ULTRA_RARE: [
            "super-meissen-porcelain",
            "super-wedgwood-jasper",
            "super-millefiori",
            "super-greek-amphora",
            "super-cubist-vase",
            "super-globe-vase",
            "super-golden-pharaoh",
            "super-jade-dragon",
            "super-phoenix-statue",
            "super-jade-tortoise",
        ],
    },
    DURABILITY: {
        COMMON: [
            "clay-pot",
            "blue-ceramic",
            "white-porcelain",
            "roman-pottery",
            "batik-vase",
            "sakura-vase",
            "celadon-vase",
            "majolica-vase",
            "raku-pottery",
            "sancai-vase",
        ],
        MEDIUM: [
            "meissen-porcelain",
            "jade-vase",
            "cloisonne",
            "goddess-lakshmi",
            "greek-god",
            "quartz-crystal",
            "ruby-stone",
            "sapphire-stone",
            "emerald-stone",
            "amethyst-crystal",
        ],
        RARE: [
            "gem-chest",
            "crystal-chest",
            "dragon-orb",
            "ras-necklace",
            "solomon-ring",
            "caduceus",
            "emperor-crown",
            "divine-chest",
            "eternal-chest",
            "multiverse-chest",
        ],
        ULTRA_RARE: [
            "super-cubist-vase",
            "super-jeweled-vase",
            "super-globe-vase",
            "super-millefiori",
            "super-greek-amphora",
            "super-wedgwood-jasper",
            "super-golden-pharaoh",
            "super-jade-dragon",
            "super-phoenix-statue",
            "super-jade-tortoise",
        ],
    },
    DROPRATE: {
        COMMON: [
            "viking-compass",
            "greek-figure",
            "dream-rock",
            "norse-rune",
            "korean-cup",
            "ancient-chakra",
            "tiki-figure",
            "small-buddha",
            "bastet-cat",
            "peacock-figure",
        ],
        MEDIUM: [
            "spell-book",
            "treasure-map",
            "royal-decree",
            "ancient-codex",
            "buddhist-sutra",
            "mayan-codex",
            "ancient-atlas",
            "prophecy-book",
            "star-chart",
            "egypt-papyrus",
        ],
        RARE: [
            "mystery-chest",
            "sky-chest",
            "dragon-map",
            "dragon-letter",
            "dragon-tome",
            "dragon-compass",
            "dragon-seal",
            "dragon-chest",
            "hellfire-chest",
            "kings-gold-chest",
        ],
        ULTRA_RARE: [
            "super-topaz-stone",
            "super-opal-stone",
            "super-lapis-lazuli",
            "super-garnet-stone",
            "super-aquamarine",
            "super-gem-brooch",
            "super-pharaoh-ring",
            "super-kings-crown",
            "super-queens-tiara",
            "super-pearl-necklace",
        ],
    },
};
const BUFF_TYPE_META = {
    ATK: {
        label: "ATK Damage",
        description: "Flat damage bonus per hit (mining + case box)",
        unit: "flat",
        icon: "⚔️",
    },
    ECONOMY: {
        label: "Economy Boost",
        description: "Percentage boost on claimed resources (iron, copper, etc.)",
        unit: "percent",
        icon: "💰",
    },
    DURABILITY: {
        label: "Durability Engine",
        description: "Restores tool durability every 5 successful hits",
        unit: "flat",
        icon: "🔧",
    },
    DROPRATE: {
        label: "Extra Drop Rate",
        description: "Increases chance of rare item drops",
        unit: "percent",
        icon: "🎲",
    },
};
let BuffItemCollectionsService = class BuffItemCollectionsService {
    static { BuffItemCollectionsService_1 = this; }
    buffItemModel;
    userBuffModel;
    userModel;
    logger = new common_1.Logger(BuffItemCollectionsService_1.name);
    constructor(buffItemModel, userBuffModel, userModel) {
        this.buffItemModel = buffItemModel;
        this.userBuffModel = userBuffModel;
        this.userModel = userModel;
    }
    async onModuleInit() {
        await this.seedBuffItems();
    }
    async seedBuffItems() {
        const legacy = await this.buffItemModel.findOne({ buffId: /^ATK-|^ECONOMY-|^DURABILITY-|^DROPRATE-/ }).lean();
        if (legacy) {
            this.logger.log("Clearing legacy buff items (ATK-COMMON-01 format)...");
            await this.buffItemModel.deleteMany({});
        }
        const count = await this.buffItemModel.countDocuments();
        this.logger.log("Seeding buff items (item-name format)...");
        const docs = [];
        const seenItems = new Set();
        for (const buffType of ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"]) {
            for (const rarity of ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"]) {
                const itemIds = BUFF_ASSIGNMENTS[buffType][rarity];
                const values = BUFF_VALUES[rarity];
                const meta = BUFF_TYPE_META[buffType];
                for (let i = 0; i < 10; i++) {
                    const itemId = itemIds[i];
                    if (seenItems.has(itemId))
                        continue;
                    seenItems.add(itemId);
                    const value = values[i];
                    const description = meta.unit === "percent"
                        ? `+${value}% ${meta.label}`
                        : `+${value} ${meta.label}`;
                    docs.push({
                        buffId: itemId,
                        collectionItemId: itemId,
                        buffType,
                        rarity,
                        buffValue: value,
                        buffUnit: meta.unit,
                        name: `${meta.label} ${rarity} #${i + 1}`,
                        description,
                        icon: meta.icon,
                    });
                }
            }
        }
        for (const doc of docs) {
            await this.buffItemModel.updateOne({ buffId: doc.buffId }, { $set: doc }, { upsert: true });
        }
        this.logger.log(`Seeded ${docs.length} buff items (deduplicated)`);
    }
    async getAllBuffItems() {
        const items = await this.buffItemModel.find().sort({ buffType: 1, rarity: 1, buffId: 1 }).lean();
        return {
            success: true,
            items,
            meta: {
                total: items.length,
                buffTypes: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"],
                rarities: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"],
                buffTypeMeta: BUFF_TYPE_META,
                buffValues: BUFF_VALUES,
            },
        };
    }
    async getBuffItemsByType(buffType) {
        const items = await this.buffItemModel
            .find({ buffType })
            .sort({ rarity: 1, buffId: 1 })
            .lean();
        return { success: true, items, meta: BUFF_TYPE_META[buffType] };
    }
    async getBuffItem(buffId) {
        const item = await this.buffItemModel.findOne({ buffId }).lean();
        if (!item)
            return { success: false, error: "Buff item not found" };
        return { success: true, item };
    }
    async getUserCollection(telegramId) {
        let collection = await this.userBuffModel.findOne({ telegramId }).lean();
        if (!collection) {
            const created = await this.userBuffModel.create({
                telegramId,
                inventory: [],
                activeInstanceIds: [],
            });
            collection = created.toObject();
        }
        const inventory = collection.inventory || [];
        const activeInstanceIds = collection.activeInstanceIds || [];
        const baseItemIds = [...new Set(inventory.map(i => i.baseItemId))];
        const baseItems = baseItemIds.length > 0
            ? await this.buffItemModel
                .find({ buffId: { $in: baseItemIds } })
                .lean()
            : [];
        const baseItemMap = new Map(baseItems.map(item => [item.buffId, item]));
        const ownedItems = inventory.map(inst => {
            const itemData = baseItemMap.get(inst.baseItemId);
            return {
                instanceId: inst.instanceId,
                baseItemId: inst.baseItemId,
                acquiredAt: inst.acquiredAt,
                buffType: itemData?.buffType,
                rarity: itemData?.rarity,
                buffValue: itemData?.buffValue,
                buffUnit: itemData?.buffUnit,
                name: itemData?.name,
                description: itemData?.description,
                icon: itemData?.icon,
            };
        });
        const activeInstances = inventory.filter(inst => activeInstanceIds.includes(inst.instanceId));
        const activeItems = activeInstances.map(inst => {
            const itemData = baseItemMap.get(inst.baseItemId);
            return {
                instanceId: inst.instanceId,
                baseItemId: inst.baseItemId,
                acquiredAt: inst.acquiredAt,
                buffType: itemData?.buffType,
                rarity: itemData?.rarity,
                buffValue: itemData?.buffValue,
                buffUnit: itemData?.buffUnit,
                name: itemData?.name,
                description: itemData?.description,
                icon: itemData?.icon,
            };
        });
        const totals = this.calculateBuffTotals(activeItems);
        return {
            success: true,
            inventory,
            activeInstanceIds,
            ownedItems,
            activeItems,
            totals,
        };
    }
    async grantBuffItem(telegramId, buffId) {
        const buffItem = await this.buffItemModel.findOne({ buffId }).lean();
        if (!buffItem)
            return { success: false, error: "Buff item not found" };
        const instanceId = crypto.randomUUID();
        const newInstance = { instanceId, baseItemId: buffId, acquiredAt: new Date() };
        await this.userBuffModel.updateOne({ telegramId }, { $push: { inventory: newInstance } }, { upsert: true });
        return {
            success: true,
            buffItem,
            instanceId,
            message: `Granted "${buffItem.name}" (${buffItem.description})`,
        };
    }
    async removeBuffItem(telegramId, buffId, count = 1) {
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection)
            return 0;
        const removableInstances = collection.inventory.filter(i => i.baseItemId === buffId && !collection.activeInstanceIds.includes(i.instanceId));
        const toRemove = removableInstances.slice(0, count);
        if (toRemove.length === 0)
            return 0;
        const instanceIdsToRemove = new Set(toRemove.map(i => i.instanceId));
        collection.inventory = collection.inventory.filter(i => !instanceIdsToRemove.has(i.instanceId));
        await collection.save();
        return toRemove.length;
    }
    async countBuffInstances(telegramId, buffId) {
        const col = await this.userBuffModel.findOne({ telegramId }).lean();
        if (!col)
            return 0;
        const inventory = col.inventory || [];
        return inventory.filter(i => i.baseItemId === buffId).length;
    }
    async grantMaterial(telegramId, displayName, amount = 1) {
        if (amount <= 0)
            return;
        await this.userModel.updateOne({ telegramId }, { $inc: { [`materials.${displayName}`]: amount } }).exec();
    }
    async removeMaterial(telegramId, displayName, count = 1) {
        if (count <= 0)
            return 0;
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return 0;
        const current = user.materials?.[displayName] ?? 0;
        const toRemove = Math.min(count, current);
        if (toRemove <= 0)
            return 0;
        await this.userModel.updateOne({ telegramId }, { $inc: { [`materials.${displayName}`]: -toRemove } }).exec();
        return toRemove;
    }
    async activateBuff(telegramId, buffId) {
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection)
            return { success: false, error: "User collection not found" };
        const unequippedInstance = collection.inventory.find(i => i.baseItemId === buffId && !collection.activeInstanceIds.includes(i.instanceId));
        if (!unequippedInstance)
            return { success: false, error: "You do not own this item or all are already active" };
        collection.activeInstanceIds.push(unequippedInstance.instanceId);
        await collection.save();
        return { success: true, activeInstanceIds: collection.activeInstanceIds };
    }
    async deactivateBuff(telegramId, buffId) {
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection)
            return { success: false, error: "User collection not found" };
        const equippedInstance = collection.inventory.find(i => i.baseItemId === buffId && collection.activeInstanceIds.includes(i.instanceId));
        if (!equippedInstance)
            return { success: false, error: "No active item found for this buff" };
        collection.activeInstanceIds = collection.activeInstanceIds.filter((id) => id !== equippedInstance.instanceId);
        await collection.save();
        return { success: true, activeInstanceIds: collection.activeInstanceIds };
    }
    async activateAllByType(telegramId, buffType) {
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection)
            return { success: false, error: "User collection not found" };
        const items = await this.buffItemModel.find({ buffType }).lean();
        const typeBaseIds = new Set(items.map(i => i.buffId));
        const instancesOfType = collection.inventory.filter(i => typeBaseIds.has(i.baseItemId));
        const toActivate = instancesOfType
            .map(i => i.instanceId)
            .filter(id => !collection.activeInstanceIds.includes(id));
        if (toActivate.length === 0) {
            return { success: true, activated: 0, activeInstanceIds: collection.activeInstanceIds };
        }
        collection.activeInstanceIds.push(...toActivate);
        await collection.save();
        return { success: true, activated: toActivate.length, activeInstanceIds: collection.activeInstanceIds };
    }
    calculateBuffTotals(activeItems) {
        const totals = {
            ATK: 0, ECONOMY: 0, DURABILITY: 0, DROPRATE: 0,
        };
        for (const item of activeItems)
            totals[item.buffType] += item.buffValue;
        return totals;
    }
    async getUserBuffTotals(telegramId) {
        const collection = await this.userBuffModel.findOne({ telegramId }).lean();
        if (!collection || !collection.activeInstanceIds || collection.activeInstanceIds.length === 0) {
            return {
                success: true,
                totals: { ATK: 0, ECONOMY: 0, DURABILITY: 0, DROPRATE: 0 },
            };
        }
        const inventory = collection.inventory || [];
        const activeInstances = inventory.filter(inst => collection.activeInstanceIds.includes(inst.instanceId));
        const activeBaseItemIds = activeInstances.map(inst => inst.baseItemId);
        const activeItems = await this.buffItemModel
            .find({ buffId: { $in: activeBaseItemIds } })
            .lean();
        const calculatedItems = activeInstances.map(inst => activeItems.find(item => item.buffId === inst.baseItemId)).filter(Boolean);
        const totals = this.calculateBuffTotals(calculatedItems);
        return { success: true, totals };
    }
    static BUFF_RARITY_WEIGHTS = {
        COMMON: 60,
        MEDIUM: 15,
        RARE: 5,
        ULTRA_RARE: 0.5,
    };
    static BUFF_TYPE_WEIGHTS = {
        ATK: 25,
        ECONOMY: 25,
        DURABILITY: 25,
        DROPRATE: 25,
    };
    async grantRandomBuff(telegramId, preferredRarity) {
        const rarityWeights = BuffItemCollectionsService_1.BUFF_RARITY_WEIGHTS;
        let roll = Math.random() * 100;
        let selectedRarity = "COMMON";
        if (preferredRarity) {
            selectedRarity = preferredRarity;
        }
        else {
            for (const [rarity, weight] of Object.entries(rarityWeights)) {
                roll -= weight;
                if (roll <= 0) {
                    selectedRarity = rarity;
                    break;
                }
            }
        }
        const collection = await this.userBuffModel.findOne({ telegramId }).lean();
        const ownedIds = collection?.inventory?.map(i => i.baseItemId) || [];
        const available = await this.buffItemModel
            .find({
            rarity: selectedRarity,
            buffId: { $nin: ownedIds },
        })
            .lean();
        if (available.length === 0) {
            const fallbackOrder = ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"];
            const currentIdx = fallbackOrder.indexOf(selectedRarity);
            for (let i = currentIdx - 1; i >= 0; i--) {
                const fallback = await this.buffItemModel
                    .find({
                    rarity: fallbackOrder[i],
                    buffId: { $nin: ownedIds },
                })
                    .lean();
                if (fallback.length > 0) {
                    const picked = fallback[Math.floor(Math.random() * fallback.length)];
                    return this.grantBuffItem(telegramId, picked.buffId);
                }
            }
            return { success: true, granted: null, message: "Collection complete!" };
        }
        const picked = available[Math.floor(Math.random() * available.length)];
        return this.grantBuffItem(telegramId, picked.buffId);
    }
};
exports.BuffItemCollectionsService = BuffItemCollectionsService;
exports.BuffItemCollectionsService = BuffItemCollectionsService = BuffItemCollectionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(buff_item_schema_1.BuffItem.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_buff_collection_schema_1.UserBuffCollection.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], BuffItemCollectionsService);
//# sourceMappingURL=buff-item-collections.service.js.map