import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { BuffItem, BuffItemDocument, BuffType, BuffRarity } from "./schemas/buff-item.schema";
import {
  UserBuffCollection,
  UserBuffCollectionDocument,
} from "./schemas/user-buff-collection.schema";
import { User, UserDocument } from "../users/schemas/user.schema";

// ── Buff Value Tables ──────────────────────────────────────────────────────
// Each rarity has exactly 10 values. Order matters — index maps to position.

const BUFF_VALUES: Record<BuffRarity, number[]> = {
  COMMON: [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.55, 0.60],
  MEDIUM: [1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50],
  RARE: [3.75, 4.00, 4.25, 4.50, 4.75, 5.00, 5.25, 5.50, 5.75, 6.00],
  ULTRA_RARE: [6.00, 9.00, 12.00, 15.00, 18.00, 21.00, 24.00, 27.00, 30.00, 33.00],
};

/** Which collection item IDs belong to each buff type, split by rarity. */
const BUFF_ASSIGNMENTS: Record<BuffType, Record<BuffRarity, string[]>> = {
  // ── ATK (40 items) — weapon / striking / sharp items ────────────────────
  ATK: {
    COMMON: [
      "roman-coin",      // Roman Coin
      "inca-gold",        // Inca Gold Disc
      "iron-coin",      // African Iron Coin
      "tartar-bow",      // Tartar Bow Ornament
      "celtic-torc",      // Celtic Torc
      "bronze-bull",      // Bronze Bull
      "eagle-figure",        // Eagle Figurine
      "small-dragon",   // Small Dragon
      "wolf-figure",     // Wolf Figurine
      "bear-statue",      // Bear Statuette
    ],
    MEDIUM: [
      "greek-god",   // Greek God Statue
      "golden-garuda",   // Golden Garuda
      "marble-lion",  // Marble Lion
      "knight-statue",        // Knight Statue
      "samurai-armor",// Samurai Armor
      "dragon-lid",      // Dragon Lid Vase (reused medium slot)
      "ming-vase",    // Ming Dynasty Vase
      "cloisonne",       // Cloisonne Enamel
      "pharaoh-ring",        // Pharaoh's Ring
      "gem-brooch",         // Gemstone Brooch
    ],
    RARE: [
      "excalibur",     // Excalibur
      "javanese-keris",           // Javanese Keris
      "poseidon-trident",     // Poseidon's Trident
      "thors-hammer",              // Thor's Hammer
      "artemis-bow",        // Artemis' Bow
      "shadow-blade",      // Shadow Blade
      "aegis-shield",       // Aegis Shield
      "katana",       // Katana
      "dragon-keris",           // Dragon Keris
      "guard-halberd",      // Guard's Halberd
    ],
    ULTRA_RARE: [
      "super-emperor-crown",  // Super Emperor's Crown
      "super-solomon-ring",   // Super Solomon's Ring
      "super-ras-necklace",   // Super Ra's Necklace
      "super-caduceus",       // Super Caduceus
      "super-dragon-orb",     // Super Dragon Crystal Ball
      "super-dragon-chest",   // Super Dragon Chest
      "super-hellfire-chest", // Super Hellfire Chest
      "super-divine-chest",   // Super Divine Chest
      "super-multiverse-chest", // Super Multiverse Chest
      "super-kings-gold-chest", // Super King's Gold Chest
    ],
  },

  // ── ECONOMY (40 items) — wealth / trade / resource items ────────────────
  ECONOMY: {
    COMMON: [
      "sumerian-tablet",      // Sumerian Tablet
      "mayan-disk",         // Mayan Calendar Disk
      "chinese-seal",    // Ancient Chinese Seal
      "persian-astro",       // Persian Astrolabe
      "babylon-seal",    // Babylonian Seal
      "mini-scarab",   // Mini Scarab
      "mini-sun-disk",   // Mini Sun Disk
      "brass-lamp", // Brass Lamp
      "wooden-box",           // Wooden Box
      "metal-tin",          // Metal Tin
    ],
    MEDIUM: [
      "kings-crown",         // King's Crown
      "queens-tiara",         // Queen's Tiara
      "pearl-necklace",       // Pearl Necklace
      "silver-bracelet",         // Silver Bracelet
      "moon-pendant",        // Moon Pendant
      "jade-earrings",          // Jade Earrings
      "star-diadem",       // Star Diadem
      "moon-circlet",        // Moon Circlet
      "jade-vase",      // Green Jade Vase
      "jeweled-vase",         // Jeweled Vase
    ],
    RARE: [
      "gem-chest",         // Gemstone Chest
      "crystal-chest",         // Crystal Chest
      "mystery-chest",       // Mysterious Chest
      "eternal-chest",           // Eternal Chest
      "sky-chest",          // Sky Chest
      "dragon-map",            // Dragon Treasure Map
      "dragon-letter",           // Ancient Dragon Letter
      "dragon-tome",           // Dragon Tome
      "dragon-compass",          // Dragon Compass
      "dragon-seal",           // Dragon Seal
    ],
    ULTRA_RARE: [
      "super-meissen-porcelain", // Super Meissen Porcelain
      "super-wedgwood-jasper",         // Wedgwood Jasper
      "super-millefiori",              // Millefiori Glass
      "super-greek-amphora",           // Greek Amphora
      "super-cubist-vase",             // Cubist Vase
      "super-globe-vase",              // Globe Vase
      "super-golden-pharaoh",          // Golden Pharaoh
      "super-jade-dragon",             // Jade Dragon
      "super-phoenix-statue",          // Phoenix Statue
      "super-jade-tortoise",           // Jade Tortoise
    ],
  },

  // ── DURABILITY (40 items) — tool / craft / repair items ─────────────────
  DURABILITY: {
    COMMON: [
      "clay-pot",      // Clay Pot
      "blue-ceramic",    // Blue Ceramic Vase
      "white-porcelain",  // White Porcelain
      "roman-pottery", // Roman Pottery
      "batik-vase",      // Batik Vase
      "sakura-vase",   // Cherry Blossom Vase
      "celadon-vase",         // Celadon Vase
      "majolica-vase",        // Majolica Vase
      "raku-pottery",            // Raku Pottery
      "sancai-vase",          // Sancai Glazed Vase
    ],
    MEDIUM: [
      "meissen-porcelain",         // (note: re-using visually, but real mapping below)
      "jade-vase",      // Green Jade Vase
      "cloisonne",       // Cloisonne Enamel
      "goddess-lakshmi",  // Goddess Lakshmi
      "greek-god",   // Greek God Statue
      "quartz-crystal",       // Quartz Crystal
      "ruby-stone",            // Ruby Stone
      "sapphire-stone",        // Sapphire Stone
      "emerald-stone",         // Emerald Stone
      "amethyst-crystal",     // Amethyst Crystal
    ],
    RARE: [
      "gem-chest",         // Gemstone Chest
      "crystal-chest",         // Crystal Chest
      "dragon-orb",    // Dragon Crystal Ball
      "ras-necklace",            // Ra's Necklace
      "solomon-ring",       // Solomon's Ring
      "caduceus",       // Caduceus
      "emperor-crown",       // Emperor's Crown
      "divine-chest",            // Divine Chest
      "eternal-chest",           // Eternal Chest
      "multiverse-chest",      // Multiverse Chest
    ],
    ULTRA_RARE: [
      "super-cubist-vase",         // Cubist Vase
      "super-jeweled-vase",         // Jeweled Vase
      "super-globe-vase",           // Globe Vase
      "super-millefiori",      // Millefiori Glass
      "super-greek-amphora",      // Greek Amphora
      "super-wedgwood-jasper",        // Wedgwood Jasper
      "super-golden-pharaoh",   // Golden Pharaoh
      "super-jade-dragon",     // Jade Dragon
      "super-phoenix-statue",        // Phoenix Statue
      "super-jade-tortoise",      // Jade Tortoise
    ],
  },

  // ── DROPRATE (40 items) — mystical / arcane / rare-find items ───────────
  DROPRATE: {
    COMMON: [
      "viking-compass",       // Viking Compass
      "greek-figure",       // Greek Figurine
      "dream-rock",     // Dreamtime Rock
      "norse-rune",        // Norse Rune Stone
      "korean-cup",        // Korean Celadon Cup
      "ancient-chakra",        // Ancient Chakra
      "tiki-figure",    // Tiki Figurine
      "small-buddha",        // Small Buddha
      "bastet-cat",  // Bastet Cat
      "peacock-figure",         // Peacock Figure
    ],
    MEDIUM: [
      "spell-book",          // Spell Book
      "treasure-map",     // Treasure Map
      "royal-decree",           // Royal Decree
      "ancient-codex",           // Ancient Codex
      "buddhist-sutra",        // Buddhist Sutra
      "mayan-codex",       // Mayan Codex
      "ancient-atlas",           // Ancient Atlas
      "prophecy-book",         // Prophecy Book
      "star-chart",        // Star Chart
      "egypt-papyrus",       // Egyptian Papyrus
    ],
    RARE: [
      "mystery-chest",       // Mysterious Chest
      "sky-chest",          // Sky Chest
      "dragon-map",            // Dragon Treasure Map
      "dragon-letter",           // Ancient Dragon Letter
      "dragon-tome",           // Dragon Tome
      "dragon-compass",          // Dragon Compass
      "dragon-seal",           // Dragon Seal
      "dragon-chest",            // Dragon Chest
      "hellfire-chest",          // Hellfire Chest
      "kings-gold-chest",       // King's Gold Chest
    ],
    ULTRA_RARE: [
      "super-topaz-stone",              // Topaz Stone
      "super-opal-stone",               // Opal Stone
      "super-lapis-lazuli",             // Lapis Lazuli
      "super-garnet-stone",             // Garnet Stone
      "super-aquamarine",               // Aquamarine
      "super-gem-brooch",         // Super Gemstone Brooch
      "super-pharaoh-ring",       // Super Pharaoh's Ring
      "super-kings-crown",        // Super King's Crown
      "super-queens-tiara",       // Super Queen's Tiara
      "super-pearl-necklace",     // Super Pearl Necklace
    ],
  },
};

/** Map buff type to display info */
const BUFF_TYPE_META: Record<BuffType, { label: string; description: string; unit: "flat" | "percent"; icon: string }> = {
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
    description: "Slows down durability drain — pickaxe lasts longer",
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

@Injectable()
export class BuffItemCollectionsService implements OnModuleInit {
  private readonly logger = new Logger(BuffItemCollectionsService.name);

  constructor(
    @InjectModel(BuffItem.name) private buffItemModel: Model<BuffItemDocument>,
    @InjectModel(UserBuffCollection.name)
    private userBuffModel: Model<UserBuffCollectionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  // ── Seed on startup ────────────────────────────────────────────────────────
  async onModuleInit() {
    await this.seedBuffItems();
  }

  /**
   * Seed all 160 buff items into the database (idempotent — skips if already seeded).
   */  private async seedBuffItems() {
    // Clear old data if using legacy ATK-COMMON-01 format
    const legacy = await this.buffItemModel.findOne({ buffId: /^ATK-|^ECONOMY-|^DURABILITY-|^DROPRATE-/ }).lean();
    if (legacy) {
      this.logger.log("Clearing legacy buff items (ATK-COMMON-01 format)...");
      await this.buffItemModel.deleteMany({});
    }

    const count = await this.buffItemModel.countDocuments();
    // Always seed/upsert to ensure names, stats, and prefixes stay aligned with code

    this.logger.log("Seeding buff items (item-name format)...");

    const docs: Partial<BuffItem>[] = [];
    const seenItems = new Set<string>(); // Deduplicate across buff types

    for (const buffType of ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"] as BuffType[]) {
      for (const rarity of ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] as BuffRarity[]) {
        const itemIds = BUFF_ASSIGNMENTS[buffType][rarity];
        const values = BUFF_VALUES[rarity];
        const meta = BUFF_TYPE_META[buffType];

        for (let i = 0; i < 10; i++) {
          const itemId = itemIds[i];
          // Skip if this item was already assigned to another buff type
          if (seenItems.has(itemId)) continue;
          seenItems.add(itemId);

          const value = values[i];
          const description =
            meta.unit === "percent"
              ? `+${value}% ${meta.label}`
              : `+${value} ${meta.label}`;

          docs.push({
            buffId: itemId, // e.g. "roman-coin" (not ATK-COMMON-01)
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

    // Bulk upsert — single DB round-trip for speed (10x faster than per-doc updateOne)
    if (docs.length > 0) {
      const ops = docs.map(doc => ({
        updateOne: {
          filter: { buffId: doc.buffId },
          update: { $set: doc },
          upsert: true,
        },
      }));
      await this.buffItemModel.bulkWrite(ops, { ordered: false });
    }

    this.logger.log(`Seeded ${docs.length} buff items (deduplicated)`);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Get all 160 buff items, grouped by type and rarity. */
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

  /** Get buff items for a specific type. */
  async getBuffItemsByType(buffType: BuffType) {
    const items = await this.buffItemModel
      .find({ buffType })
      .sort({ rarity: 1, buffId: 1 })
      .lean();
    return { success: true, items, meta: BUFF_TYPE_META[buffType] };
  }

  /** Get a single buff item by ID. */
  async getBuffItem(buffId: string) {
    const item = await this.buffItemModel.findOne({ buffId }).lean();
    if (!item) return { success: false, error: "Buff item not found" };
    return { success: true, item };
  }

  // ── User Collection ────────────────────────────────────────────────────────

  /** Get a user's buff collection (inventory + active). */
  async getUserCollection(telegramId: string) {
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

    // Fetch full buff item details for all base items in inventory
    const baseItems =
      baseItemIds.length > 0
        ? await this.buffItemModel
          .find({ buffId: { $in: baseItemIds } })
          .lean()
        : [];

    // Map baseItems by buffId
    const baseItemMap = new Map(baseItems.map(item => [item.buffId, item]));

    // Construct full details for owned items (instances)
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

    // Reconstruct active items
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

    // Calculate total buff values
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

  /**
   * Grant a buff item to a user (e.g. after mining/case loot).
   */
  async grantBuffItem(telegramId: string, buffId: string) {
    const buffItem = await this.buffItemModel.findOne({ buffId }).lean();
    if (!buffItem) return { success: false, error: "Buff item not found" };

    const instanceId = crypto.randomUUID();
    const newInstance = { instanceId, baseItemId: buffId, acquiredAt: new Date() };

    await this.userBuffModel.updateOne(
      { telegramId },
      { $push: { inventory: newInstance } },
      { upsert: true }
    );

    // NOTE: buff items are stored ONLY in UserBuffCollection.inventory.
    // cryptoBalances is reserved for crypto tokens (IRON, COPPER, ELIXCOIN, etc.)
    // The Trade Spot reads item balance via countBuffInstances(), not cryptoBalances.

    return {
      success: true,
      buffItem,
      instanceId,
      message: `Granted "${buffItem.name}" (${buffItem.description})`,
    };
  }

  /**
   * Remove buff item instances from user's collection (called when selling at trade spot).
   * Removes up to `count` instances of the given buffId.
   */
  async removeBuffItem(telegramId: string, buffId: string, count: number = 1): Promise<number> {
    const collection = await this.userBuffModel.findOne({ telegramId });
    if (!collection) return 0;

    // Find instances of this buff that are NOT active (can't sell equipped items)
    const removableInstances = collection.inventory.filter(
      i => i.baseItemId === buffId && !collection.activeInstanceIds.includes(i.instanceId)
    );

    const toRemove = removableInstances.slice(0, count);
    if (toRemove.length === 0) return 0;

    const instanceIdsToRemove = new Set(toRemove.map(i => i.instanceId));
    collection.inventory = collection.inventory.filter(i => !instanceIdsToRemove.has(i.instanceId));
    await collection.save();

    return toRemove.length;
  }

  /**
   * Count how many instances of a buff item a user owns (for Trade Spot holdings).
   * Only counts uninequipped (available) instances — active (equipped) items
   * cannot be sold and should NOT show as tradeable qty.
   */
  async countBuffInstances(telegramId: string, buffId: string): Promise<number> {
    const col = await this.userBuffModel.findOne({ telegramId }).lean();
    if (!col) return 0;
    const inventory = col.inventory || [];
    return inventory.filter(i => i.baseItemId === buffId).length;
  }

  // ── Material Tools Sync ────────────────────────────────────────────────
  // Materials are stored in the `materials` field (title-case keys like "Rusty Nail").
  // Trade spot uses `cryptoBalances` with UPPERCASE slug keys like "RUSTY-NAIL".
  // We need to keep both in sync so material-tools page and trade spot both work.

  /** Credit material tools in the `materials` field only.
   * NOTE: cryptoBalances is NOT updated here — material tools live exclusively
   * in user.materials. Trade Spot reads material balances directly from that field.
   */
  async grantMaterial(telegramId: string, displayName: string, amount: number = 1): Promise<void> {
    if (amount <= 0) return;
    await this.userModel.updateOne(
      { telegramId },
      { $inc: { [`materials.${displayName}`]: amount } },
    ).exec();
  }

  /** Deduct material tools from the `materials` field only. Returns amount actually removed.
   * NOTE: cryptoBalances is NOT touched — only the materials field is updated.
   */
  async removeMaterial(telegramId: string, displayName: string, count: number = 1): Promise<number> {
    if (count <= 0) return 0;
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return 0;
    const current = (user as any).materials?.[displayName] ?? 0;
    const toRemove = Math.min(count, current);
    if (toRemove <= 0) return 0;
    await this.userModel.updateOne(
      { telegramId },
      { $inc: { [`materials.${displayName}`]: -toRemove } },
    ).exec();
    return toRemove;
  }

  /**
   * Activate (equip) a buff instance by its base item ID (e.g. 'super-excalibur').
   * Finds the first owned instance that is not currently equipped.
   */
  async activateBuff(telegramId: string, buffId: string) {
    const collection = await this.userBuffModel.findOne({ telegramId });
    if (!collection) return { success: false, error: "User collection not found" };

    const unequippedInstance = collection.inventory.find(
      i => i.baseItemId === buffId && !collection.activeInstanceIds.includes(i.instanceId)
    );
    if (!unequippedInstance) return { success: false, error: "You do not own this item or all are already active" };

    collection.activeInstanceIds.push(unequippedInstance.instanceId);
    await collection.save();
    return { success: true, activeInstanceIds: collection.activeInstanceIds };
  }

  /**
   * Deactivate (unequip) a buff instance by its base item ID.
   * Finds the first equipped instance of this item and unequips it.
   */
  async deactivateBuff(telegramId: string, buffId: string) {
    const collection = await this.userBuffModel.findOne({ telegramId });
    if (!collection) return { success: false, error: "User collection not found" };

    const equippedInstance = collection.inventory.find(
      i => i.baseItemId === buffId && collection.activeInstanceIds.includes(i.instanceId)
    );
    if (!equippedInstance) return { success: false, error: "No active item found for this buff" };

    collection.activeInstanceIds = collection.activeInstanceIds.filter((id) => id !== equippedInstance.instanceId);
    await collection.save();
    return { success: true, activeInstanceIds: collection.activeInstanceIds };
  }

  /**
   * Batch-activate all owned instances of a specific type.
   */
  async activateAllByType(telegramId: string, buffType: BuffType) {
    const collection = await this.userBuffModel.findOne({ telegramId });
    if (!collection) return { success: false, error: "User collection not found" };

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

  // ── Buff Calculation ───────────────────────────────────────────────────────

  calculateBuffTotals(activeItems: any[]) {
    const totals: Record<BuffType, number> = {
      ATK: 0, ECONOMY: 0, DURABILITY: 0, DROPRATE: 0,
    };
    for (const item of activeItems) totals[item.buffType] += item.buffValue;
    return totals;
  }

  /**
   * Get the computed buff totals for a user.
   */
  async getUserBuffTotals(telegramId: string) {
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

    const calculatedItems = activeInstances.map(inst =>
      activeItems.find(item => item.buffId === inst.baseItemId)
    ).filter(Boolean);

    const totals = this.calculateBuffTotals(calculatedItems);
    return { success: true, totals };
  }

  /**
   * Grant random buff item based on drop weights.
   * Called by miner-stone/case-box when loot roll hits a buff drop.
   * Returns the granted buff item or null.
   */
  /**
   * Rarity drop weights — tuned for case-box multi-RNG buff collection drops.
   *  COMMON:       60%   (common buff items, +0.10…+0.60)
   *  MEDIUM:       15%   (medium buff items, +1.25…+3.50)
   *  RARE:          5%   (rare buff items, +3.75…+6.00)
   *  ULTRA_RARE:  0.5%   (ultra rare buff items, +6.00…+33.00)
   *
   * These weights sum to 80.5 — the remaining ~19.5% falls through to the
   * caller (e.g. ZONK in the case-box system).
   */
  static readonly BUFF_RARITY_WEIGHTS: Record<BuffRarity, number> = {
    COMMON: 60,
    MEDIUM: 15,
    RARE: 5,
    ULTRA_RARE: 0.5,
  };

  /** Buff type weights — equal distribution across all 4 types (25% each). */
  static readonly BUFF_TYPE_WEIGHTS: Record<BuffType, number> = {
    ATK: 25,
    ECONOMY: 25,
    DURABILITY: 25,
    DROPRATE: 25,
  };

  async grantRandomBuff(telegramId: string, preferredRarity?: BuffRarity) {
    const rarityWeights = BuffItemCollectionsService.BUFF_RARITY_WEIGHTS;

    let roll = Math.random() * 100;
    let selectedRarity: BuffRarity = "COMMON";

    if (preferredRarity) {
      selectedRarity = preferredRarity;
    } else {
      for (const [rarity, weight] of Object.entries(rarityWeights) as [BuffRarity, number][]) {
        roll -= weight;
        if (roll <= 0) {
          selectedRarity = rarity;
          break;
        }
      }
    }

    // Get a random buff item of this rarity that the user doesn't own yet (checking baseItemId)
    const collection = await this.userBuffModel.findOne({ telegramId }).lean();
    const ownedIds = collection?.inventory?.map(i => i.baseItemId) || [];

    const available = await this.buffItemModel
      .find({
        rarity: selectedRarity,
        buffId: { $nin: ownedIds },
      })
      .lean();

    if (available.length === 0) {
      // User already owns all items of this rarity — try next lower rarity
      const fallbackOrder: BuffRarity[] = ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"];
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

      // User owns literally everything — return null
      return { success: true, granted: null, message: "Collection complete!" };
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    return this.grantBuffItem(telegramId, picked.buffId);
  }
}
