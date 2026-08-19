"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BuffItemCollectionsService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuffItemCollectionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const buff_item_schema_1 = require("./schemas/buff-item.schema");
const user_buff_collection_schema_1 = require("./schemas/user-buff-collection.schema");
const BUFF_VALUES = {
    COMMON: [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.55, 0.60],
    MEDIUM: [1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50],
    RARE: [3.75, 4.00, 4.25, 4.50, 4.75, 5.00, 5.25, 5.50, 5.75, 6.00],
    ULTRA_RARE: [6.00, 9.00, 12.00, 15.00, 18.00, 21.00, 24.00, 27.00, 30.00, 33.00],
};
const BUFF_ASSIGNMENTS = {
    ATK: {
        COMMON: [
            "artefak-romawi",
            "artefak-inca",
            "artefak-afrika",
            "artefak-tartar",
            "artefak-keltik",
            "patung-banteng",
            "patung-elang",
            "patung-naga-kecil",
            "patung-serigala",
            "patung-beruang",
        ],
        MEDIUM: [
            "patung-dewa-yunani",
            "patung-garuda-emas",
            "patung-singa-marmer",
            "patung-knight",
            "patung-samurai-statue",
            "guci-tutup-naga",
            "guci-dinasti-ming",
            "guci-cloisonne",
            "cincin-firaun",
            "bros-permata",
        ],
        RARE: [
            "pedang-excalibur",
            "keris-jawa",
            "trident-poseidon",
            "mjolnir",
            "panah-artemis",
            "pedang-bayangan",
            "perisai-athena",
            "pedang-samurai",
            "keris-naga",
            "halberd-penjaga",
        ],
        ULTRA_RARE: [
            "mahkota-kaisar",
            "cincin-solomon",
            "kalung-ra",
            "tongkat-hermes",
            "bola-kristal-naga",
            "peti-naga",
            "peti-neraka",
            "peti-dewa",
            "peti-multiverse",
            "peti-emas-raja",
        ],
    },
    ECONOMY: {
        COMMON: [
            "artefak-sumeria",
            "artefak-maya",
            "artefak-cina-kuno",
            "artefak-persia",
            "artefak-babilonia",
            "artefak-mesir-mini",
            "artefak-aztec-mini",
            "artefak-timur-tengah",
            "kotak-kayu",
            "kotak-logam",
        ],
        MEDIUM: [
            "mahkota-raja",
            "mahkota-ratu",
            "kalung-mutiara",
            "gelang-perak",
            "liontin-bulan",
            "anting-giok",
            "diadem-bintang",
            "circlet-bulan",
            "guci-jade-hijau",
            "guci-permata",
        ],
        RARE: [
            "peti-permata",
            "peti-kristal",
            "peti-misterius",
            "peti-abadi",
            "peti-langit",
            "peta-naga",
            "surat-naga",
            "kitab-naga",
            "kompas-naga",
            "segel-naga",
        ],
        ULTRA_RARE: [
            "guci-meissen",
            "guci-wedgwood",
            "guci-millefiori",
            "guci-urn-yunani",
            "guci-kubisme",
            "guci-dunia",
            "patung-firaun-emas",
            "patung-naga-jade",
            "patung-feniks",
            "patung-tortoise",
        ],
    },
    DURABILITY: {
        COMMON: [
            "guci-tanah-liat",
            "guci-keramik-biru",
            "guci-porselen-putih",
            "guci-tembikar-romawi",
            "guci-batik-jawa",
            "guci-sakura-jepang",
            "guci-celadon",
            "guci-majolica",
            "guci-raku",
            "guci-sancai",
        ],
        MEDIUM: [
            "guci-meissen",
            "guci-jade-hijau",
            "guci-cloisonne",
            "patung-dewi-lakshmi",
            "patung-dewa-yunani",
            "kristal-kuarsa",
            "batu-ruby",
            "batu-sapphire",
            "batu-emerald",
            "kristal-amethyst",
        ],
        RARE: [
            "peti-permata",
            "peti-kristal",
            "bola-kristal-naga",
            "kalung-ra",
            "cincin-solomon",
            "tongkat-hermes",
            "mahkota-kaisar",
            "peti-dewa",
            "peti-abadi",
            "peti-multiverse",
        ],
        ULTRA_RARE: [
            "guci-kubisme",
            "guci-permata",
            "guci-dunia",
            "guci-millefiori",
            "guci-urn-yunani",
            "guci-wedgwood",
            "patung-firaun-emas",
            "patung-naga-jade",
            "patung-feniks",
            "patung-tortoise",
        ],
    },
    DROPRATE: {
        COMMON: [
            "artefak-viking",
            "artefak-yunani",
            "artefak-aborigin",
            "artefak-norse",
            "artefak-korea",
            "artefak-india",
            "artefak-polinesia",
            "patung-buddha",
            "patung-kucing-mesir",
            "patung-merak",
        ],
        MEDIUM: [
            "kitab-sihir",
            "peta-harta-karun",
            "surat-raja",
            "codex-kuno",
            "scroll-buddha",
            "manuskrip-maya",
            "atlas-kuno",
            "buku-ramalan",
            "tabel-bintang",
            "gulungan-mesir",
        ],
        RARE: [
            "peti-misterius",
            "peti-langit",
            "peta-naga",
            "surat-naga",
            "kitab-naga",
            "kompas-naga",
            "segel-naga",
            "peti-naga",
            "peti-neraka",
            "peti-emas-raja",
        ],
        ULTRA_RARE: [
            "batu-topaz",
            "batu-opal",
            "kristal-lapis",
            "batu-garnet",
            "kristal-aquamarine",
            "bros-permata",
            "cincin-firaun",
            "mahkota-raja",
            "mahkota-ratu",
            "kalung-mutiara",
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
    logger = new common_1.Logger(BuffItemCollectionsService_1.name);
    constructor(buffItemModel, userBuffModel) {
        this.buffItemModel = buffItemModel;
        this.userBuffModel = userBuffModel;
    }
    async onModuleInit() {
        await this.seedBuffItems();
    }
    async seedBuffItems() {
        const count = await this.buffItemModel.countDocuments();
        if (count >= 160) {
            this.logger.log(`Buff items already seeded (${count} found)`);
            return;
        }
        this.logger.log("Seeding 160 buff items...");
        const docs = [];
        for (const buffType of ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"]) {
            for (const rarity of ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"]) {
                const itemIds = BUFF_ASSIGNMENTS[buffType][rarity];
                const values = BUFF_VALUES[rarity];
                const meta = BUFF_TYPE_META[buffType];
                for (let i = 0; i < 10; i++) {
                    const buffId = `${buffType}-${rarity}-${String(i + 1).padStart(2, "0")}`;
                    const value = values[i];
                    const description = meta.unit === "percent"
                        ? `+${value}% ${meta.label}`
                        : `+${value} ${meta.label}`;
                    docs.push({
                        buffId,
                        collectionItemId: itemIds[i],
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
        this.logger.log(`Seeded ${docs.length} buff items`);
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
                ownedBuffIds: [],
                activeBuffIds: [],
            });
            collection = created.toObject();
        }
        const ownedBuffIds = collection.ownedBuffIds || [];
        const activeBuffIds = collection.activeBuffIds || [];
        const ownedItems = ownedBuffIds.length > 0
            ? await this.buffItemModel
                .find({ buffId: { $in: ownedBuffIds } })
                .lean()
            : [];
        const activeItems = activeBuffIds.length > 0
            ? await this.buffItemModel
                .find({ buffId: { $in: activeBuffIds } })
                .lean()
            : [];
        const totals = this.calculateBuffTotals(activeItems);
        return {
            success: true,
            ownedBuffIds,
            activeBuffIds,
            ownedItems,
            activeItems,
            totals,
        };
    }
    async grantBuffItem(telegramId, buffId) {
        const buffItem = await this.buffItemModel.findOne({ buffId }).lean();
        if (!buffItem) {
            return { success: false, error: "Buff item not found" };
        }
        await this.userBuffModel.updateOne({ telegramId }, { $addToSet: { ownedBuffIds: buffId } }, { upsert: true });
        return {
            success: true,
            buffItem,
            message: `Granted "${buffItem.name}" (${buffItem.description})`,
        };
    }
    async activateBuff(telegramId, buffId) {
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection) {
            return { success: false, error: "User collection not found" };
        }
        if (!collection.ownedBuffIds.includes(buffId)) {
            return { success: false, error: "You do not own this buff item" };
        }
        if (collection.activeBuffIds.includes(buffId)) {
            return { success: false, error: "Buff is already active" };
        }
        collection.activeBuffIds.push(buffId);
        await collection.save();
        return { success: true, activeBuffIds: collection.activeBuffIds };
    }
    async deactivateBuff(telegramId, buffId) {
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection) {
            return { success: false, error: "User collection not found" };
        }
        if (!collection.activeBuffIds.includes(buffId)) {
            return { success: false, error: "Buff is not active" };
        }
        collection.activeBuffIds = collection.activeBuffIds.filter((id) => id !== buffId);
        await collection.save();
        return { success: true, activeBuffIds: collection.activeBuffIds };
    }
    async activateAllByType(telegramId, buffType) {
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection) {
            return { success: false, error: "User collection not found" };
        }
        const items = await this.buffItemModel
            .find({ buffType, buffId: { $in: collection.ownedBuffIds } })
            .lean();
        const toActivate = items
            .map((i) => i.buffId)
            .filter((id) => !collection.activeBuffIds.includes(id));
        if (toActivate.length === 0) {
            return { success: true, activated: 0, activeBuffIds: collection.activeBuffIds };
        }
        collection.activeBuffIds.push(...toActivate);
        await collection.save();
        return {
            success: true,
            activated: toActivate.length,
            activeBuffIds: collection.activeBuffIds,
        };
    }
    calculateBuffTotals(activeItems) {
        const totals = {
            ATK: 0,
            ECONOMY: 0,
            DURABILITY: 0,
            DROPRATE: 0,
        };
        for (const item of activeItems) {
            totals[item.buffType] += item.buffValue;
        }
        return totals;
    }
    async getUserBuffTotals(telegramId) {
        const collection = await this.userBuffModel.findOne({ telegramId }).lean();
        if (!collection || collection.activeBuffIds.length === 0) {
            return {
                success: true,
                totals: { ATK: 0, ECONOMY: 0, DURABILITY: 0, DROPRATE: 0 },
            };
        }
        const activeItems = await this.buffItemModel
            .find({ buffId: { $in: collection.activeBuffIds } })
            .lean();
        const totals = this.calculateBuffTotals(activeItems);
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
        const ownedIds = collection?.ownedBuffIds || [];
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
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object])
], BuffItemCollectionsService);
//# sourceMappingURL=buff-item-collections.service.js.map