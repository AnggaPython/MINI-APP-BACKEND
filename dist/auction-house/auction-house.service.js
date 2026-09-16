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
var AuctionHouseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionHouseService = exports.LISTING_DURATION_MS = exports.COLLATERAL_DEPOSIT = exports.MIN_PRICE_TABLE = void 0;
const schedule_1 = require("@nestjs/schedule");
const material_tools_1 = require("../constants/material-tools");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const auction_schema_1 = require("./schemas/auction.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_service_1 = require("../users/users.service");
const buff_item_schema_1 = require("../buff-item-collections/schemas/buff-item.schema");
const user_buff_collection_schema_1 = require("../buff-item-collections/schemas/user-buff-collection.schema");
const PLATFORM_TAX_RATE = 0.19;
const COLLATERAL_DEPOSIT = 10_000;
exports.COLLATERAL_DEPOSIT = COLLATERAL_DEPOSIT;
const COLLATERAL_PENALTY_RATE = 0.5;
const LISTING_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
exports.LISTING_DURATION_MS = LISTING_DURATION_MS;
const MIN_PRICE_TABLE = {
    ATK: { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
    ECONOMY: { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
    DURABILITY: { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
    DROPRATE: { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
};
exports.MIN_PRICE_TABLE = MIN_PRICE_TABLE;
let AuctionHouseService = AuctionHouseService_1 = class AuctionHouseService {
    auctionModel;
    userModel;
    buffItemModel;
    userBuffModel;
    usersService;
    logger = new common_1.Logger(AuctionHouseService_1.name);
    constructor(auctionModel, userModel, buffItemModel, userBuffModel, usersService) {
        this.auctionModel = auctionModel;
        this.userModel = userModel;
        this.buffItemModel = buffItemModel;
        this.userBuffModel = userBuffModel;
        this.usersService = usersService;
    }
    async createListing(telegramId, price, itemCategory, instanceId, baseItemId, amount = 1) {
        if (!price || price <= 0 || !isFinite(price)) {
            return { success: false, error: "Invalid price" };
        }
        let buffType = "MATERIAL";
        let rarity = "COMMON";
        let actualBaseItemId = baseItemId;
        if (itemCategory === "buff") {
            if (!instanceId)
                return { success: false, error: "Missing instanceId for buff" };
            const collection = await this.userBuffModel.findOne({ telegramId });
            if (!collection || !collection.inventory) {
                return { success: false, error: "No buff collection found" };
            }
            const ownedIndex = collection.inventory.findIndex(i => i.instanceId === instanceId);
            if (ownedIndex === -1) {
                return { success: false, error: "You do not own this item instance" };
            }
            actualBaseItemId = collection.inventory[ownedIndex].baseItemId;
            const buffItem = await this.buffItemModel.findOne({ buffId: actualBaseItemId }).lean();
            if (!buffItem)
                return { success: false, error: "Buff item not found" };
            const minPrice = MIN_PRICE_TABLE[buffItem.buffType][buffItem.rarity];
            if (price < minPrice) {
                return { success: false, error: `Minimum listing price is ${minPrice.toLocaleString()} ELIXCOIN` };
            }
            buffType = buffItem.buffType;
            rarity = buffItem.rarity;
            const existingListing = await this.auctionModel.findOne({ sellerId: telegramId, instanceId, status: "active" });
            if (existingListing)
                return { success: false, error: "This item instance is already listed" };
        }
        else if (itemCategory === "material") {
            if (!baseItemId)
                return { success: false, error: "Missing baseItemId (Material Name)" };
            actualBaseItemId = baseItemId;
            const user = await this.userModel.findOne({ telegramId });
            if (!user)
                return { success: false, error: "User not found" };
            const currentAmount = user.materials?.[baseItemId] || 0;
            if (currentAmount < amount) {
                return { success: false, error: `Insufficient ${baseItemId}. Setup requires ${amount} but you have ${currentAmount}.` };
            }
            rarity = material_tools_1.MATERIAL_TOOLS_RARITY_MAP[baseItemId] || "COMMON";
            buffType = "MATERIAL";
        }
        const user = await this.userModel.findOne({ telegramId });
        if (!user)
            return { success: false, error: "User not found" };
        const balance = user.cryptoBalances?.["ELIXCOIN"] || 0;
        if (balance < COLLATERAL_DEPOSIT) {
            return {
                success: false,
                error: `Insufficient ELIXCOIN for collateral deposit. You need ${COLLATERAL_DEPOSIT.toLocaleString()} ELIXCOIN`,
            };
        }
        const tax = Math.round(price * PLATFORM_TAX_RATE * 100) / 100;
        const netAmount = Math.round((price - tax) * 100) / 100;
        const sellerName = user.firstName || user.username || "Unknown";
        const depositResult = await this.userModel.findOneAndUpdate({ telegramId, "cryptoBalances.ELIXCOIN": { $gte: COLLATERAL_DEPOSIT } }, { $inc: { "cryptoBalances.ELIXCOIN": -COLLATERAL_DEPOSIT } }, { returnDocument: "after" }).exec();
        if (!depositResult) {
            return { success: false, error: "Insufficient ELIXCOIN for collateral deposit" };
        }
        if (itemCategory === "buff") {
            const collection = await this.userBuffModel.findOne({ telegramId });
            if (collection) {
                const ownedIndex = collection.inventory.findIndex(i => i.instanceId === instanceId);
                if (ownedIndex !== -1)
                    collection.inventory.splice(ownedIndex, 1);
                collection.activeInstanceIds = collection.activeInstanceIds.filter((id) => id !== instanceId);
                await collection.save();
            }
        }
        else if (itemCategory === "material") {
            await this.userModel.findOneAndUpdate({ telegramId }, { $inc: { [`materials.${actualBaseItemId}`]: -amount } }).exec();
        }
        const now = Date.now();
        let auction;
        try {
            auction = await this.auctionModel.create({
                sellerId: telegramId,
                sellerName,
                itemCategory,
                instanceId,
                baseItemId: actualBaseItemId,
                amount,
                buffType,
                rarity,
                price,
                tax,
                netAmount,
                status: "active",
                listedAt: new Date(),
                expiresAt: new Date(now + LISTING_DURATION_MS),
                collateralDeposit: COLLATERAL_DEPOSIT,
                collateralReturned: false,
            });
        }
        catch (err) {
            const duplicateKey = err?.code === 11000;
            await this.userModel
                .findOneAndUpdate({ telegramId }, { $inc: { "cryptoBalances.ELIXCOIN": COLLATERAL_DEPOSIT } })
                .exec();
            if (itemCategory === "buff") {
                await this.userBuffModel
                    .findOneAndUpdate({ telegramId }, {
                    $push: {
                        inventory: {
                            instanceId,
                            baseItemId: actualBaseItemId,
                            acquiredAt: new Date(),
                        },
                    },
                }, { upsert: true })
                    .exec();
            }
            else if (itemCategory === "material") {
                await this.userModel
                    .findOneAndUpdate({ telegramId }, { $inc: { [`materials.${actualBaseItemId}`]: amount } })
                    .exec();
            }
            return {
                success: false,
                error: duplicateKey
                    ? "This item instance is already listed"
                    : "Could not create the listing, your item and deposit were returned",
            };
        }
        return {
            success: true,
            collateralDeposit: COLLATERAL_DEPOSIT,
            listingDurationDays: 7,
            auction: {
                id: auction._id.toString(),
                itemCategory,
                instanceId,
                baseItemId: actualBaseItemId,
                amount,
                buffType,
                rarity,
                price,
                tax,
                netAmount,
                sellerName,
                listedAt: auction.listedAt,
            },
        };
    }
    async buyListing(telegramId, auctionId) {
        const listing = await this.auctionModel.findOne({
            _id: auctionId,
            status: "active",
        });
        if (!listing)
            return { success: false, error: "Listing not found or already sold" };
        if (listing.expiresAt && new Date() > listing.expiresAt) {
            return { success: false, error: "This listing has expired" };
        }
        if (listing.sellerId === telegramId) {
            return { success: false, error: "Cannot buy your own listing" };
        }
        const buyer = await this.userModel.findOne({ telegramId });
        if (!buyer)
            return { success: false, error: "User not found" };
        const claimed = await this.auctionModel
            .findOneAndUpdate({ _id: listing._id, status: "active" }, {
            $set: {
                status: "settling",
                buyerId: telegramId,
                claimExpiresAt: new Date(Date.now() + 30_000),
            },
        }, { returnDocument: "after" })
            .exec();
        if (!claimed) {
            return { success: false, error: "Listing not found or already sold" };
        }
        const releaseClaim = async () => {
            await this.auctionModel
                .updateOne({ _id: listing._id, status: "settling" }, { $set: { status: "active" }, $unset: { buyerId: "", claimExpiresAt: "" } })
                .exec();
        };
        const buyerBalance = buyer.cryptoBalances?.["ELIXCOIN"] || 0;
        if (buyerBalance < listing.price) {
            await releaseClaim();
            return {
                success: false,
                error: `Insufficient ELIXCOIN. You need ${listing.price.toLocaleString()} but have ${buyerBalance.toFixed(2)}`,
            };
        }
        const buyerUpdate = await this.userModel.findOneAndUpdate({ telegramId, "cryptoBalances.ELIXCOIN": { $gte: listing.price } }, { $inc: { "cryptoBalances.ELIXCOIN": -listing.price } }, { returnDocument: "after" }).exec();
        if (!buyerUpdate) {
            await releaseClaim();
            return { success: false, error: "Insufficient ELIXCOIN balance" };
        }
        const sellerPayout = listing.netAmount + listing.collateralDeposit;
        await this.userModel.findOneAndUpdate({ telegramId: listing.sellerId }, { $inc: { "cryptoBalances.ELIXCOIN": sellerPayout } }).exec();
        if (listing.itemCategory === "buff") {
            const transferredInstance = {
                instanceId: listing.instanceId,
                baseItemId: listing.baseItemId,
                acquiredAt: new Date(),
            };
            await this.userBuffModel.findOneAndUpdate({ telegramId }, { $push: { inventory: transferredInstance } }, { upsert: true }).exec();
        }
        else if (listing.itemCategory === "material") {
            await this.userModel.findOneAndUpdate({ telegramId }, { $inc: { [`materials.${listing.baseItemId}`]: listing.amount || 1 } }).exec();
        }
        await this.auctionModel
            .updateOne({ _id: listing._id, status: "settling" }, {
            $set: {
                status: "sold",
                buyerId: telegramId,
                resolvedAt: new Date(),
                collateralReturned: true,
            },
            $unset: { claimExpiresAt: "" },
        })
            .exec();
        return {
            success: true,
            purchased: {
                instanceId: listing.instanceId,
                baseItemId: listing.baseItemId,
                buffType: listing.buffType,
                rarity: listing.rarity,
                price: listing.price,
                tax: listing.tax,
                seller: listing.sellerName,
            },
        };
    }
    async cancelListing(telegramId, auctionId) {
        const listing = await this.auctionModel.findOne({
            _id: auctionId,
            sellerId: telegramId,
            status: "active",
        });
        if (!listing)
            return { success: false, error: "Listing not found or not yours" };
        const claim = await this.auctionModel
            .findOneAndUpdate({ _id: listing._id, sellerId: telegramId, status: "active" }, { $set: { status: "settling", claimExpiresAt: new Date(Date.now() + 30_000) } }, { returnDocument: "after" })
            .exec();
        if (!claim) {
            return { success: false, error: "Listing not found or not yours" };
        }
        if (listing.itemCategory === "buff") {
            const instanceToReturn = {
                instanceId: listing.instanceId,
                baseItemId: listing.baseItemId,
                acquiredAt: new Date(),
            };
            await this.userBuffModel.findOneAndUpdate({ telegramId }, { $push: { inventory: instanceToReturn } }, { upsert: true }).exec();
        }
        else if (listing.itemCategory === "material") {
            await this.userModel.findOneAndUpdate({ telegramId }, { $inc: { [`materials.${listing.baseItemId}`]: listing.amount || 1 } }).exec();
        }
        const returnedDeposit = Math.round(listing.collateralDeposit * COLLATERAL_PENALTY_RATE);
        const penalty = listing.collateralDeposit - returnedDeposit;
        if (returnedDeposit > 0) {
            await this.userModel.findOneAndUpdate({ telegramId }, { $inc: { "cryptoBalances.ELIXCOIN": returnedDeposit } }).exec();
        }
        await this.auctionModel
            .updateOne({ _id: listing._id, status: "settling" }, {
            $set: {
                status: "cancelled",
                resolvedAt: new Date(),
                collateralReturned: true,
            },
            $unset: { claimExpiresAt: "" },
        })
            .exec();
        return {
            success: true,
            instanceId: listing.instanceId,
            collateralDeposit: listing.collateralDeposit,
            penalty,
            returnedDeposit,
        };
    }
    async expireOldListings() {
        const expired = await this.auctionModel.find({
            status: "active",
            expiresAt: { $lte: new Date() },
        });
        if (expired.length === 0)
            return 0;
        let count = 0;
        for (const listing of expired) {
            const claim = await this.auctionModel
                .findOneAndUpdate({ _id: listing._id, status: "active" }, { $set: { status: "settling" } }, { returnDocument: "after" })
                .exec();
            if (!claim)
                continue;
            if (listing.itemCategory === "buff") {
                const instanceToReturn = {
                    instanceId: listing.instanceId,
                    baseItemId: listing.baseItemId,
                    acquiredAt: new Date(),
                };
                await this.userBuffModel.findOneAndUpdate({ telegramId: listing.sellerId }, { $push: { inventory: instanceToReturn } }, { upsert: true }).exec();
            }
            else if (listing.itemCategory === "material") {
                await this.userModel.findOneAndUpdate({ telegramId: listing.sellerId }, { $inc: { [`materials.${listing.baseItemId}`]: listing.amount || 1 } }).exec();
            }
            if (listing.collateralDeposit > 0 && !listing.collateralReturned) {
                await this.userModel.findOneAndUpdate({ telegramId: listing.sellerId }, { $inc: { "cryptoBalances.ELIXCOIN": listing.collateralDeposit } }).exec();
            }
            await this.auctionModel
                .updateOne({ _id: listing._id, status: "settling" }, { $set: { status: "cancelled", resolvedAt: new Date(), collateralReturned: true } })
                .exec();
            count++;
        }
        this.logger.log(`Expired ${count} old auction listings`);
        return count;
    }
    async reportStuckClaims() {
        const stuck = await this.auctionModel
            .find({ status: "settling", claimExpiresAt: { $lte: new Date() } })
            .lean();
        if (stuck.length === 0)
            return 0;
        for (const listing of stuck) {
            this.logger.error(`Auction ${String(listing._id)} stuck in "settling" since claim deadline ${listing.claimExpiresAt?.toISOString?.() ?? "unknown"} — manual reconciliation required`);
        }
        return stuck.length;
    }
    async browse(params) {
        const { search, buffType, rarity, sort = "newest", page = 1, limit = 50, } = params;
        const filter = { status: "active" };
        if (buffType && ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"].includes(buffType)) {
            filter.buffType = buffType;
        }
        if (rarity && ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"].includes(rarity)) {
            filter.rarity = rarity;
        }
        if (search) {
            const regex = { $regex: search, $options: "i" };
            const matchingBuffItems = await this.buffItemModel
                .find({ $or: [{ name: regex }, { buffId: regex }] })
                .lean();
            const matchingBaseIds = matchingBuffItems.map((b) => b.buffId);
            if (matchingBaseIds.length > 0) {
                filter.baseItemId = { $in: matchingBaseIds };
            }
            else {
                return { success: true, listings: [], total: 0, page, totalPages: 0 };
            }
        }
        let sortObj = { listedAt: -1 };
        switch (sort) {
            case "price_asc":
                sortObj = { floorPrice: 1 };
                break;
            case "price_desc":
                sortObj = { floorPrice: -1 };
                break;
            case "oldest":
                sortObj = { listedAt: 1 };
                break;
            default: sortObj = { listedAt: -1 };
        }
        const skip = (page - 1) * limit;
        const pipeline = [{ $match: filter }];
        pipeline.push({
            $group: {
                _id: "$baseItemId",
                floorPrice: { $min: "$price" },
                volume: { $sum: 1 },
                buffType: { $first: "$buffType" },
                rarity: { $first: "$rarity" },
                listedAt: { $max: "$listedAt" },
            },
        });
        pipeline.push({ $sort: sortObj });
        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        });
        const result = await this.auctionModel.aggregate(pipeline);
        const data = result[0]?.data || [];
        const total = result[0]?.metadata[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);
        const baseItemIds = data.map((d) => d._id);
        const buffItems = await this.buffItemModel
            .find({ buffId: { $in: baseItemIds } })
            .lean();
        const buffMap = new Map(buffItems.map((b) => [b.buffId, b]));
        const enriched = data.map((d) => {
            const buff = buffMap.get(d._id);
            return {
                baseItemId: d._id,
                buffType: d.buffType,
                rarity: d.rarity,
                floorPrice: d.floorPrice,
                volume: d.volume,
                name: buff?.name || d._id,
                description: buff?.description || "",
                icon: buff?.icon || "📦",
                buffValue: buff?.buffValue || 0,
                buffUnit: buff?.buffUnit || "flat",
            };
        });
        return {
            success: true,
            listings: enriched,
            total,
            page,
            totalPages,
        };
    }
    async browseItemListings(baseItemId) {
        const listings = await this.auctionModel
            .find({ baseItemId, status: "active" })
            .sort({ price: 1 })
            .lean();
        const buffItem = await this.buffItemModel.findOne({ buffId: baseItemId }).lean();
        const enriched = listings.map((l) => ({
            id: l._id.toString(),
            instanceId: l.instanceId,
            baseItemId: l.baseItemId,
            sellerId: l.sellerId,
            sellerName: l.sellerName,
            price: l.price,
            tax: l.tax,
            netAmount: l.netAmount,
            listedAt: l.listedAt,
            expiresAt: l.expiresAt,
        }));
        return {
            success: true,
            buffItem,
            listings: enriched,
        };
    }
    async myListings(telegramId) {
        const listings = await this.auctionModel
            .find({ sellerId: telegramId, status: { $in: ["active", "sold", "cancelled"] } })
            .sort({ listedAt: -1 })
            .limit(100)
            .lean();
        const baseItemIds = [...new Set(listings.map((l) => l.baseItemId))];
        const buffItems = await this.buffItemModel
            .find({ buffId: { $in: baseItemIds } })
            .lean();
        const buffMap = new Map(buffItems.map((b) => [b.buffId, b]));
        return {
            success: true,
            listings: listings.map((l) => {
                const buff = buffMap.get(l.baseItemId);
                return {
                    id: l._id.toString(),
                    instanceId: l.instanceId,
                    baseItemId: l.baseItemId,
                    buffType: l.buffType,
                    rarity: l.rarity,
                    price: l.price,
                    tax: l.tax,
                    netAmount: l.netAmount,
                    status: l.status,
                    sellerName: l.sellerName,
                    buyerId: l.buyerId || null,
                    listedAt: l.listedAt,
                    expiresAt: l.expiresAt,
                    resolvedAt: l.resolvedAt || null,
                    collateralDeposit: l.collateralDeposit,
                    collateralReturned: l.collateralReturned || false,
                    name: buff?.name || l.baseItemId,
                    description: buff?.description || "",
                    icon: buff?.icon || "📦",
                    buffValue: buff?.buffValue || 0,
                    buffUnit: buff?.buffUnit || "flat",
                };
            }),
        };
    }
    async getStats() {
        const totalActive = await this.auctionModel.countDocuments({ status: "active" });
        const totalSold = await this.auctionModel.countDocuments({ status: "sold" });
        const rarityAgg = await this.auctionModel.aggregate([
            { $match: { status: "sold" } },
            { $group: { _id: "$rarity", avgPrice: { $avg: "$price" }, count: { $sum: 1 } } },
        ]);
        const volumeAgg = await this.auctionModel.aggregate([
            { $match: { status: "sold" } },
            { $group: { _id: null, totalVolume: { $sum: "$price" }, totalTax: { $sum: "$tax" } } },
        ]);
        return {
            success: true,
            stats: {
                totalActive,
                totalSold,
                totalVolume: volumeAgg[0]?.totalVolume || 0,
                totalTaxCollected: volumeAgg[0]?.totalTax || 0,
                avgByRarity: rarityAgg.reduce((acc, r) => {
                    acc[r._id] = { avgPrice: Math.round(r.avgPrice * 100) / 100, count: r.count };
                    return acc;
                }, {}),
                minPriceTable: MIN_PRICE_TABLE,
                collateralDeposit: COLLATERAL_DEPOSIT,
                collateralPenaltyRate: COLLATERAL_PENALTY_RATE,
                listingDurationDays: 7,
            },
        };
    }
};
exports.AuctionHouseService = AuctionHouseService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuctionHouseService.prototype, "expireOldListings", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuctionHouseService.prototype, "reportStuckClaims", null);
exports.AuctionHouseService = AuctionHouseService = AuctionHouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(auction_schema_1.Auction.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(buff_item_schema_1.BuffItem.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_buff_collection_schema_1.UserBuffCollection.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService])
], AuctionHouseService);
//# sourceMappingURL=auction-house.service.js.map