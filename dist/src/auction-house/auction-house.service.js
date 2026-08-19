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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionHouseService = exports.LISTING_DURATION_MS = exports.COLLATERAL_DEPOSIT = exports.MIN_PRICE_TABLE = void 0;
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
    async createListing(telegramId, buffId, price) {
        if (!price || price <= 0 || !isFinite(price)) {
            return { success: false, error: "Invalid price" };
        }
        const buffItem = await this.buffItemModel.findOne({ buffId }).lean();
        if (!buffItem) {
            return { success: false, error: "Buff item not found" };
        }
        const minPrice = MIN_PRICE_TABLE[buffItem.buffType][buffItem.rarity];
        if (price < minPrice) {
            return {
                success: false,
                error: `Minimum listing price for ${buffItem.rarity} ${buffItem.buffType} is ${minPrice.toLocaleString()} ELIXCOIN`,
            };
        }
        const collection = await this.userBuffModel.findOne({ telegramId });
        if (!collection) {
            return { success: false, error: "No buff collection found" };
        }
        const ownedIndex = collection.ownedBuffIds.indexOf(buffId);
        if (ownedIndex === -1) {
            return { success: false, error: "You do not own this item" };
        }
        const existingListing = await this.auctionModel.findOne({
            sellerId: telegramId,
            buffId,
            status: "active",
        });
        if (existingListing) {
            return { success: false, error: "This item is already listed for sale" };
        }
        const user = await this.userModel.findOne({ telegramId });
        if (!user) {
            return { success: false, error: "User not found" };
        }
        const balance = user.cryptoBalances?.["ELIXCOIN"] || 0;
        if (balance < COLLATERAL_DEPOSIT) {
            return {
                success: false,
                error: `Insufficient ELIXCOIN for collateral deposit. You need ${COLLATERAL_DEPOSIT.toLocaleString()} ELIXCOIN but have ${balance.toFixed(2)}`,
            };
        }
        const tax = Math.round(price * PLATFORM_TAX_RATE * 100) / 100;
        const netAmount = Math.round((price - tax) * 100) / 100;
        const sellerName = user.firstName || user.username || "Unknown";
        const depositResult = await this.userModel.findOneAndUpdate({
            telegramId,
            "cryptoBalances.ELIXCOIN": { $gte: COLLATERAL_DEPOSIT },
        }, {
            $inc: { "cryptoBalances.ELIXCOIN": -COLLATERAL_DEPOSIT },
        }, { returnDocument: "after" }).exec();
        if (!depositResult) {
            return { success: false, error: "Insufficient ELIXCOIN for collateral deposit" };
        }
        collection.ownedBuffIds.splice(ownedIndex, 1);
        collection.activeBuffIds = collection.activeBuffIds.filter((id) => id !== buffId);
        await collection.save();
        const now = Date.now();
        const auction = await this.auctionModel.create({
            sellerId: telegramId,
            sellerName,
            buffId,
            buffType: buffItem.buffType,
            rarity: buffItem.rarity,
            price,
            tax,
            netAmount,
            status: "active",
            listedAt: new Date(),
            expiresAt: new Date(now + LISTING_DURATION_MS),
            collateralDeposit: COLLATERAL_DEPOSIT,
            collateralReturned: false,
        });
        return {
            success: true,
            collateralDeposit: COLLATERAL_DEPOSIT,
            listingDurationDays: 7,
            auction: {
                id: auction._id.toString(),
                buffId,
                buffType: buffItem.buffType,
                rarity: buffItem.rarity,
                price,
                tax,
                netAmount,
                sellerName,
                listedAt: auction.listedAt,
                expiresAt: auction.expiresAt,
                collateralDeposit: COLLATERAL_DEPOSIT,
            },
        };
    }
    async buyListing(telegramId, auctionId) {
        const listing = await this.auctionModel.findOne({
            _id: auctionId,
            status: "active",
        });
        if (!listing) {
            return { success: false, error: "Listing not found or already sold" };
        }
        if (listing.expiresAt && new Date() > listing.expiresAt) {
            return { success: false, error: "This listing has expired" };
        }
        if (listing.sellerId === telegramId) {
            return { success: false, error: "Cannot buy your own listing" };
        }
        const buyer = await this.userModel.findOne({ telegramId });
        if (!buyer) {
            return { success: false, error: "User not found" };
        }
        const buyerBalance = buyer.cryptoBalances?.["ELIXCOIN"] || 0;
        if (buyerBalance < listing.price) {
            return {
                success: false,
                error: `Insufficient ELIXCOIN. You need ${listing.price.toLocaleString()} but have ${buyerBalance.toFixed(2)}`,
            };
        }
        const buyerUpdate = await this.userModel.findOneAndUpdate({
            telegramId,
            "cryptoBalances.ELIXCOIN": { $gte: listing.price },
        }, {
            $inc: { "cryptoBalances.ELIXCOIN": -listing.price },
        }, { returnDocument: "after" }).exec();
        if (!buyerUpdate) {
            return { success: false, error: "Insufficient ELIXCOIN balance" };
        }
        const sellerPayout = listing.netAmount + listing.collateralDeposit;
        await this.userModel.findOneAndUpdate({ telegramId: listing.sellerId }, { $inc: { "cryptoBalances.ELIXCOIN": sellerPayout } }).exec();
        await this.userBuffModel.findOneAndUpdate({ telegramId }, { $addToSet: { ownedBuffIds: listing.buffId } }, { upsert: true }).exec();
        listing.status = "sold";
        listing.buyerId = telegramId;
        listing.resolvedAt = new Date();
        listing.collateralReturned = true;
        await listing.save();
        return {
            success: true,
            purchased: {
                buffId: listing.buffId,
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
        if (!listing) {
            return { success: false, error: "Listing not found or not yours" };
        }
        await this.userBuffModel.findOneAndUpdate({ telegramId }, { $addToSet: { ownedBuffIds: listing.buffId } }, { upsert: true }).exec();
        const returnedDeposit = Math.round(listing.collateralDeposit * COLLATERAL_PENALTY_RATE);
        const penalty = listing.collateralDeposit - returnedDeposit;
        if (returnedDeposit > 0) {
            await this.userModel.findOneAndUpdate({ telegramId }, { $inc: { "cryptoBalances.ELIXCOIN": returnedDeposit } }).exec();
        }
        listing.status = "cancelled";
        listing.resolvedAt = new Date();
        listing.collateralReturned = true;
        await listing.save();
        return {
            success: true,
            buffId: listing.buffId,
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
            await this.userBuffModel.findOneAndUpdate({ telegramId: listing.sellerId }, { $addToSet: { ownedBuffIds: listing.buffId } }, { upsert: true }).exec();
            if (listing.collateralDeposit > 0 && !listing.collateralReturned) {
                await this.userModel.findOneAndUpdate({ telegramId: listing.sellerId }, { $inc: { "cryptoBalances.ELIXCOIN": listing.collateralDeposit } }).exec();
            }
            listing.status = "cancelled";
            listing.resolvedAt = new Date();
            listing.collateralReturned = true;
            await listing.save();
            count++;
        }
        this.logger.log(`Expired ${count} old auction listings`);
        return count;
    }
    async browse(params) {
        await this.expireOldListings();
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
            const matchingBuffIds = matchingBuffItems.map((b) => b.buffId);
            if (matchingBuffIds.length > 0) {
                filter.buffId = { $in: matchingBuffIds };
            }
            else {
                return { success: true, listings: [], total: 0, page, totalPages: 0 };
            }
        }
        let sortObj = { listedAt: -1 };
        switch (sort) {
            case "price_asc":
                sortObj = { price: 1 };
                break;
            case "price_desc":
                sortObj = { price: -1 };
                break;
            case "oldest":
                sortObj = { listedAt: 1 };
                break;
            default: sortObj = { listedAt: -1 };
        }
        const total = await this.auctionModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;
        const listings = await this.auctionModel
            .find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean();
        const buffIds = [...new Set(listings.map((l) => l.buffId))];
        const buffItems = await this.buffItemModel
            .find({ buffId: { $in: buffIds } })
            .lean();
        const buffMap = new Map(buffItems.map((b) => [b.buffId, b]));
        const enriched = listings.map((l) => {
            const buff = buffMap.get(l.buffId);
            return {
                id: l._id.toString(),
                buffId: l.buffId,
                buffType: l.buffType,
                rarity: l.rarity,
                price: l.price,
                tax: l.tax,
                netAmount: l.netAmount,
                sellerId: l.sellerId,
                sellerName: l.sellerName,
                listedAt: l.listedAt,
                expiresAt: l.expiresAt,
                collateralDeposit: l.collateralDeposit,
                name: buff?.name || l.buffId,
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
    async myListings(telegramId) {
        await this.expireOldListings();
        const listings = await this.auctionModel
            .find({ sellerId: telegramId, status: { $in: ["active", "sold", "cancelled"] } })
            .sort({ listedAt: -1 })
            .limit(100)
            .lean();
        const buffIds = [...new Set(listings.map((l) => l.buffId))];
        const buffItems = await this.buffItemModel
            .find({ buffId: { $in: buffIds } })
            .lean();
        const buffMap = new Map(buffItems.map((b) => [b.buffId, b]));
        return {
            success: true,
            listings: listings.map((l) => {
                const buff = buffMap.get(l.buffId);
                return {
                    id: l._id.toString(),
                    buffId: l.buffId,
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
                    name: buff?.name || l.buffId,
                    description: buff?.description || "",
                    icon: buff?.icon || "📦",
                    buffValue: buff?.buffValue || 0,
                    buffUnit: buff?.buffUnit || "flat",
                };
            }),
        };
    }
    async getStats() {
        await this.expireOldListings();
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
exports.AuctionHouseService = AuctionHouseService = AuctionHouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(auction_schema_1.Auction.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(buff_item_schema_1.BuffItem.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_buff_collection_schema_1.UserBuffCollection.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object, typeof (_c = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _c : Object, typeof (_d = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _d : Object, users_service_1.UsersService])
], AuctionHouseService);
//# sourceMappingURL=auction-house.service.js.map