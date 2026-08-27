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
var TradeSpotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeSpotService = exports.MINERAL_INITIAL_RATES = exports.CORE_BOT_PAIRS = exports.SPREAD_PCT = exports.FEE_PCT = exports.DEFAULT_PAIR = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trade_schema_1 = require("./schemas/trade.schema");
const pool_schema_1 = require("./schemas/pool.schema");
const open_order_schema_1 = require("./schemas/open-order.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const asset_registry_service_1 = require("./asset-registry.service");
const buff_item_collections_service_1 = require("../buff-item-collections/buff-item-collections.service");
exports.DEFAULT_PAIR = "ELIXCOIN/ELIXIR";
exports.FEE_PCT = 0.015;
exports.SPREAD_PCT = 0.004;
const COIN_BASES = new Set([
    "IRON", "COPPER", "SILVER", "GOLD", "DIAMOND",
    "ELIXCOIN", "ELIXIR", "USDC",
]);
function isItemBase(base) {
    return !COIN_BASES.has(base.toUpperCase());
}
exports.CORE_BOT_PAIRS = new Set([
    "ELIXCOIN/ELIXIR",
    "ELIXCOIN/USDC",
    "IRON/USDC", "COPPER/USDC", "SILVER/USDC", "GOLD/USDC", "DIAMOND/USDC",
    "ELIXCOIN/IRON", "ELIXCOIN/COPPER", "ELIXCOIN/SILVER",
    "ELIXCOIN/GOLD", "ELIXCOIN/DIAMOND",
]);
exports.MINERAL_INITIAL_RATES = {
    "ELIXCOIN/ELIXIR": 0.09674384,
    "ELIXCOIN/USDC": 0.00000967,
    "IRON/USDC": 0.00000030,
    "COPPER/USDC": 0.00000060,
    "SILVER/USDC": 0.00000068,
    "GOLD/USDC": 0.0000068,
    "DIAMOND/USDC": 0.000068,
    "ELIXCOIN/IRON": 32.23,
    "ELIXCOIN/COPPER": 16.12,
    "ELIXCOIN/SILVER": 14.22,
    "ELIXCOIN/GOLD": 1.422,
    "ELIXCOIN/DIAMOND": 0.1422,
    "ROMAN-COIN/ELIXCOIN": 40,
    "INCA-GOLD/ELIXCOIN": 60,
    "IRON-COIN/ELIXCOIN": 80,
    "TARTAR-BOW/ELIXCOIN": 100,
    "CELTIC-TORC/ELIXCOIN": 120,
    "BRONZE-BULL/ELIXCOIN": 140,
    "EAGLE-FIGURE/ELIXCOIN": 160,
    "SMALL-DRAGON/ELIXCOIN": 180,
    "WOLF-FIGURE/ELIXCOIN": 220,
    "BEAR-STATUE/ELIXCOIN": 240,
    "GREEK-GOD/ELIXCOIN": 714,
    "GOLDEN-GARUDA/ELIXCOIN": 857,
    "MARBLE-LION/ELIXCOIN": 999,
    "KNIGHT-STATUE/ELIXCOIN": 1142,
    "SAMURAI-ARMOR/ELIXCOIN": 1285,
    "DRAGON-LID/ELIXCOIN": 1428,
    "MING-VASE/ELIXCOIN": 1570,
    "CLOISONNE/ELIXCOIN": 1713,
    "SUPER-PHARAOH-RING/ELIXCOIN": 1856,
    "SUPER-GEM-BROOCH/ELIXCOIN": 1999,
    "EXCALIBUR/ELIXCOIN": 12499,
    "JAVANESE-KERIS/ELIXCOIN": 13332,
    "POSEIDON-TRIDENT/ELIXCOIN": 14165,
    "THORS-HAMMER/ELIXCOIN": 14999,
    "ARTEMIS-BOW/ELIXCOIN": 15832,
    "SHADOW-BLADE/ELIXCOIN": 16665,
    "AEGIS-SHIELD/ELIXCOIN": 17498,
    "KATANA/ELIXCOIN": 18332,
    "DRAGON-KERIS/ELIXCOIN": 19165,
    "GUARD-HALBERD/ELIXCOIN": 19998,
    "SUPER-EMPEROR-CROWN/ELIXCOIN": 45456,
    "SUPER-SOLOMON-RING/ELIXCOIN": 68184,
    "SUPER-RAS-NECKLACE/ELIXCOIN": 90912,
    "SUPER-CADUCEUS/ELIXCOIN": 113640,
    "SUPER-DRAGON-ORB/ELIXCOIN": 136368,
    "SUPER-DRAGON-CHEST/ELIXCOIN": 159096,
    "SUPER-HELLFIRE-CHEST/ELIXCOIN": 181824,
    "SUPER-DIVINE-CHEST/ELIXCOIN": 204552,
    "SUPER-MULTIVERSE-CHEST/ELIXCOIN": 227280,
    "SUPER-KINGS-GOLD-CHEST/ELIXCOIN": 250008,
    "SUMERIAN-TABLET/ELIXCOIN": 40,
    "MAYAN-DISK/ELIXCOIN": 60,
    "CHINESE-SEAL/ELIXCOIN": 80,
    "PERSIAN-ASTRO/ELIXCOIN": 100,
    "BABYLON-SEAL/ELIXCOIN": 120,
    "MINI-SCARAB/ELIXCOIN": 140,
    "MINI-SUN-DISK/ELIXCOIN": 160,
    "BRASS-LAMP/ELIXCOIN": 180,
    "WOODEN-BOX/ELIXCOIN": 220,
    "METAL-TIN/ELIXCOIN": 240,
    "SUPER-KINGS-CROWN/ELIXCOIN": 714,
    "SUPER-QUEENS-TIARA/ELIXCOIN": 857,
    "SUPER-PEARL-NECKLACE/ELIXCOIN": 999,
    "SILVER-BRACELET/ELIXCOIN": 1142,
    "MOON-PENDANT/ELIXCOIN": 1285,
    "JADE-EARRINGS/ELIXCOIN": 1428,
    "STAR-DIADEM/ELIXCOIN": 1570,
    "MOON-CIRCLET/ELIXCOIN": 1713,
    "JADE-VASE/ELIXCOIN": 1856,
    "JEWELED-VASE/ELIXCOIN": 1999,
    "GEM-CHEST/ELIXCOIN": 12499,
    "CRYSTAL-CHEST/ELIXCOIN": 13332,
    "MYSTERY-CHEST/ELIXCOIN": 14165,
    "ETERNAL-CHEST/ELIXCOIN": 14999,
    "SKY-CHEST/ELIXCOIN": 15832,
    "DRAGON-MAP/ELIXCOIN": 16665,
    "DRAGON-LETTER/ELIXCOIN": 17498,
    "DRAGON-TOME/ELIXCOIN": 18332,
    "DRAGON-COMPASS/ELIXCOIN": 19165,
    "DRAGON-SEAL/ELIXCOIN": 19998,
    "SUPER-MEISSEN-PORCELAIN/ELIXCOIN": 45456,
    "SUPER-WEDGWOOD-JASPER/ELIXCOIN": 68184,
    "SUPER-JEWELED-VASE/ELIXCOIN": 68184,
    "SUPER-MILLEFIORI/ELIXCOIN": 90912,
    "SUPER-GREEK-AMPHORA/ELIXCOIN": 113640,
    "SUPER-CUBIST-VASE/ELIXCOIN": 136368,
    "SUPER-GLOBE-VASE/ELIXCOIN": 159096,
    "SUPER-GOLDEN-PHARAOH/ELIXCOIN": 181824,
    "SUPER-JADE-DRAGON/ELIXCOIN": 204552,
    "SUPER-PHOENIX-STATUE/ELIXCOIN": 227280,
    "SUPER-JADE-TORTOISE/ELIXCOIN": 250008,
    "CLAY-POT/ELIXCOIN": 40,
    "BLUE-CERAMIC/ELIXCOIN": 60,
    "WHITE-PORCELAIN/ELIXCOIN": 80,
    "ROMAN-POTTERY/ELIXCOIN": 100,
    "BATIK-VASE/ELIXCOIN": 120,
    "SAKURA-VASE/ELIXCOIN": 140,
    "CELADON-VASE/ELIXCOIN": 160,
    "MAJOLICA-VASE/ELIXCOIN": 180,
    "RAKU-POTTERY/ELIXCOIN": 220,
    "SANCAI-VASE/ELIXCOIN": 240,
    "GODDESS-LAKSHMI/ELIXCOIN": 1142,
    "QUARTZ-CRYSTAL/ELIXCOIN": 1428,
    "RUBY-STONE/ELIXCOIN": 1570,
    "SAPPHIRE-STONE/ELIXCOIN": 1713,
    "EMERALD-STONE/ELIXCOIN": 1856,
    "AMETHYST-CRYSTAL/ELIXCOIN": 1999,
    "VIKING-COMPASS/ELIXCOIN": 40,
    "GREEK-FIGURE/ELIXCOIN": 60,
    "DREAM-ROCK/ELIXCOIN": 80,
    "NORSE-RUNE/ELIXCOIN": 100,
    "KOREAN-CUP/ELIXCOIN": 120,
    "ANCIENT-CHAKRA/ELIXCOIN": 140,
    "TIKI-FIGURE/ELIXCOIN": 160,
    "SMALL-BUDDHA/ELIXCOIN": 180,
    "BASTET-CAT/ELIXCOIN": 220,
    "PEACOCK-FIGURE/ELIXCOIN": 240,
    "SPELL-BOOK/ELIXCOIN": 714,
    "TREASURE-MAP/ELIXCOIN": 857,
    "ROYAL-DECREE/ELIXCOIN": 999,
    "ANCIENT-CODEX/ELIXCOIN": 1142,
    "BUDDHIST-SUTRA/ELIXCOIN": 1285,
    "MAYAN-CODEX/ELIXCOIN": 1428,
    "ANCIENT-ATLAS/ELIXCOIN": 1570,
    "PROPHECY-BOOK/ELIXCOIN": 1713,
    "STAR-CHART/ELIXCOIN": 1856,
    "EGYPT-PAPYRUS/ELIXCOIN": 1999,
    "SUPER-TOPAZ-STONE/ELIXCOIN": 45456,
    "SUPER-OPAL-STONE/ELIXCOIN": 68184,
    "SUPER-LAPIS-LAZULI/ELIXCOIN": 90912,
    "SUPER-GARNET-STONE/ELIXCOIN": 113640,
    "SUPER-AQUAMARINE/ELIXCOIN": 136368,
    "RUSTY-NAIL/ELIXCOIN": 50,
    "WOODEN-HANDLE/ELIXCOIN": 50,
    "IRON-SHARD/ELIXCOIN": 50,
    "COPPER-WIRE/ELIXCOIN": 50,
    "FLINT-STONE/ELIXCOIN": 50,
    "HEMP-ROPE/ELIXCOIN": 50,
    "LEATHER-STRAP/ELIXCOIN": 50,
    "CLAY-MOLD/ELIXCOIN": 50,
    "TIN-PLATE/ELIXCOIN": 50,
    "BONE-FRAGMENT/ELIXCOIN": 50,
    "SANDSTONE-GRIT/ELIXCOIN": 50,
    "CHARCOAL-LUMP/ELIXCOIN": 50,
    "GLASS-SHARD/ELIXCOIN": 50,
    "RUBBER-GRIP/ELIXCOIN": 50,
    "BRASS-RIVET/ELIXCOIN": 50,
    "CANVAS-WRAP/ELIXCOIN": 50,
    "IRON-BOLT/ELIXCOIN": 50,
    "SLATE-CHIP/ELIXCOIN": 50,
    "TWINE-COIL/ELIXCOIN": 50,
    "WAX-SEAL/ELIXCOIN": 50,
    "STONE-WHEEL/ELIXCOIN": 50,
    "BRONZE-PIN/ELIXCOIN": 50,
    "ASH-PLANK/ELIXCOIN": 50,
    "CLOTH-STRIP/ELIXCOIN": 50,
    "PIG-IRON-INGOT/ELIXCOIN": 50,
    "STEEL-ALLOY/ELIXCOIN": 500,
    "SILVER-FILAMENT/ELIXCOIN": 500,
    "COPPER-COIL/ELIXCOIN": 500,
    "MAGNET-CORE/ELIXCOIN": 500,
    "REINFORCED-SPRING/ELIXCOIN": 500,
    "TEMPERED-GLASS/ELIXCOIN": 500,
    "GOLD-PLATING/ELIXCOIN": 500,
    "TITANIUM-SCREW/ELIXCOIN": 500,
    "CARBON-FIBER/ELIXCOIN": 500,
    "ENCHANTED-RUNE/ELIXCOIN": 500,
    "SAPPHIRE-LENS/ELIXCOIN": 500,
    "POWER-CELL/ELIXCOIN": 500,
    "HYDRAULIC-PUMP/ELIXCOIN": 500,
    "SERVO-MOTOR/ELIXCOIN": 500,
    "PLATINUM-WIRE/ELIXCOIN": 500,
    "CRYSTAL-GEAR/ELIXCOIN": 500,
    "OBSIDIAN-BLADE/ELIXCOIN": 500,
    "NEON-CAPACITOR/ELIXCOIN": 500,
    "PHANTOM-CORE/ELIXCOIN": 500,
    "EMERALD-DRIVER/ELIXCOIN": 500,
    "CHRONO-SPRING/ELIXCOIN": 500,
    "PLASMA-COIL/ELIXCOIN": 500,
    "ARCANE-ALLOY/ELIXCOIN": 500,
    "MAGNETIC-ARRAY/ELIXCOIN": 500,
    "VOID-DIAMOND/ELIXCOIN": 5000,
    "PHOENIX-FEATHER/ELIXCOIN": 5000,
    "DRAGON-SCALE/ELIXCOIN": 5000,
    "CELESTIAL-CORE/ELIXCOIN": 5000,
    "QUANTUM-SHARD/ELIXCOIN": 5000,
    "STARFORGED-INGOT/ELIXCOIN": 5000,
    "INFINITY-CRYSTAL/ELIXCOIN": 5000,
    "THUNDER-ESSENCE/ELIXCOIN": 5000,
    "ABYSS-PEARL/ELIXCOIN": 5000,
    "SOLAR-FRAGMENT/ELIXCOIN": 5000,
    "LUNAR-PRISM/ELIXCOIN": 5000,
    "CHAOS-EMBER/ELIXCOIN": 5000,
    "TITAN-HEART/ELIXCOIN": 5000,
    "ETHERIUM-WIRE/ELIXCOIN": 5000,
    "RIFT-ANCHOR/ELIXCOIN": 5000,
    "FROST-NOVA-CORE/ELIXCOIN": 5000,
    "PYROCLASM-GEM/ELIXCOIN": 5000,
    "NEBULA-DUST/ELIXCOIN": 5000,
    "SINGULARITY-BOLT/ELIXCOIN": 5000,
    "GODSLAYER-ALLOY/ELIXCOIN": 5000,
    "TIMELESS-GEAR/ELIXCOIN": 5000,
    "DIMENSION-KEY/ELIXCOIN": 5000,
    "ETERNITY-MATRIX/ELIXCOIN": 5000,
    "PRIMORDIAL-ORE/ELIXCOIN": 5000,
    "OMEGA-CIRCUIT/ELIXCOIN": 5000,
};
const round8 = (n) => Math.round(n * 1e8) / 1e8;
const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 1e4) / 1e4;
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const ORDER_RATE_LIMIT = 10;
const CANCEL_RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const TICKER_CACHE_MS = 3_000;
const BOOK_CACHE_MS = 3_000;
const TRADES_CACHE_MS = 5_000;
let TradeSpotService = class TradeSpotService {
    static { TradeSpotService_1 = this; }
    tradeModel;
    poolModel;
    orderModel;
    userModel;
    assetRegistry;
    buffCollectionsService;
    orderTimestamps = new Map();
    cancelTimestamps = new Map();
    tickerCache = new Map();
    bookCache = new Map();
    tradesCache = new Map();
    logger = new common_1.Logger(TradeSpotService_1.name);
    constructor(tradeModel, poolModel, orderModel, userModel, assetRegistry, buffCollectionsService) {
        this.tradeModel = tradeModel;
        this.poolModel = poolModel;
        this.orderModel = orderModel;
        this.userModel = userModel;
        this.assetRegistry = assetRegistry;
        this.buffCollectionsService = buffCollectionsService;
    }
    evictRateLimit(map, telegramId, now) {
        const ts = map.get(telegramId);
        if (!ts)
            return;
        const cutoff = now - RATE_WINDOW_MS;
        const filtered = ts.filter((t) => t > cutoff);
        if (filtered.length === 0)
            map.delete(telegramId);
        else
            map.set(telegramId, filtered);
    }
    checkRateLimit(map, telegramId, limit, now) {
        this.evictRateLimit(map, telegramId, now);
        const ts = map.get(telegramId) || [];
        if (ts.length >= limit)
            return "Too many requests. Please slow down.";
        ts.push(now);
        map.set(telegramId, ts);
        return null;
    }
    async getAllActivePools() {
        return this.poolModel.find({ botEnabled: true }).exec();
    }
    async getAllPools() {
        return this.poolModel.find({}).lean().exec();
    }
    async setAdminPriceControl(pair, bidFloor, askCeiling) {
        const pool = await this.getPool(pair);
        const mid = round8((bidFloor + askCeiling) / 2);
        await this.poolModel
            .updateOne({ pair }, {
            $set: {
                adminBidFloor: bidFloor,
                adminAskCeiling: askCeiling,
                lastMid: mid,
            },
        })
            .exec();
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.logger.log(`[Admin] Price control set for ${pair}: BUY ≥ ${bidFloor} | SELL ≤ ${askCeiling} | mid = ${mid}`);
        return {
            success: true,
            pair,
            bidFloor,
            askCeiling,
            mid,
            message: `Price control active: bot trades between ${bidFloor} and ${askCeiling}`,
        };
    }
    async clearAdminPriceControl(pair) {
        await this.poolModel
            .updateOne({ pair }, { $set: { adminBidFloor: 0, adminAskCeiling: 0 } })
            .exec();
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.logger.log(`[Admin] Price control cleared for ${pair}`);
        return {
            success: true,
            pair,
            message: `Price control removed for ${pair}. Bot resumes normal drift.`,
        };
    }
    async setAdminWalls(pair, sellWalls, buyWalls) {
        const set = {};
        if (sellWalls !== undefined)
            set.adminSellWalls = sellWalls;
        if (buyWalls !== undefined)
            set.adminBuyWalls = buyWalls;
        if (Object.keys(set).length === 0) {
            return { success: false, error: "No walls provided" };
        }
        await this.poolModel.updateOne({ pair }, { $set: set }).exec();
        this.bookCache.delete(pair);
        const sellCount = sellWalls?.length ?? 0;
        const buyCount = buyWalls?.length ?? 0;
        this.logger.log(`[Admin] Walls set for ${pair}: ${sellCount} SELL + ${buyCount} BUY`);
        return {
            success: true,
            pair,
            sellWalls: sellWalls ?? [],
            buyWalls: buyWalls ?? [],
            message: `${sellCount} SELL walls + ${buyCount} BUY walls deployed for ${pair}`,
        };
    }
    async clearAdminWalls(pair) {
        await this.poolModel
            .updateOne({ pair }, { $set: { adminSellWalls: [], adminBuyWalls: [] } })
            .exec();
        this.bookCache.delete(pair);
        this.logger.log(`[Admin] Walls cleared for ${pair}`);
        return {
            success: true,
            pair,
            message: `All walls removed for ${pair}`,
        };
    }
    async getPool(pair = exports.DEFAULT_PAIR) {
        let pool = await this.poolModel.findOne({ pair }).exec();
        if (!pool) {
            if (exports.MINERAL_INITIAL_RATES[pair]) {
                const initialMid = exports.MINERAL_INITIAL_RATES[pair];
                const isBotEnabled = exports.CORE_BOT_PAIRS.has(pair);
                try {
                    pool = await this.poolModel.create({
                        pair,
                        baseReserve: 10_000_000,
                        quoteReserve: 1_000_000,
                        lastMid: initialMid,
                        spreadPct: exports.SPREAD_PCT,
                        feePct: exports.FEE_PCT,
                        midMin: initialMid * 0.5,
                        midMax: initialMid * 10,
                        botEnabled: isBotEnabled,
                    });
                }
                catch (err) {
                    if (err?.code === 11000) {
                        pool = await this.poolModel.findOne({ pair }).exec();
                    }
                    else {
                        throw err;
                    }
                }
                if (!pool) {
                    throw new Error(`Pool for ${pair} could not be created or found`);
                }
            }
            else {
                throw new Error(`Pool for ${pair} not found`);
            }
        }
        else if (pool.feePct !== exports.FEE_PCT) {
            pool.feePct = exports.FEE_PCT;
            await this.poolModel
                .updateOne({ pair }, { $set: { feePct: exports.FEE_PCT } })
                .exec();
        }
        if ((pool.volume24h && pool.volume24h < 0) ||
            (pool.baseReserve !== undefined && pool.baseReserve < 0) ||
            (pool.elixcoinReserve !== undefined && pool.elixcoinReserve < 0)) {
            const setOps = {};
            if (pool.volume24h < 0) {
                setOps.volume24h = 0;
                pool.volume24h = 0;
            }
            if (pool.quoteVolume24h < 0) {
                setOps.quoteVolume24h = 0;
                pool.quoteVolume24h = 0;
            }
            if (pool.baseReserve !== undefined && pool.baseReserve < 0) {
                setOps.baseReserve = 10000000;
                pool.baseReserve = 10000000;
            }
            if (pool.quoteReserve !== undefined && pool.quoteReserve < 0) {
                setOps.quoteReserve = 1000000;
                pool.quoteReserve = 1000000;
            }
            if (pool.elixcoinReserve !== undefined && pool.elixcoinReserve < 0) {
                setOps.elixcoinReserve = 10000000;
                pool.elixcoinReserve = 10000000;
            }
            if (pool.elixirReserve !== undefined && pool.elixirReserve < 0) {
                setOps.elixirReserve = 1000000;
                pool.elixirReserve = 1000000;
            }
            if (Object.keys(setOps).length > 0) {
                await this.poolModel.updateOne({ pair }, { $set: setOps }).exec();
            }
        }
        if (pool.adminBidFloor > 0 && pool.adminAskCeiling > 0) {
            const adminMid = round8((pool.adminBidFloor + pool.adminAskCeiling) / 2);
            pool.lastMid = adminMid;
            await this.poolModel
                .updateOne({ pair }, { $set: { lastMid: adminMid } })
                .exec();
        }
        else {
            const globalMid = await this.assetRegistry.getMidFromGlobalReserves(pair);
            if (globalMid > 0) {
                pool.lastMid = globalMid;
                await this.poolModel
                    .updateOne({ pair }, { $set: { lastMid: globalMid } })
                    .exec();
            }
        }
        return pool;
    }
    async getTicker(pair = exports.DEFAULT_PAIR) {
        const now = Date.now();
        const cache = this.tickerCache.get(pair);
        if (cache?.data && now - cache.ts < TICKER_CACHE_MS) {
            return cache.data;
        }
        const pool = await this.getPool(pair);
        const close = pool.lastMid;
        const open = pool.open24h || close;
        const high = pool.high24h || close;
        const low = pool.low24h === Infinity ? close : pool.low24h || close;
        const volume = pool.volume24h || 0;
        const quoteVolume = pool.quoteVolume24h || 0;
        const changePct = open ? ((close - open) / open) * 100 : 0;
        const [base, quote] = pair.split("/");
        const result = {
            success: true,
            pair,
            base,
            quote,
            last: round8(close),
            changePct: round4(changePct),
            high: round8(high),
            low: round8(low),
            volume: round2(volume),
            quoteVolume: round2(quoteVolume),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
        this.tickerCache.set(pair, { data: result, ts: now });
        return result;
    }
    async getTickers(pairs) {
        return Promise.all(pairs.map((p) => this.getTicker(p)));
    }
    async getOrderBook(depth = 10, pair = exports.DEFAULT_PAIR, telegramId) {
        const now = Date.now();
        const clamped = Math.max(5, Math.min(25, Math.floor(depth || 10)));
        const cache = this.bookCache.get(pair);
        if (cache?.data &&
            now - cache.ts < BOOK_CACHE_MS &&
            cache.depth === clamped) {
            return cache.data;
        }
        const pool = await this.getPool(pair);
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const step = 0.0012;
        const asks = [];
        const bids = [];
        const magnitude = Math.pow(10, Math.floor(Math.log10(mid)) - 7);
        const minVisibleTick = Math.max(magnitude, 0.00000001);
        const pctStep = mid * step;
        const levelStep = pctStep > minVisibleTick ? pctStep : minVisibleTick;
        const halfSpreadRaw = Math.max(mid * half, minVisibleTick);
        const maxSafeDepth = Math.max(1, Math.floor((mid - halfSpreadRaw) / levelStep));
        const safeDepth = Math.min(clamped, maxSafeDepth);
        for (let i = 0; i < safeDepth; i++) {
            const rngDepthAsks = mulberry32(Math.round(mid * 1e8) + i * 5123);
            const rngDepthBids = mulberry32(Math.round(mid * 1e8) + i * 7919);
            const askBase = rngDepthAsks() > 0.8
                ? 2_000_000 + rngDepthAsks() * 1_500_000
                : 150_000 + rngDepthAsks() * 600_000;
            const bidBase = rngDepthBids() > 0.8
                ? 2_000_000 + rngDepthBids() * 1_500_000
                : 150_000 + rngDepthBids() * 600_000;
            const askPrice = round8(mid + halfSpreadRaw + levelStep * i);
            asks.push({ price: askPrice, amount: round2(askBase) });
            const bidPrice = round8(mid - halfSpreadRaw - levelStep * i);
            bids.push({ price: bidPrice, amount: round2(bidBase) });
        }
        const openOrders = await this.orderModel
            .find({ pair, status: "OPEN" })
            .lean()
            .exec();
        for (const o of openOrders) {
            if (!isFinite(o.price) || o.price <= 0)
                continue;
            const remaining = (o.amount || 0) - (o.filledAmount || 0);
            if (remaining <= 0)
                continue;
            const isMine = !!telegramId && o.telegramId === telegramId;
            const targetList = o.side === "SELL" ? asks : bids;
            const match = targetList.find((x) => x.price === o.price);
            if (match) {
                match.amount += remaining;
                if (isMine)
                    match.isMine = true;
            }
            else {
                targetList.push({ price: o.price, amount: remaining, ...(isMine && { isMine: true }) });
            }
        }
        if (pool.adminSellWalls?.length) {
            for (const w of pool.adminSellWalls) {
                if (!w.price || !w.amount || w.amount <= 0)
                    continue;
                const match = asks.find((x) => x.price === w.price);
                if (match) {
                    match.amount += w.amount;
                }
                else {
                    asks.push({ price: w.price, amount: w.amount });
                }
            }
        }
        if (pool.adminBuyWalls?.length) {
            for (const w of pool.adminBuyWalls) {
                if (!w.price || !w.amount || w.amount <= 0)
                    continue;
                const match = bids.find((x) => x.price === w.price);
                if (match) {
                    match.amount += w.amount;
                }
                else {
                    bids.push({ price: w.price, amount: w.amount });
                }
            }
        }
        asks.sort((a, b) => a.price - b.price);
        bids.sort((a, b) => b.price - a.price);
        const finAsks = asks.slice(0, clamped);
        const finBids = bids.slice(0, clamped);
        const totalAsk = finAsks.reduce((acc, l) => acc + l.amount, 0);
        const totalBid = finBids.reduce((acc, l) => acc + l.amount, 0);
        const bidShare = totalAsk + totalBid > 0 ? (totalBid / (totalAsk + totalBid)) * 100 : 50;
        const result = {
            success: true,
            pair,
            mid: round8(mid),
            spread: round8(finAsks[0]?.price - finBids[0]?.price || 0),
            asks: finAsks,
            bids: finBids,
            bidShare: Math.max(0, Math.min(100, round2(bidShare))),
        };
        this.bookCache.set(pair, { data: result, ts: now, depth: clamped });
        return result;
    }
    async getTrades(limit = 30, pair = exports.DEFAULT_PAIR) {
        const now = Date.now();
        const n = Math.max(1, Math.min(100, Math.floor(limit || 30)));
        const cache = this.tradesCache.get(pair);
        if (cache?.data && now - cache.ts < TRADES_CACHE_MS && cache.limit === n) {
            return cache.data;
        }
        const trades = await this.tradeModel
            .find({ pair })
            .sort({ createdAt: -1 })
            .limit(n)
            .lean()
            .exec();
        const result = {
            success: true,
            trades: trades.map((t) => ({
                id: String(t._id),
                side: t.side,
                price: t.price,
                amount: t.amount,
                total: t.total,
                fee: t.fee,
                source: t.source,
                time: t.createdAt,
            })),
        };
        this.tradesCache.set(pair, { data: result, ts: now, limit: n });
        return result;
    }
    async getStats(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const botTrades = await this.tradeModel
            .countDocuments({ pair, source: "BOT" })
            .exec();
        const userTrades = await this.tradeModel
            .countDocuments({ pair, source: "USER" })
            .exec();
        return {
            success: true,
            lastBotRunAt: pool.lastBotRunAt,
            botRunCount: pool.botRunCount,
            botTrades,
            userTrades,
            totalTrades: botTrades + userTrades,
            lifetimeVolume: round2(pool.lifetimeVolume),
            platformFeesAccumulated: round4(pool.platformFeesAccumulated),
            spreadProfitAccumulated: round4(pool.spreadProfitAccumulated),
            quoteReserve: round2(pool.quoteReserve || pool.elixirReserve),
            baseReserve: round2(pool.baseReserve || pool.elixcoinReserve),
            lastMid: round8(pool.lastMid),
            feePct: pool.feePct,
            spreadPct: pool.spreadPct,
        };
    }
    async getInfo(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const since24 = new Date(Date.now() - 24 * 3600 * 1000);
        const agg24 = await this.tradeModel
            .aggregate([
            { $match: { pair, createdAt: { $gte: since24 } } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    volume: { $sum: "$amount" },
                    fees: { $sum: "$fee" },
                    buyVolume: {
                        $sum: { $cond: [{ $eq: ["$side", "BUY"] }, "$amount", 0] },
                    },
                    sellVolume: {
                        $sum: { $cond: [{ $eq: ["$side", "SELL"] }, "$amount", 0] },
                    },
                    botVolume: {
                        $sum: { $cond: [{ $eq: ["$source", "BOT"] }, "$amount", 0] },
                    },
                    userVolume: {
                        $sum: { $cond: [{ $eq: ["$source", "USER"] }, "$amount", 0] },
                    },
                },
            },
        ])
            .exec();
        const a = agg24[0] || {};
        const buckets = await this.tradeModel
            .aggregate([
            { $match: { pair, createdAt: { $gte: since24 } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d %H", date: "$createdAt" },
                    },
                    volume: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ])
            .exec();
        const bucketMap = new Map();
        for (const b of buckets) {
            bucketMap.set(String(b._id), { volume: b.volume, count: b.count });
        }
        const start = since24.getTime();
        const hourly = [];
        for (let i = 0; i < 24; i++) {
            const t = new Date(start + i * 3600_000);
            const key = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")} ${String(t.getUTCHours()).padStart(2, "0")}`;
            const b = bucketMap.get(key);
            hourly.push({
                hour: t.getUTCHours(),
                label: `${String(t.getUTCHours()).padStart(2, "0")}:00`,
                volume: round2(b?.volume || 0),
                count: b?.count || 0,
            });
        }
        const botTrades = await this.tradeModel
            .countDocuments({ pair, source: "BOT" })
            .exec();
        const userTrades = await this.tradeModel
            .countDocuments({ pair, source: "USER" })
            .exec();
        const [base, quote] = pair.split("/");
        return {
            success: true,
            pair,
            base,
            quote,
            last: round8(pool.lastMid),
            day: {
                trades: a.count || 0,
                volume: round2(a.volume || 0),
                quoteVolume: round2((a.volume || 0) * pool.lastMid),
                fees: round2(a.fees || 0),
                buyVolume: round2(a.buyVolume || 0),
                sellVolume: round2(a.sellVolume || 0),
                botVolume: round2(a.botVolume || 0),
                userVolume: round2(a.userVolume || 0),
            },
            lifetime: {
                trades: botTrades + userTrades,
                botTrades,
                userTrades,
                volume: round2(pool.lifetimeVolume),
                fees: round4(pool.platformFeesAccumulated),
                spreadProfit: round4(pool.spreadProfitAccumulated),
            },
            pool: {
                quoteReserve: round2(pool.quoteReserve || pool.elixirReserve),
                baseReserve: round2(pool.baseReserve || pool.elixcoinReserve),
                lastMid: round8(pool.lastMid),
                feePct: pool.feePct,
                spreadPct: pool.spreadPct,
            },
            hourly,
        };
    }
    async getBotStatus(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const stats = await this.getStats(pair);
        const intervalMs = (pool.botIntervalMinutes ?? 15) * 60_000;
        const lastRun = pool.lastBotRunAt ? pool.lastBotRunAt.getTime() : null;
        return {
            ...stats,
            pair,
            enabled: pool.botEnabled !== false,
            intervalMinutes: pool.botIntervalMinutes ?? 15,
            tradesPerCycle: pool.botTradesPerCycle ?? 10,
            lastBotRunAt: pool.lastBotRunAt ?? null,
            nextBotRunAt: lastRun ? new Date(lastRun + intervalMs) : new Date(),
        };
    }
    async updateBotConfig(body) {
        const pair = body.pair || exports.DEFAULT_PAIR;
        const pool = await this.getPool(pair);
        const set = {};
        if (typeof body.enabled === "boolean")
            set.botEnabled = body.enabled;
        if (body.intervalMinutes !== undefined) {
            const m = Number(body.intervalMinutes);
            if (!isFinite(m) || m < 1 || m > 60) {
                return {
                    success: false,
                    error: "Cooldown must be between 1 and 60 minutes",
                };
            }
            set.botIntervalMinutes = Math.round(m);
        }
        if (body.tradesPerCycle !== undefined) {
            const t = Number(body.tradesPerCycle);
            if (!isFinite(t) || t < 2 || t > 100) {
                return {
                    success: false,
                    error: "Trades per cycle must be between 2 and 100",
                };
            }
            set.botTradesPerCycle = Math.round(t);
        }
        if (Object.keys(set).length > 0) {
            await this.poolModel.updateOne({ pair }, { $set: set }).exec();
        }
        const status = await this.getBotStatus(pair);
        return { ...status, success: true };
    }
    async getHoldings(telegramId, pair = exports.DEFAULT_PAIR) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        const [base, quote] = pair.split("/");
        const crypto = user?.cryptoBalances;
        return {
            success: true,
            base,
            quote,
            baseBalance: round4(base === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[base] || 0),
            quoteBalance: round4(quote === "ELIXIR" ? user?.elixirBalance || 0 : crypto?.[quote] || 0),
            elixcoin: round4(crypto?.["ELIXCOIN"] || 0),
            elixir: round4(user?.elixirBalance || 0),
        };
    }
    async getMaxTradeable(telegramId, pair = exports.DEFAULT_PAIR, side = "BUY") {
        const pool = await this.getPool(pair);
        const [base, quote] = pair.split("/");
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return { success: false, error: "Account not found" };
        const crypto = user.cryptoBalances;
        const baseBalance = base === "ELIXIR" ? user.elixirBalance || 0 : crypto?.[base] || 0;
        const quoteBalance = quote === "ELIXIR" ? user.elixirBalance || 0 : crypto?.[quote] || 0;
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const ask = mid * (1 + half);
        const bid = mid * (1 - half);
        if (side.toUpperCase() === "SELL") {
            const itemBalance = isItemBase(base) ? Math.floor(baseBalance) : baseBalance;
            return {
                success: true,
                maxBase: isItemBase(base) ? itemBalance : round4(baseBalance),
                maxQuote: round4(itemBalance * bid),
                price: round8(bid),
                base,
                quote,
            };
        }
        const itemBase = isItemBase(base);
        let low = 0;
        let high = quoteBalance / (ask * 0.95);
        for (let i = 0; i < 20; i++) {
            const mid2 = (low + high) / 2;
            const impactRatio = mid2 / Math.max(1, pool.baseReserve ?? 10_000_000);
            const slippage = Math.min(0.05, impactRatio * 0.5);
            const effectivePrice = round8(ask * (1 + slippage));
            const cost = round4(mid2 * effectivePrice);
            const totalCost = itemBase ? round4(cost * (1 + exports.FEE_PCT)) : cost;
            if (totalCost <= quoteBalance)
                low = mid2;
            else
                high = mid2;
        }
        const maxBase = itemBase ? Math.floor(low) : round4(low);
        const rawQuote = round4(maxBase * ask);
        const maxQuote = itemBase ? round4(rawQuote * (1 + exports.FEE_PCT)) : rawQuote;
        return {
            success: true,
            maxBase,
            maxQuote,
            price: round8(ask),
            base,
            quote,
        };
    }
    async placeOrder(telegramId, body) {
        const rateErr = this.checkRateLimit(this.orderTimestamps, telegramId, ORDER_RATE_LIMIT, Date.now());
        if (rateErr)
            return { success: false, error: rateErr };
        const pair = body.pair || exports.DEFAULT_PAIR;
        const [base, quote] = pair.split("/");
        const pool = await this.getPool(pair);
        const side = String(body.side || "").toUpperCase();
        if (side !== "BUY" && side !== "SELL")
            return { success: false, error: "Invalid side" };
        const type = String(body.type || "market").toLowerCase();
        if (type !== "market" && type !== "limit")
            return { success: false, error: "Invalid order type" };
        const amount = Number(body.amount);
        if (!isFinite(amount) || amount <= 0)
            return { success: false, error: "Invalid amount" };
        const MIN_AMOUNT = 1;
        if (amount < MIN_AMOUNT)
            return {
                success: false,
                error: `Minimum order is ${MIN_AMOUNT} ${base}`,
            };
        const user = await this.userModel.findOne({ telegramId }).exec();
        if (!user)
            return { success: false, error: "Account not found" };
        const mid = pool.lastMid;
        const half = pool.spreadPct / 2;
        const ask = mid * (1 + half);
        const bid = mid * (1 - half);
        if (type === "market") {
            const execPrice = side === "BUY" ? ask : bid;
            return this.executeFill(pair, telegramId, side, round2(amount), round8(execPrice), "USER");
        }
        const limit = Number(body.price);
        if (!isFinite(limit) || limit <= 0)
            return { success: false, error: "Invalid limit price" };
        if (side === "BUY" && limit >= ask)
            return this.executeFill(pair, telegramId, "BUY", round2(amount), round8(ask), "USER");
        if (side === "SELL" && limit <= bid)
            return this.executeFill(pair, telegramId, "SELL", round2(amount), round8(bid), "USER");
        const order = await this.orderModel.create({
            pair,
            telegramId,
            side,
            price: round8(limit),
            amount: round2(amount),
            status: "OPEN",
        });
        return {
            success: true,
            resting: true,
            order: {
                id: String(order._id),
                side,
                price: order.price,
                amount: order.amount,
                status: "OPEN",
            },
            message: `Limit order placed — fills when the market crosses ${round8(limit)}`,
        };
    }
    async executeFill(pair, telegramId, side, amount, basePrice, source) {
        if (source === "USER" && !telegramId)
            return { success: false, error: "Missing account" };
        const pool = await this.getPool(pair);
        let price = basePrice;
        let shiftPct = 0;
        if (source === "USER") {
            const impactRatio = amount / Math.max(1, pool.baseReserve ?? 10_000_000);
            shiftPct = Math.min(0.05, impactRatio * 0.5);
            price = side === "BUY"
                ? round8(basePrice * (1 + shiftPct))
                : round8(basePrice * (1 - shiftPct));
        }
        const [base, quote] = pair.split("/");
        const baseKey = base === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${base}`;
        const quoteKey = quote === "ELIXIR" ? "elixirBalance" : `cryptoBalances.${quote}`;
        let updated = null;
        let fee = 0;
        let feeCurrency = base;
        let receivedBase = 0;
        if (side === "BUY") {
            const spendQuote = round4(amount * price);
            const itemBase = isItemBase(base);
            let actualSpend = 0;
            if (itemBase) {
                fee = round4(spendQuote * exports.FEE_PCT);
                actualSpend = round4(spendQuote + fee);
                receivedBase = amount;
                feeCurrency = quote;
                updated = await this.userModel
                    .findOneAndUpdate({ telegramId, [quoteKey]: { $gte: actualSpend } }, { $inc: { [quoteKey]: -actualSpend, [baseKey]: receivedBase } }, { returnDocument: "after" })
                    .exec();
                if (!updated)
                    return { success: false, error: `Insufficient ${quote} balance` };
            }
            else {
                fee = round4(amount * exports.FEE_PCT);
                receivedBase = round4(amount - fee);
                actualSpend = spendQuote;
                feeCurrency = base;
                updated = await this.userModel
                    .findOneAndUpdate({ telegramId, [quoteKey]: { $gte: spendQuote } }, { $inc: { [quoteKey]: -spendQuote, [baseKey]: receivedBase } }, { returnDocument: "after" })
                    .exec();
                if (!updated)
                    return { success: false, error: `Insufficient ${quote} balance` };
            }
            const midNudge = source === "USER" ? shiftPct * 0.5 : 0;
            const newMid = round8(pool.lastMid * (1 + midNudge));
            await this.poolModel
                .updateOne({ pair }, {
                $inc: {
                    baseReserve: -amount,
                    quoteReserve: actualSpend,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: round4(Math.abs(price - pool.lastMid) * amount),
                },
                $set: { lastMid: newMid },
            })
                .exec();
            await this.assetRegistry.updateReservesAfterFill(base, quote, -amount, actualSpend);
            const updatedPairs = await this.assetRegistry.propagateToAffectedPools(base, quote);
            if (updatedPairs.length > 0) {
                this.logger.log(`[CrossPair] BUY ${pair}: propagated to ${updatedPairs.join(', ')}`);
            }
            const total = actualSpend;
            const trade = await this.tradeModel.create({
                pair, side, price, amount, total, fee, feeCurrency, source,
                ...(source === "USER" ? { telegramId } : {}),
            });
            await this.poolModel
                .updateOne({ pair }, {
                $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: actualSpend },
                $max: { high24h: price },
                $min: { low24h: price },
            })
                .exec();
            this.tickerCache.delete(pair);
            this.tradesCache.delete(pair);
            const crypto = updated?.cryptoBalances;
            const getB = (k) => k === "elixirBalance" ? (updated?.elixirBalance ?? 0)
                : (crypto?.[k.replace("cryptoBalances.", "")] ?? 0);
            let autoGranted = 0;
            if (source === "USER" && telegramId) {
                try {
                    const itemId = base.toLowerCase();
                    const buffItem = await this.buffCollectionsService.getBuffItem(itemId);
                    if (buffItem?.success) {
                        for (let i = 0; i < Math.floor(receivedBase); i++) {
                            await this.buffCollectionsService.grantBuffItem(telegramId, itemId);
                            autoGranted++;
                        }
                    }
                }
                catch { }
            }
            return {
                success: true,
                resting: false,
                trade: { id: String(trade._id), side, price, amount, total, fee, feeCurrency, source },
                balances: {
                    baseBalance: round4(getB(baseKey)),
                    quoteBalance: round4(getB(quoteKey)),
                    elixir: round4(updated?.elixirBalance ?? 0),
                    elixcoin: round4(crypto?.["ELIXCOIN"] ?? 0),
                },
                ...(autoGranted > 0 ? { autoGranted, message: `Auto-granted ${autoGranted}x ${base} to your buff collection!` } : {}),
                message: itemBase
                    ? `Bought ${amount} ${base} @ ${price} ${quote}. Fee: ${fee} ${quote}.`
                    : `Bought ${receivedBase} ${base} @ ${price} ${quote}. Fee: ${fee} ${base}.`,
            };
        }
        else {
            const grossQuote = round4(amount * price);
            fee = round4(grossQuote * exports.FEE_PCT);
            const proceeds = round4(grossQuote - fee);
            feeCurrency = quote;
            updated = await this.userModel
                .findOneAndUpdate({ telegramId, [baseKey]: { $gte: amount } }, { $inc: { [baseKey]: -amount, [quoteKey]: proceeds } }, { returnDocument: "after" })
                .exec();
            if (!updated)
                return { success: false, error: `Insufficient ${base} balance` };
            const midNudge = source === "USER" ? shiftPct * 0.5 : 0;
            const newMid = round8(pool.lastMid * (1 - midNudge));
            await this.poolModel
                .updateOne({ pair }, {
                $inc: {
                    baseReserve: amount,
                    quoteReserve: -proceeds,
                    platformFeesAccumulated: fee,
                    spreadProfitAccumulated: round4(Math.abs(pool.lastMid - price) * amount),
                },
                $set: { lastMid: newMid },
            })
                .exec();
            await this.assetRegistry.updateReservesAfterFill(base, quote, amount, -proceeds);
            const updatedPairs = await this.assetRegistry.propagateToAffectedPools(base, quote);
            if (updatedPairs.length > 0) {
                this.logger.log(`[CrossPair] SELL ${pair}: propagated to ${updatedPairs.join(', ')}`);
            }
            const total = grossQuote;
            const trade = await this.tradeModel.create({
                pair, side, price, amount, total, fee, feeCurrency, source,
                ...(source === "USER" ? { telegramId } : {}),
            });
            await this.poolModel
                .updateOne({ pair }, {
                $inc: { lifetimeVolume: amount, volume24h: amount, quoteVolume24h: grossQuote },
                $max: { high24h: price },
                $min: { low24h: price },
            })
                .exec();
            this.tickerCache.delete(pair);
            this.tradesCache.delete(pair);
            let buffRemoved = 0;
            if (source === "USER" && telegramId) {
                try {
                    const itemId = base.toLowerCase();
                    const buffItem = await this.buffCollectionsService.getBuffItem(itemId);
                    if (buffItem?.success) {
                        buffRemoved = await this.buffCollectionsService.removeBuffItem(telegramId, itemId, Math.floor(amount));
                    }
                }
                catch { }
            }
            const crypto = updated?.cryptoBalances;
            const getB = (k) => k === "elixirBalance" ? (updated?.elixirBalance ?? 0)
                : (crypto?.[k.replace("cryptoBalances.", "")] ?? 0);
            return {
                success: true,
                resting: false,
                trade: { id: String(trade._id), side, price, amount, total, fee, feeCurrency, source },
                balances: {
                    baseBalance: round4(getB(baseKey)),
                    quoteBalance: round4(getB(quoteKey)),
                    elixir: round4(updated?.elixirBalance ?? 0),
                    elixcoin: round4(crypto?.["ELIXCOIN"] ?? 0),
                },
                ...(buffRemoved > 0 ? { buffRemoved, message: `Sold ${amount} ${base} @ ${price} ${quote}. Removed ${buffRemoved} from buff collection.` } : {}),
                message: `Sold ${amount} ${base} @ ${price} ${quote}. Proceeds: ${proceeds} ${quote}. Fee: ${fee} ${quote}.`,
            };
        }
    }
    async getOpenOrders(telegramId, pair = exports.DEFAULT_PAIR) {
        const orders = await this.orderModel
            .find({ telegramId, status: "OPEN", pair })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return {
            success: true,
            orders: orders.map((o) => ({
                id: String(o._id),
                side: o.side,
                price: o.price,
                amount: o.amount,
                status: o.status,
                createdAt: o.createdAt,
            })),
        };
    }
    async cancelOrder(telegramId, orderId) {
        const rateErr = this.checkRateLimit(this.cancelTimestamps, telegramId, CANCEL_RATE_LIMIT, Date.now());
        if (rateErr)
            return { success: false, error: rateErr };
        const order = await this.orderModel
            .findOneAndUpdate({ _id: orderId, telegramId, status: "OPEN" }, { $set: { status: "CANCELLED" } }, { returnDocument: "after" })
            .exec();
        if (!order)
            return { success: false, error: "Order not found or already closed" };
        return { success: true, order };
    }
    async getUserTrades(telegramId, page = 1, limit = 5, pair = exports.DEFAULT_PAIR) {
        const p = Math.max(1, Math.floor(page || 1));
        const n = Math.max(1, Math.min(50, Math.floor(limit || 5)));
        const skip = (p - 1) * n;
        const query = { telegramId, source: "USER" };
        if (pair)
            query.pair = pair;
        const trades = await this.tradeModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(n)
            .lean()
            .exec();
        const total = await this.tradeModel.countDocuments(query).exec();
        return {
            success: true,
            trades: trades.map((t) => ({
                id: String(t._id),
                side: t.side,
                price: t.price,
                amount: t.amount,
                total: t.total,
                fee: t.fee,
                feeCurrency: t.feeCurrency,
                source: t.source,
                time: t.createdAt,
            })),
            page: p,
            limit: n,
            hasMore: skip + trades.length < total,
            total,
        };
    }
    async matchOpenOrders(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const half = pool.spreadPct / 2;
        const ask = pool.lastMid * (1 + half);
        const bid = pool.lastMid * (1 - half);
        const open = await this.orderModel
            .find({ status: "OPEN", pair })
            .lean()
            .exec();
        const fills = [];
        for (const o of open) {
            let fillPrice = 0;
            if (o.side === "BUY" && o.price >= ask)
                fillPrice = ask;
            if (o.side === "SELL" && o.price <= bid)
                fillPrice = bid;
            if (!fillPrice)
                continue;
            const res = await this.executeFill(pair, o.telegramId, o.side, o.amount, round8(fillPrice), "USER");
            if (res.success) {
                await this.orderModel
                    .updateOne({ _id: o._id }, { $set: { status: "FILLED", filledAmount: o.amount } })
                    .exec();
                fills.push({ orderId: String(o._id), trade: res.trade });
            }
        }
        return fills;
    }
    static STABLE_ASSETS = new Set(["USDC", "ELIXIR"]);
    driftedThisCycle = new Set();
    async driftMid(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const [base, quote] = pair.split("/");
        if (pool.adminBidFloor > 0 && pool.adminAskCeiling > 0) {
            const floor = pool.adminBidFloor;
            const ceiling = pool.adminAskCeiling;
            const adminMid = (floor + ceiling) / 2;
            const volatility = (Math.random() - 0.5) * 0.002;
            let next = adminMid * (1 + volatility);
            next = Math.max(floor, Math.min(ceiling, next));
            const newMid = round8(next);
            pool.lastMid = newMid;
            await this.poolModel
                .updateOne({ pair }, { $set: { lastMid: newMid } })
                .exec();
            return;
        }
        const baseAsset = await this.assetRegistry.getAsset(base);
        if (!this.driftedThisCycle.has(base)) {
            const baseVolatility = (Math.random() - 0.5) * 0.006;
            let baseGravity = 0;
            if (baseAsset.anchorUsdPrice > 0) {
                const baseDiffPct = (baseAsset.usdPrice - baseAsset.anchorUsdPrice) / baseAsset.anchorUsdPrice;
                baseGravity = -baseDiffPct * 0.05;
            }
            const baseDrift = baseVolatility + baseGravity;
            const newBasePrice = Math.max(baseAsset.priceMin, Math.min(baseAsset.priceMax, baseAsset.usdPrice * (1 + baseDrift)));
            await this.assetRegistry.setUsdPrice(base, newBasePrice);
            this.driftedThisCycle.add(base);
        }
        await this.assetRegistry.propagateToAffectedPools(base, quote);
    }
    clearDriftCycle() {
        this.driftedThisCycle.clear();
    }
    async botCycle(pair = exports.DEFAULT_PAIR) {
        const pool = await this.getPool(pair);
        const mid = pool.lastMid;
        const [base, quote] = pair.split("/");
        const tradesPerSide = Math.max(1, Math.floor((pool.botTradesPerCycle ?? 10) / 2));
        const sides = [
            ...Array(tradesPerSide).fill("BUY"),
            ...Array(tradesPerSide).fill("SELL"),
        ].sort(() => Math.random() - 0.5);
        const trades = [];
        const baseReserveKey = "baseReserve";
        const quoteReserveKey = "quoteReserve";
        const baseResVal = pool.baseReserve || pool.elixcoinReserve;
        const quoteResVal = pool.quoteReserve || pool.elixirReserve;
        const hasAdminRange = pool.adminBidFloor > 0 && pool.adminAskCeiling > 0;
        const adminFloor = pool.adminBidFloor;
        const adminCeiling = pool.adminAskCeiling;
        for (const side of sides) {
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 6000) + 2000));
            const isItem = mid >= 1;
            let amount;
            if (isItem) {
                amount = Math.floor(Math.random() * 10) + 1;
            }
            else {
                const targetQuoteVolume = Math.random() * 290 + 10;
                amount = targetQuoteVolume / mid;
                if (amount < 150) {
                    amount = Math.random() * 850 + 150;
                }
                else if (amount > 150_000) {
                    amount = Math.random() * 50_000 + 20_000;
                }
                amount = Math.floor(amount);
            }
            const priceRound = isItem ? round2 : round8;
            let price;
            if (hasAdminRange) {
                if (side === "BUY") {
                    price = priceRound(adminFloor + Math.random() * (mid - adminFloor));
                }
                else {
                    price = priceRound(mid + Math.random() * (adminCeiling - mid));
                }
            }
            else {
                const spreadFactor = pool.spreadPct || 0.004;
                if (side === "BUY") {
                    price = priceRound(mid * (1 - Math.random() * spreadFactor));
                }
                else {
                    price = priceRound(mid * (1 + Math.random() * spreadFactor));
                }
            }
            const total = round4(amount * price);
            const fee = round4(total * exports.FEE_PCT);
            await this.poolModel
                .updateOne({ pair }, { $inc: { platformFeesAccumulated: fee } })
                .exec();
            const trade = await this.tradeModel.create({
                pair,
                side,
                price,
                amount,
                total,
                fee,
                feeCurrency: side === "BUY" ? base : quote,
                source: "BOT",
            });
            trades.push(trade);
        }
        const now = Date.now();
        const shouldResetDay = !pool.dayResetAt || now - pool.dayResetAt.getTime() > 24 * 3600_000;
        const cycleVolume = trades.reduce((a, t) => a + t.amount, 0);
        const cycleQuoteVol = trades.reduce((a, t) => a + t.total, 0);
        const updateOps = {
            $inc: {
                lifetimeVolume: cycleVolume,
                botRunCount: 1,
            },
        };
        if (shouldResetDay && trades.length > 0) {
            const lastPrice = trades[trades.length - 1].price;
            updateOps.$set = {
                lastBotRunAt: new Date(),
                high24h: lastPrice,
                low24h: lastPrice,
                volume24h: cycleVolume,
                quoteVolume24h: cycleQuoteVol,
                open24h: lastPrice,
                dayResetAt: new Date(),
            };
        }
        else {
            updateOps.$set = { lastBotRunAt: new Date() };
            updateOps.$inc.volume24h = cycleVolume;
            updateOps.$inc.quoteVolume24h = cycleQuoteVol;
            if (trades.length > 0) {
                const lastPrice = trades[trades.length - 1].price;
                updateOps.$max = { high24h: lastPrice };
                updateOps.$min = { low24h: lastPrice };
            }
        }
        await this.poolModel.updateOne({ pair }, updateOps).exec();
        if (pool.botRunCount && pool.botRunCount % 15 === 0) {
            const excessBots = await this.tradeModel
                .find({ pair, source: "BOT" })
                .sort({ createdAt: -1 })
                .skip(200)
                .select("_id")
                .exec();
            if (excessBots.length > 0) {
                const excessIds = excessBots.map((doc) => doc._id);
                await this.tradeModel.deleteMany({ _id: { $in: excessIds } }).exec();
            }
        }
        this.tickerCache.delete(pair);
        this.bookCache.delete(pair);
        this.tradesCache.delete(pair);
        return { count: trades.length, trades };
    }
};
exports.TradeSpotService = TradeSpotService;
exports.TradeSpotService = TradeSpotService = TradeSpotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(trade_schema_1.Trade.name)),
    __param(1, (0, mongoose_1.InjectModel)(pool_schema_1.LiquidityPool.name)),
    __param(2, (0, mongoose_1.InjectModel)(open_order_schema_1.OpenOrder.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        asset_registry_service_1.AssetRegistryService,
        buff_item_collections_service_1.BuffItemCollectionsService])
], TradeSpotService);
//# sourceMappingURL=trade-spot.service.js.map