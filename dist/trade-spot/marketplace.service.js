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
var MarketplaceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const marketplace_item_schema_1 = require("./schemas/marketplace-item.schema");
const BUFF_VALUES = {
    COMMON: [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.55, 0.60],
    MEDIUM: [1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50],
    RARE: [3.75, 4.00, 4.25, 4.50, 4.75, 5.00, 5.25, 5.50, 5.75, 6.00],
    ULTRA_RARE: [6.00, 9.00, 12.00, 15.00, 18.00, 21.00, 24.00, 27.00, 30.00, 33.00],
};
const RARITY_MULTIPLIER = {
    COMMON: 400,
    MEDIUM: 571,
    RARE: 3333,
    ULTRA_RARE: 7576,
};
const MATERIAL_BASE_PRICE = {
    COMMON: { buy: 5, sell: 50 },
    MEDIUM: { buy: 50, sell: 500 },
    RARE: { buy: 500, sell: 5000 },
};
const MATERIAL_TOOLS = [
    { name: "Rusty Nail", rarity: "COMMON" },
    { name: "Wooden Handle", rarity: "COMMON" },
    { name: "Iron Shard", rarity: "COMMON" },
    { name: "Copper Wire", rarity: "COMMON" },
    { name: "Flint Stone", rarity: "COMMON" },
    { name: "Hemp Rope", rarity: "COMMON" },
    { name: "Leather Strap", rarity: "COMMON" },
    { name: "Clay Mold", rarity: "COMMON" },
    { name: "Tin Plate", rarity: "COMMON" },
    { name: "Bone Fragment", rarity: "COMMON" },
    { name: "Sandstone Grit", rarity: "COMMON" },
    { name: "Charcoal Lump", rarity: "COMMON" },
    { name: "Glass Shard", rarity: "COMMON" },
    { name: "Rubber Grip", rarity: "COMMON" },
    { name: "Brass Rivet", rarity: "COMMON" },
    { name: "Canvas Wrap", rarity: "COMMON" },
    { name: "Iron Bolt", rarity: "COMMON" },
    { name: "Slate Chip", rarity: "COMMON" },
    { name: "Twine Coil", rarity: "COMMON" },
    { name: "Wax Seal", rarity: "COMMON" },
    { name: "Stone Wheel", rarity: "COMMON" },
    { name: "Bronze Pin", rarity: "COMMON" },
    { name: "Ash Plank", rarity: "COMMON" },
    { name: "Cloth Strip", rarity: "COMMON" },
    { name: "Pig Iron Ingot", rarity: "COMMON" },
    { name: "Steel Alloy", rarity: "MEDIUM" },
    { name: "Silver Filament", rarity: "MEDIUM" },
    { name: "Copper Coil", rarity: "MEDIUM" },
    { name: "Magnet Core", rarity: "MEDIUM" },
    { name: "Quartz Crystal", rarity: "MEDIUM" },
    { name: "Reinforced Spring", rarity: "MEDIUM" },
    { name: "Tempered Glass", rarity: "MEDIUM" },
    { name: "Gold Plating", rarity: "MEDIUM" },
    { name: "Titanium Screw", rarity: "MEDIUM" },
    { name: "Carbon Fiber", rarity: "MEDIUM" },
    { name: "Enchanted Rune", rarity: "MEDIUM" },
    { name: "Sapphire Lens", rarity: "MEDIUM" },
    { name: "Power Cell", rarity: "MEDIUM" },
    { name: "Hydraulic Pump", rarity: "MEDIUM" },
    { name: "Servo Motor", rarity: "MEDIUM" },
    { name: "Platinum Wire", rarity: "MEDIUM" },
    { name: "Crystal Gear", rarity: "MEDIUM" },
    { name: "Obsidian Blade", rarity: "MEDIUM" },
    { name: "Neon Capacitor", rarity: "MEDIUM" },
    { name: "Phantom Core", rarity: "MEDIUM" },
    { name: "Emerald Driver", rarity: "MEDIUM" },
    { name: "Chrono Spring", rarity: "MEDIUM" },
    { name: "Plasma Coil", rarity: "MEDIUM" },
    { name: "Arcane Alloy", rarity: "MEDIUM" },
    { name: "Magnetic Array", rarity: "MEDIUM" },
    { name: "Void Diamond", rarity: "RARE" },
    { name: "Phoenix Feather", rarity: "RARE" },
    { name: "Dragon Scale", rarity: "RARE" },
    { name: "Celestial Core", rarity: "RARE" },
    { name: "Quantum Shard", rarity: "RARE" },
    { name: "Starforged Ingot", rarity: "RARE" },
    { name: "Infinity Crystal", rarity: "RARE" },
    { name: "Thunder Essence", rarity: "RARE" },
    { name: "Abyss Pearl", rarity: "RARE" },
    { name: "Solar Fragment", rarity: "RARE" },
    { name: "Lunar Prism", rarity: "RARE" },
    { name: "Chaos Ember", rarity: "RARE" },
    { name: "Titan Heart", rarity: "RARE" },
    { name: "Etherium Wire", rarity: "RARE" },
    { name: "Rift Anchor", rarity: "RARE" },
    { name: "Frost Nova Core", rarity: "RARE" },
    { name: "Pyroclasm Gem", rarity: "RARE" },
    { name: "Nebula Dust", rarity: "RARE" },
    { name: "Singularity Bolt", rarity: "RARE" },
    { name: "Godslayer Alloy", rarity: "RARE" },
    { name: "Timeless Gear", rarity: "RARE" },
    { name: "Dimension Key", rarity: "RARE" },
    { name: "Eternity Matrix", rarity: "RARE" },
    { name: "Primordial Ore", rarity: "RARE" },
    { name: "Omega Circuit", rarity: "RARE" },
];
const BUFF_ASSIGNMENTS = {
    ATK: {
        COMMON: [
            "roman-coin", "inca-gold", "iron-coin", "tartar-bow", "celtic-torc",
            "bronze-bull", "eagle-figure", "small-dragon", "wolf-figure", "bear-statue",
        ],
        MEDIUM: [
            "greek-god", "golden-garuda", "marble-lion", "knight-statue", "samurai-armor",
            "dragon-lid", "ming-vase", "cloisonne", "pharaoh-ring", "gem-brooch",
        ],
        RARE: [
            "excalibur", "javanese-keris", "poseidon-trident", "thors-hammer", "artemis-bow",
            "shadow-blade", "aegis-shield", "katana", "dragon-keris", "guard-halberd",
        ],
        ULTRA_RARE: [
            "super-emperor-crown", "super-solomon-ring", "super-ras-necklace", "super-caduceus", "super-dragon-orb",
            "super-dragon-chest", "super-hellfire-chest", "super-divine-chest", "super-multiverse-chest", "super-kings-gold-chest",
        ],
    },
    ECONOMY: {
        COMMON: [
            "sumerian-tablet", "mayan-disk", "chinese-seal", "persian-astro", "babylon-seal",
            "mini-scarab", "mini-sun-disk", "brass-lamp", "wooden-box", "metal-tin",
        ],
        MEDIUM: [
            "kings-crown", "queens-tiara", "pearl-necklace", "silver-bracelet", "moon-pendant",
            "jade-earrings", "star-diadem", "moon-circlet", "jade-vase", "jeweled-vase",
        ],
        RARE: [
            "gem-chest", "crystal-chest", "mystery-chest", "eternal-chest", "sky-chest",
            "dragon-map", "dragon-letter", "dragon-tome", "dragon-compass", "dragon-seal",
        ],
        ULTRA_RARE: [
            "super-meissen-porcelain", "super-wedgwood-jasper", "super-millefiori", "super-greek-amphora", "super-cubist-vase",
            "super-globe-vase", "super-golden-pharaoh", "super-jade-dragon", "super-phoenix-statue", "super-jade-tortoise",
        ],
    },
    DURABILITY: {
        COMMON: [
            "clay-pot", "blue-ceramic", "white-porcelain", "roman-pottery", "batik-vase",
            "sakura-vase", "celadon-vase", "majolica-vase", "raku-pottery", "sancai-vase",
        ],
        MEDIUM: [
            "meissen-porcelain", "jade-vase", "cloisonne", "goddess-lakshmi", "greek-god",
            "quartz-crystal", "ruby-stone", "sapphire-stone", "emerald-stone", "amethyst-crystal",
        ],
        RARE: [
            "gem-chest", "crystal-chest", "dragon-orb", "ras-necklace", "solomon-ring",
            "caduceus", "emperor-crown", "divine-chest", "eternal-chest", "multiverse-chest",
        ],
        ULTRA_RARE: [
            "super-cubist-vase", "super-jeweled-vase", "super-globe-vase", "super-millefiori", "super-greek-amphora",
            "super-wedgwood-jasper", "super-golden-pharaoh", "super-jade-dragon", "super-phoenix-statue", "super-jade-tortoise",
        ],
    },
    DROPRATE: {
        COMMON: [
            "viking-compass", "greek-figure", "dream-rock", "norse-rune", "korean-cup",
            "ancient-chakra", "tiki-figure", "small-buddha", "bastet-cat", "peacock-figure",
        ],
        MEDIUM: [
            "spell-book", "treasure-map", "royal-decree", "ancient-codex", "buddhist-sutra",
            "mayan-codex", "ancient-atlas", "prophecy-book", "star-chart", "egypt-papyrus",
        ],
        RARE: [
            "mystery-chest", "sky-chest", "dragon-map", "dragon-letter", "dragon-tome",
            "dragon-compass", "dragon-seal", "dragon-chest", "hellfire-chest", "kings-gold-chest",
        ],
        ULTRA_RARE: [
            "super-topaz-stone", "super-opal-stone", "super-lapis-lazuli", "super-garnet-stone", "super-aquamarine",
            "super-gem-brooch", "super-pharaoh-ring", "super-kings-crown", "super-queens-tiara", "super-pearl-necklace",
        ],
    },
};
const COLLECTION_ITEM_NAMES = {
    "clay-pot": "Clay Pot", "blue-ceramic": "Blue Ceramic", "white-porcelain": "White Porcelain",
    "roman-pottery": "Roman Pottery", "batik-vase": "Batik Vase", "sakura-vase": "Sakura Vase",
    "celadon-vase": "Celadon Vase", "majolica-vase": "Majolica Vase", "raku-pottery": "Raku Pottery",
    "sancai-vase": "Sancai Vase", "eastern-pot": "Eastern Pot", "ribbed-vase": "Ribbed Vase",
    "dragon-lid": "Dragon Lid", "ivory-vase": "Ivory Vase", "green-vase": "Green Vase",
    "twin-handle": "Twin Handle", "rustic-vase": "Rustic Vase", "mini-round": "Mini Round",
    "flower-lid": "Flower Lid", "woven-vase": "Woven Vase",
    "porcelain-plate": "Porcelain Plate", "ceramic-bowl": "Ceramic Bowl", "delft-plate": "Delft Plate",
    "raku-bowl": "Raku Bowl", "rose-plate": "Rose Plate", "wooden-bowl": "Wooden Bowl",
    "leaf-plate": "Leaf Plate", "tea-cup": "Tea Cup", "soup-bowl": "Soup Bowl",
    "clay-plate": "Clay Plate", "rice-bowl": "Rice Bowl", "floral-plate": "Floral Plate",
    "ancient-cup": "Ancient Cup", "fruit-bowl": "Fruit Bowl", "imari-plate": "Imari Plate",
    "sumerian-tablet": "Sumerian Tablet", "mayan-disk": "Mayan Disk", "viking-compass": "Viking Compass",
    "chinese-seal": "Chinese Seal", "roman-coin": "Roman Coin", "persian-astro": "Persian Astro",
    "babylon-seal": "Babylon Seal", "greek-figure": "Greek Figure", "dream-rock": "Dream Rock",
    "norse-rune": "Norse Rune", "korean-cup": "Korean Cup", "ancient-chakra": "Ancient Chakra",
    "mini-scarab": "Mini Scarab", "mini-sun-disk": "Sun Disk", "celtic-torc": "Celtic Torc",
    "tartar-bow": "Tartar Bow", "tiki-figure": "Tiki Figure", "iron-coin": "Iron Coin",
    "brass-lamp": "Brass Lamp", "inca-gold": "Inca Gold",
    "small-buddha": "Small Buddha", "bastet-cat": "Bastet Cat", "bronze-bull": "Bronze Bull",
    "eagle-figure": "Eagle Figure", "horse-figure": "Horse Figure", "turtle-figure": "Turtle Figure",
    "monkey-figure": "Monkey Figure", "elephant-figure": "Elephant Figure", "fish-sculpture": "Fish Sculpture",
    "rabbit-figure": "Rabbit Figure", "small-dragon": "Small Dragon", "wolf-figure": "Wolf Figure",
    "deer-figure": "Deer Figure", "peacock-figure": "Peacock Figure", "bear-statue": "Bear Statue",
    "wooden-box": "Wooden Box", "clay-box": "Clay Box", "stone-box": "Stone Box",
    "leather-box": "Leather Box", "shell-box": "Shell Box", "rattan-box": "Rattan Box",
    "metal-tin": "Metal Tin", "fiber-box": "Fiber Box", "bamboo-box": "Bamboo Box",
    "earthen-box": "Earthen Box",
    "ming-vase": "Ming Vase", "jade-vase": "Jade Vase", "cloisonne": "Cloisonne",
    "meissen-porcelain": "Meissen Porcelain", "wedgwood-jasper": "Wedgwood Jasper",
    "millefiori": "Millefiori", "greek-amphora": "Greek Amphora", "cubist-vase": "Cubist Vase",
    "jeweled-vase": "Jeweled Vase", "globe-vase": "Globe Vase",
    "greek-god": "Greek God", "golden-pharaoh": "Golden Pharaoh", "golden-garuda": "Golden Garuda",
    "jade-dragon": "Jade Dragon", "marble-lion": "Marble Lion", "knight-statue": "Knight Statue",
    "goddess-lakshmi": "Goddess Lakshmi", "samurai-armor": "Samurai Armor",
    "phoenix-statue": "Phoenix Statue", "jade-tortoise": "Jade Tortoise",
    "kings-crown": "King's Crown", "queens-tiara": "Queen's Tiara", "pharaoh-ring": "Pharaoh's Ring",
    "pearl-necklace": "Pearl Necklace", "silver-bracelet": "Silver Bracelet", "gem-brooch": "Gem Brooch",
    "moon-pendant": "Moon Pendant", "jade-earrings": "Jade Earrings", "star-diadem": "Star Diadem",
    "moon-circlet": "Moon Circlet",
    "egypt-papyrus": "Egypt Papyrus", "spell-book": "Spell Book", "treasure-map": "Treasure Map",
    "royal-decree": "Royal Decree", "ancient-codex": "Ancient Codex", "buddhist-sutra": "Buddhist Sutra",
    "mayan-codex": "Mayan Codex", "ancient-atlas": "Ancient Atlas", "prophecy-book": "Prophecy Book",
    "star-chart": "Star Chart",
    "quartz-crystal": "Quartz Crystal", "ruby-stone": "Ruby Stone", "sapphire-stone": "Sapphire Stone",
    "emerald-stone": "Emerald Stone", "amethyst-crystal": "Amethyst Crystal", "topaz-stone": "Topaz Stone",
    "opal-stone": "Opal Stone", "lapis-lazuli": "Lapis Lazuli", "garnet-stone": "Garnet Stone",
    "aquamarine": "Aquamarine",
    "excalibur": "Excalibur", "javanese-keris": "Javanese Keris", "poseidon-trident": "Poseidon Trident",
    "thors-hammer": "Thor's Hammer", "artemis-bow": "Artemis' Bow", "shadow-blade": "Shadow Blade",
    "aegis-shield": "Aegis Shield", "katana": "Katana", "dragon-keris": "Dragon Keris",
    "guard-halberd": "Guard Halberd",
    "emperor-crown": "Emperor's Crown", "solomon-ring": "Solomon's Ring", "ras-necklace": "Ra's Necklace",
    "caduceus": "Caduceus", "dragon-orb": "Dragon Orb", "dragon-map": "Dragon Map",
    "dragon-letter": "Dragon Letter", "dragon-tome": "Dragon Tome", "dragon-compass": "Dragon Compass",
    "dragon-seal": "Dragon Seal",
    "kings-gold-chest": "King's Gold Chest", "gem-chest": "Gem Chest", "crystal-chest": "Crystal Chest",
    "dragon-chest": "Dragon Chest", "mystery-chest": "Mystery Chest", "divine-chest": "Divine Chest",
    "eternal-chest": "Eternal Chest", "sky-chest": "Sky Chest", "hellfire-chest": "Hellfire Chest",
    "multiverse-chest": "Multiverse Chest",
    "super-emperor-crown": "Super Emperor's Crown", "super-solomon-ring": "Super Solomon's Ring",
    "super-ras-necklace": "Super Ra's Necklace", "super-caduceus": "Super Caduceus",
    "super-dragon-orb": "Super Dragon Orb", "super-dragon-chest": "Super Dragon Chest",
    "super-hellfire-chest": "Super Hellfire Chest", "super-divine-chest": "Super Divine Chest",
    "super-multiverse-chest": "Super Multiverse Chest", "super-kings-gold-chest": "Super King's Gold Chest",
    "super-meissen-porcelain": "Super Meissen Porcelain",
    "super-gem-brooch": "Super Gem Brooch", "super-pharaoh-ring": "Super Pharaoh's Ring",
    "super-kings-crown": "Super King's Crown", "super-queens-tiara": "Super Queen's Tiara",
    "super-pearl-necklace": "Super Pearl Necklace",
    "super-wedgwood-jasper": "Super Wedgwood Jasper", "super-millefiori": "Super Millefiori",
    "super-greek-amphora": "Super Greek Amphora", "super-cubist-vase": "Super Cubist Vase",
    "super-globe-vase": "Super Globe Vase", "super-golden-pharaoh": "Super Golden Pharaoh",
    "super-jade-dragon": "Super Jade Dragon", "super-phoenix-statue": "Super Phoenix Statue",
    "super-jade-tortoise": "Super Jade Tortoise", "super-jeweled-vase": "Super Jeweled Vase",
    "super-topaz-stone": "Super Topaz Stone", "super-opal-stone": "Super Opal Stone",
    "super-lapis-lazuli": "Super Lapis Lazuli", "super-garnet-stone": "Super Garnet Stone",
    "super-aquamarine": "Super Aquamarine",
};
const BUFF_TYPE_META = {
    ATK: { label: "ATK Damage", icon: "⚔️" },
    ECONOMY: { label: "Economy Boost", icon: "💰" },
    DURABILITY: { label: "Durability Engine", icon: "🔧" },
    DROPRATE: { label: "Extra Drop Rate", icon: "🎲" },
};
const RARITY_ICONS = {
    COMMON: "⬜",
    MEDIUM: "🟨",
    RARE: "🟪",
    ULTRA_RARE: "🟧",
};
let MarketplaceService = MarketplaceService_1 = class MarketplaceService {
    marketplaceModel;
    logger = new common_1.Logger(MarketplaceService_1.name);
    constructor(marketplaceModel) {
        this.marketplaceModel = marketplaceModel;
    }
    async onModuleInit() {
        await this.seedMarketplace();
    }
    async seedMarketplace() {
        const count = await this.marketplaceModel.countDocuments();
        this.logger.log("Seeding 235 marketplace items...");
        const docs = [];
        const buffTypes = ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"];
        const rarities = ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"];
        for (const buffType of buffTypes) {
            for (const rarity of rarities) {
                const itemIds = BUFF_ASSIGNMENTS[buffType]?.[rarity] || [];
                const values = BUFF_VALUES[rarity];
                const meta = BUFF_TYPE_META[buffType];
                const rarityMult = RARITY_MULTIPLIER[rarity];
                for (let i = 0; i < itemIds.length; i++) {
                    const itemId = itemIds[i];
                    const buffValue = values[i];
                    const name = COLLECTION_ITEM_NAMES[itemId] || itemId;
                    const sellPrice = Math.round(buffValue * rarityMult);
                    const buyPrice = Math.round(sellPrice * 0.1);
                    const baseLiquidity = rarity === "COMMON" ? 5000
                        : rarity === "MEDIUM" ? 2000
                            : rarity === "RARE" ? 500
                                : 100;
                    docs.push({
                        itemId,
                        itemType: "buff",
                        name: `${meta.icon} ${name}`,
                        rarity,
                        buffType,
                        buffValue,
                        buyPrice,
                        sellPrice,
                        liquidity: baseLiquidity,
                        maxLiquidity: baseLiquidity * 10,
                        icon: RARITY_ICONS[rarity],
                        active: true,
                    });
                }
            }
        }
        for (const material of MATERIAL_TOOLS) {
            const basePrice = MATERIAL_BASE_PRICE[material.rarity];
            docs.push({
                itemId: material.name,
                itemType: "material",
                name: `🔨 ${material.name}`,
                rarity: material.rarity,
                buffType: null,
                buffValue: 0,
                buyPrice: basePrice.buy,
                sellPrice: basePrice.sell,
                liquidity: material.rarity === "COMMON" ? 10000
                    : material.rarity === "MEDIUM" ? 3000
                        : 800,
                maxLiquidity: material.rarity === "COMMON" ? 100000
                    : material.rarity === "MEDIUM" ? 30000
                        : 8000,
                icon: RARITY_ICONS[material.rarity],
                active: true,
            });
        }
        for (const doc of docs) {
            await this.marketplaceModel.updateOne({ itemId: doc.itemId }, { $set: doc }, { upsert: true });
        }
        this.logger.log(`Seeded ${docs.length} marketplace items`);
    }
    async getMarketplaceItems(filters) {
        const query = { active: true };
        if (filters?.itemType)
            query.itemType = filters.itemType;
        if (filters?.rarity)
            query.rarity = filters.rarity;
        if (filters?.search) {
            query.name = { $regex: filters.search, $options: "i" };
        }
        const items = await this.marketplaceModel
            .find(query)
            .sort({ rarity: 1, buyPrice: 1 })
            .lean();
        return {
            success: true,
            items,
            total: items.length,
            meta: {
                buffTypes: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"],
                rarities: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"],
                totalItems: 235,
            },
        };
    }
    async getMarketplaceItem(itemId) {
        const item = await this.marketplaceModel.findOne({ itemId }).lean();
        if (!item)
            return { success: false, error: "Item not found" };
        return { success: true, item };
    }
    async getMarketplaceStats() {
        const totalItems = await this.marketplaceModel.countDocuments({ active: true });
        const byRarity = await this.marketplaceModel.aggregate([
            { $match: { active: true } },
            { $group: { _id: "$rarity", count: { $sum: 1 }, totalLiquidity: { $sum: "$liquidity" } } },
        ]);
        const byType = await this.marketplaceModel.aggregate([
            { $match: { active: true } },
            { $group: { _id: "$itemType", count: { $sum: 1 } } },
        ]);
        return {
            success: true,
            totalItems,
            byRarity,
            byType,
        };
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = MarketplaceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(marketplace_item_schema_1.MarketplaceItem.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MarketplaceService);
//# sourceMappingURL=marketplace.service.js.map