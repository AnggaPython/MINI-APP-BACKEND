import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Auction, AuctionDocument } from "./schemas/auction.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import {
  BuffItem,
  BuffItemDocument,
  BuffType,
  BuffRarity,
} from "../buff-item-collections/schemas/buff-item.schema";
import {
  UserBuffCollection,
  UserBuffCollectionDocument,
} from "../buff-item-collections/schemas/user-buff-collection.schema";

// ── Platform tax rate (19%) ────────────────────────────────────────────────
const PLATFORM_TAX_RATE = 0.19;

// ── Collateral deposit — anti-spam listing fee ─────────────────────────────
// Every listing requires a 10,000 ELIXCOIN deposit held in escrow.
// • Sold normally  → deposit returned (100%) to seller alongside sale proceeds.
// • Listing expires → deposit returned (100%) to seller.
// • Seller cancels → 50% penalty → only 5,000 ELIXCOIN returned.
const COLLATERAL_DEPOSIT = 10_000;
const COLLATERAL_PENALTY_RATE = 0.5; // 50% penalty on cancel
const LISTING_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Minimum listing prices by rarity (ELIXCOIN) ───────────────────────────
// Applied uniformly across all buff types per rarity tier.
const MIN_PRICE_TABLE: Record<BuffType, Record<BuffRarity, number>> = {
  ATK:        { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
  ECONOMY:    { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
  DURABILITY: { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
  DROPRATE:   { COMMON: 1_000, MEDIUM: 10_000, RARE: 25_000, ULTRA_RARE: 50_000 },
};

export { MIN_PRICE_TABLE, COLLATERAL_DEPOSIT, LISTING_DURATION_MS };

@Injectable()
export class AuctionHouseService {
  private readonly logger = new Logger(AuctionHouseService.name);

  constructor(
    @InjectModel(Auction.name)
    private auctionModel: Model<AuctionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(BuffItem.name)
    private buffItemModel: Model<BuffItemDocument>,
    @InjectModel(UserBuffCollection.name)
    private userBuffModel: Model<UserBuffCollectionDocument>,
    private readonly usersService: UsersService,
  ) {}

  // ── CREATE LISTING ──────────────────────────────────────────────────────

  /**
   * List a buff item for sale on the marketplace.
   * Requires a 10,000 ELIXCOIN collateral deposit (deducted atomically).
   * Item is removed from seller's collection and locked in escrow for 7 days.
   */
  async createListing(
    telegramId: string,
    buffId: string,
    price: number,
  ) {
    // Validate price
    if (!price || price <= 0 || !isFinite(price)) {
      return { success: false, error: "Invalid price" };
    }

    // Find the buff item
    const buffItem = await this.buffItemModel.findOne({ buffId }).lean();
    if (!buffItem) {
      return { success: false, error: "Buff item not found" };
    }

    // Check minimum price
    const minPrice = MIN_PRICE_TABLE[buffItem.buffType][buffItem.rarity];
    if (price < minPrice) {
      return {
        success: false,
        error: `Minimum listing price for ${buffItem.rarity} ${buffItem.buffType} is ${minPrice.toLocaleString()} ELIXCOIN`,
      };
    }

    // Check if user owns the buff
    const collection = await this.userBuffModel.findOne({ telegramId });
    if (!collection) {
      return { success: false, error: "No buff collection found" };
    }

    const ownedIndex = collection.ownedBuffIds.indexOf(buffId);
    if (ownedIndex === -1) {
      return { success: false, error: "You do not own this item" };
    }

    // Check if item is already listed
    const existingListing = await this.auctionModel.findOne({
      sellerId: telegramId,
      buffId,
      status: "active",
    });
    if (existingListing) {
      return { success: false, error: "This item is already listed for sale" };
    }

    // Check ELIXCOIN balance for collateral deposit
    const user = await this.userModel.findOne({ telegramId });
    if (!user) {
      return { success: false, error: "User not found" };
    }
    const balance = (user.cryptoBalances as Record<string, number>)?.["ELIXCOIN"] || 0;
    if (balance < COLLATERAL_DEPOSIT) {
      return {
        success: false,
        error: `Insufficient ELIXCOIN for collateral deposit. You need ${COLLATERAL_DEPOSIT.toLocaleString()} ELIXCOIN but have ${balance.toFixed(2)}`,
      };
    }

    // Calculate tax
    const tax = Math.round(price * PLATFORM_TAX_RATE * 100) / 100;
    const netAmount = Math.round((price - tax) * 100) / 100;

    const sellerName = user.firstName || user.username || "Unknown";

    // ATOMIC: Deduct collateral deposit + remove item from collection
    const depositResult = await this.userModel.findOneAndUpdate(
      {
        telegramId,
        "cryptoBalances.ELIXCOIN": { $gte: COLLATERAL_DEPOSIT },
      },
      {
        $inc: { "cryptoBalances.ELIXCOIN": -COLLATERAL_DEPOSIT },
      },
      { returnDocument: "after" },
    ).exec();

    if (!depositResult) {
      return { success: false, error: "Insufficient ELIXCOIN for collateral deposit" };
    }

    // Remove from owned + active buffs
    collection.ownedBuffIds.splice(ownedIndex, 1);
    collection.activeBuffIds = collection.activeBuffIds.filter((id) => id !== buffId);
    await collection.save();

    // Create listing with 7-day expiry
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

  // ── BUY LISTING ─────────────────────────────────────────────────────────

  /**
   * Buy a listed buff item. Transfers ELIXCOIN from buyer to seller (minus tax).
   * Returns the collateral deposit to the seller (100%).
   * Grants the buff item to the buyer.
   */
  async buyListing(telegramId: string, auctionId: string) {
    // Find the listing
    const listing = await this.auctionModel.findOne({
      _id: auctionId,
      status: "active",
    });
    if (!listing) {
      return { success: false, error: "Listing not found or already sold" };
    }

    // Check if listing has expired
    if (listing.expiresAt && new Date() > listing.expiresAt) {
      return { success: false, error: "This listing has expired" };
    }

    // Cannot buy your own listing
    if (listing.sellerId === telegramId) {
      return { success: false, error: "Cannot buy your own listing" };
    }

    // Check buyer's ELIXCOIN balance
    const buyer = await this.userModel.findOne({ telegramId });
    if (!buyer) {
      return { success: false, error: "User not found" };
    }

    const buyerBalance = (buyer.cryptoBalances as Record<string, number>)?.["ELIXCOIN"] || 0;
    if (buyerBalance < listing.price) {
      return {
        success: false,
        error: `Insufficient ELIXCOIN. You need ${listing.price.toLocaleString()} but have ${buyerBalance.toFixed(2)}`,
      };
    }

    // Step 1: Deduct price from buyer
    const buyerUpdate = await this.userModel.findOneAndUpdate(
      {
        telegramId,
        "cryptoBalances.ELIXCOIN": { $gte: listing.price },
      },
      {
        $inc: { "cryptoBalances.ELIXCOIN": -listing.price },
      },
      { returnDocument: "after" },
    ).exec();

    if (!buyerUpdate) {
      return { success: false, error: "Insufficient ELIXCOIN balance" };
    }

    // Step 2: Credit seller (net amount after tax) + return collateral (100%)
    const sellerPayout = listing.netAmount + listing.collateralDeposit;
    await this.userModel.findOneAndUpdate(
      { telegramId: listing.sellerId },
      { $inc: { "cryptoBalances.ELIXCOIN": sellerPayout } },
    ).exec();

    // Step 3: Grant buff item to buyer
    await this.userBuffModel.findOneAndUpdate(
      { telegramId },
      { $addToSet: { ownedBuffIds: listing.buffId } },
      { upsert: true },
    ).exec();

    // Step 4: Mark listing as sold
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

  // ── CANCEL LISTING ──────────────────────────────────────────────────────

  /**
   * Cancel a listing and return the item to the seller's collection.
   * Collateral: 50% penalty → only 5,000 ELIXCOIN returned.
   */
  async cancelListing(telegramId: string, auctionId: string) {
    const listing = await this.auctionModel.findOne({
      _id: auctionId,
      sellerId: telegramId,
      status: "active",
    });
    if (!listing) {
      return { success: false, error: "Listing not found or not yours" };
    }

    // Return item to seller's collection
    await this.userBuffModel.findOneAndUpdate(
      { telegramId },
      { $addToSet: { ownedBuffIds: listing.buffId } },
      { upsert: true },
    ).exec();

    // Collateral penalty: return 50% (5,000 ELIXCOIN)
    const returnedDeposit = Math.round(
      listing.collateralDeposit * COLLATERAL_PENALTY_RATE,
    );
    const penalty = listing.collateralDeposit - returnedDeposit;

    if (returnedDeposit > 0) {
      await this.userModel.findOneAndUpdate(
        { telegramId },
        { $inc: { "cryptoBalances.ELIXCOIN": returnedDeposit } },
      ).exec();
    }

    // Mark as cancelled
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

  // ── EXPIRE LISTINGS ─────────────────────────────────────────────────────

  /**
   * Auto-expire old listings. Returns collateral (100%) to seller.
   * Called periodically or on browse.
   */
  async expireOldListings() {
    const expired = await this.auctionModel.find({
      status: "active",
      expiresAt: { $lte: new Date() },
    });

    if (expired.length === 0) return 0;

    let count = 0;
    for (const listing of expired) {
      // Return item to seller
      await this.userBuffModel.findOneAndUpdate(
        { telegramId: listing.sellerId },
        { $addToSet: { ownedBuffIds: listing.buffId } },
        { upsert: true },
      ).exec();

      // Return 100% collateral
      if (listing.collateralDeposit > 0 && !listing.collateralReturned) {
        await this.userModel.findOneAndUpdate(
          { telegramId: listing.sellerId },
          { $inc: { "cryptoBalances.ELIXCOIN": listing.collateralDeposit } },
        ).exec();
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

  // ── SEARCH / BROWSE ─────────────────────────────────────────────────────

  /**
   * Browse marketplace listings with filters, search, and sorting.
   */
  async browse(params: {
    search?: string;
    buffType?: string;
    rarity?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    // Auto-expire old listings before browsing
    await this.expireOldListings();

    const {
      search,
      buffType,
      rarity,
      sort = "newest",
      page = 1,
      limit = 50,
    } = params;

    const filter: any = { status: "active" };

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
      } else {
        return { success: true, listings: [], total: 0, page, totalPages: 0 };
      }
    }

    let sortObj: any = { listedAt: -1 };
    switch (sort) {
      case "price_asc":  sortObj = { price: 1 }; break;
      case "price_desc": sortObj = { price: -1 }; break;
      case "oldest":     sortObj = { listedAt: 1 }; break;
      default:           sortObj = { listedAt: -1 };
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

  // ── MY LISTINGS ─────────────────────────────────────────────────────────

  async myListings(telegramId: string) {
    // Auto-expire first
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

  // ── MARKET STATS ────────────────────────────────────────────────────────

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
        avgByRarity: rarityAgg.reduce((acc: any, r: any) => {
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
}
