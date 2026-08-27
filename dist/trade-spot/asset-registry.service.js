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
var AssetRegistryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetRegistryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const asset_registry_schema_1 = require("./schemas/asset-registry.schema");
const pool_schema_1 = require("./schemas/pool.schema");
const round8 = (n) => Math.round(n * 1e8) / 1e8;
const ASSET_SEEDS = {
    USDC: { virtualReserve: 1_000_000, anchorUsdPrice: 1.0 },
    ELIXIR: { virtualReserve: 100_000_000, anchorUsdPrice: 0.001 },
    ELIXCOIN: { virtualReserve: 10_000_000, anchorUsdPrice: 0.00000967 },
    IRON: { virtualReserve: 10_000_000, anchorUsdPrice: 0.00000030 },
    COPPER: { virtualReserve: 10_000_000, anchorUsdPrice: 0.00000060 },
    SILVER: { virtualReserve: 10_000_000, anchorUsdPrice: 0.00000068 },
    GOLD: { virtualReserve: 10_000_000, anchorUsdPrice: 0.0000068 },
    DIAMOND: { virtualReserve: 10_000_000, anchorUsdPrice: 0.000068 },
};
let AssetRegistryService = class AssetRegistryService {
    static { AssetRegistryService_1 = this; }
    assetModel;
    poolModel;
    logger = new common_1.Logger(AssetRegistryService_1.name);
    cache = new Map();
    constructor(assetModel, poolModel) {
        this.assetModel = assetModel;
        this.poolModel = poolModel;
    }
    async bootstrap() {
        for (const [asset, seed] of Object.entries(ASSET_SEEDS)) {
            const exists = await this.assetModel.findOne({ asset }).lean().exec();
            if (!exists) {
                await this.assetModel.create({
                    asset,
                    virtualReserve: seed.virtualReserve,
                    usdPrice: seed.anchorUsdPrice,
                    anchorUsdPrice: seed.anchorUsdPrice,
                    priceMin: seed.anchorUsdPrice * 0.01,
                    priceMax: seed.anchorUsdPrice * 100,
                });
                this.logger.log(`[AssetRegistry] Bootstrapped ${asset}`);
            }
            if (AssetRegistryService_1.STABLE_ASSETS.has(asset)) {
                await this.assetModel
                    .updateOne({ asset, usdPrice: { $ne: seed.anchorUsdPrice } }, { $set: { usdPrice: seed.anchorUsdPrice } })
                    .exec();
                this.cache.delete(asset);
            }
        }
    }
    async getAsset(asset) {
        let a = this.cache.get(asset);
        if (a)
            return a;
        let doc = await this.assetModel.findOne({ asset }).lean().exec();
        if (!doc) {
            const seed = ASSET_SEEDS[asset];
            if (seed) {
                doc = await this.assetModel.create({
                    asset,
                    virtualReserve: seed.virtualReserve,
                    usdPrice: seed.anchorUsdPrice,
                    anchorUsdPrice: seed.anchorUsdPrice,
                    priceMin: seed.anchorUsdPrice * 0.01,
                    priceMax: seed.anchorUsdPrice * 100,
                });
            }
            else {
                doc = await this.assetModel.create({
                    asset,
                    virtualReserve: 0,
                    usdPrice: 0,
                    anchorUsdPrice: 0,
                });
            }
        }
        this.cache.set(asset, doc);
        return doc;
    }
    async recalcUsdPrice(asset) {
        const a = await this.getAsset(asset);
        if (a.virtualReserve <= 0 || a.anchorUsdPrice <= 0)
            return a.usdPrice;
        const seed = ASSET_SEEDS[asset];
        const refReserve = seed?.virtualReserve ?? a.virtualReserve;
        const newPrice = a.anchorUsdPrice * (refReserve / a.virtualReserve);
        const clamped = Math.max(a.priceMin, Math.min(a.priceMax, newPrice));
        await this.assetModel
            .updateOne({ asset }, { $set: { usdPrice: round8(clamped) } })
            .exec();
        a.usdPrice = round8(clamped);
        this.cache.set(asset, a);
        return a.usdPrice;
    }
    async getMidFromGlobalReserves(pair) {
        const [base, quote] = pair.split("/");
        const baseAsset = await this.getAsset(base);
        const quoteAsset = await this.getAsset(quote);
        if (baseAsset.usdPrice <= 0 || quoteAsset.usdPrice <= 0) {
            return baseAsset.anchorUsdPrice > 0
                ? baseAsset.anchorUsdPrice / quoteAsset.anchorUsdPrice
                : 0;
        }
        return round8(baseAsset.usdPrice / quoteAsset.usdPrice);
    }
    async updateReservesAfterFill(base, quote, baseDelta, quoteDelta) {
        await this.assetModel
            .updateOne({ asset: base }, { $inc: { virtualReserve: baseDelta } })
            .exec();
        this.cache.delete(base);
        await this.assetModel
            .updateOne({ asset: quote }, { $inc: { virtualReserve: quoteDelta } })
            .exec();
        this.cache.delete(quote);
        const basePrice = await this.recalcUsdPrice(base);
        const quotePrice = await this.recalcUsdPrice(quote);
        return { basePrice, quotePrice };
    }
    async propagateToAffectedPools(base, quote) {
        const affectedPools = await this.poolModel
            .find({
            $or: [
                { pair: { $regex: new RegExp(`^${base}/`) } },
                { pair: { $regex: new RegExp(`/${base}$`) } },
                { pair: { $regex: new RegExp(`^${quote}/`) } },
                { pair: { $regex: new RegExp(`/${quote}$`) } },
            ],
        })
            .lean()
            .exec();
        const updatedPairs = [];
        for (const pool of affectedPools) {
            const newMid = await this.getMidFromGlobalReserves(pool.pair);
            if (newMid > 0 && newMid !== pool.lastMid) {
                await this.poolModel
                    .updateOne({ pair: pool.pair }, { $set: { lastMid: newMid } })
                    .exec();
                updatedPairs.push(pool.pair);
            }
        }
        return updatedPairs;
    }
    async propagateAllPools() {
        const pools = await this.poolModel.find({}).lean().exec();
        for (const pool of pools) {
            const newMid = await this.getMidFromGlobalReserves(pool.pair);
            if (newMid > 0) {
                await this.poolModel
                    .updateOne({ pair: pool.pair }, { $set: { lastMid: newMid } })
                    .exec();
            }
        }
    }
    async migrateFromPools() {
        const pools = await this.poolModel.find({}).lean().exec();
        for (const pool of pools) {
            const [base, quote] = pool.pair.split("/");
            const baseReserve = pool.baseReserve || pool.elixcoinReserve || 0;
            const quoteReserve = pool.quoteReserve || pool.elixirReserve || 0;
            if (baseReserve > 0) {
                await this.assetModel
                    .updateOne({ asset: base }, { $max: { virtualReserve: baseReserve } })
                    .exec();
            }
            if (quoteReserve > 0) {
                await this.assetModel
                    .updateOne({ asset: quote }, { $max: { virtualReserve: quoteReserve } })
                    .exec();
            }
        }
        this.logger.log("[AssetRegistry] Migration from pools complete");
    }
    static STABLE_ASSETS = new Set(["USDC", "ELIXIR"]);
    async setUsdPrice(asset, price) {
        if (AssetRegistryService_1.STABLE_ASSETS.has(asset)) {
            const seed = ASSET_SEEDS[asset];
            if (seed) {
                this.cache.delete(asset);
                return;
            }
        }
        await this.assetModel
            .updateOne({ asset }, { $set: { usdPrice: round8(price) } })
            .exec();
        this.cache.delete(asset);
    }
    invalidateCache(asset) {
        if (asset)
            this.cache.delete(asset);
        else
            this.cache.clear();
    }
};
exports.AssetRegistryService = AssetRegistryService;
exports.AssetRegistryService = AssetRegistryService = AssetRegistryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(asset_registry_schema_1.AssetRegistry.name)),
    __param(1, (0, mongoose_1.InjectModel)(pool_schema_1.LiquidityPool.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AssetRegistryService);
//# sourceMappingURL=asset-registry.service.js.map