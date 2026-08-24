import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { BuffItem, BuffItemDocument, BuffType, BuffRarity } from "./schemas/buff-item.schema";
import {
  UserBuffCollection,
  UserBuffCollectionDocument,
} from "./schemas/user-buff-collection.schema";

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
      "artefak-romawi",      // Roman Coin
      "artefak-inca",        // Inca Gold Disc
      "artefak-afrika",      // African Iron Coin
      "artefak-tartar",      // Tartar Bow Ornament
      "artefak-keltik",      // Celtic Torc
      "patung-banteng",      // Bronze Bull
      "patung-elang",        // Eagle Figurine
      "patung-naga-kecil",   // Small Dragon
      "patung-serigala",     // Wolf Figurine
      "patung-beruang",      // Bear Statuette
    ],
    MEDIUM: [
      "patung-dewa-yunani",   // Greek God Statue
      "patung-garuda-emas",   // Golden Garuda
      "patung-singa-marmer",  // Marble Lion
      "patung-knight",        // Knight Statue
      "patung-samurai-statue",// Samurai Armor
      "guci-tutup-naga",      // Dragon Lid Vase (reused medium slot)
      "guci-dinasti-ming",    // Ming Dynasty Vase
      "guci-cloisonne",       // Cloisonne Enamel
      "cincin-firaun",        // Pharaoh's Ring
      "bros-permata",         // Gemstone Brooch
    ],
    RARE: [
      "pedang-excalibur",     // Excalibur
      "keris-jawa",           // Javanese Keris
      "trident-poseidon",     // Poseidon's Trident
      "mjolnir",              // Thor's Hammer
      "panah-artemis",        // Artemis' Bow
      "pedang-bayangan",      // Shadow Blade
      "perisai-athena",       // Aegis Shield
      "pedang-samurai",       // Katana
      "keris-naga",           // Dragon Keris
      "halberd-penjaga",      // Guard's Halberd
    ],
    ULTRA_RARE: [
      "mahkota-kaisar",       // Emperor's Crown
      "cincin-solomon",       // Solomon's Ring
      "kalung-ra",            // Ra's Necklace
      "tongkat-hermes",       // Caduceus
      "bola-kristal-naga",    // Dragon Crystal Ball
      "peti-naga",            // Dragon Chest
      "peti-neraka",          // Hellfire Chest
      "peti-dewa",            // Divine Chest
      "peti-multiverse",      // Multiverse Chest
      "peti-emas-raja",       // King's Gold Chest
    ],
  },

  // ── ECONOMY (40 items) — wealth / trade / resource items ────────────────
  ECONOMY: {
    COMMON: [
      "artefak-sumeria",      // Sumerian Tablet
      "artefak-maya",         // Mayan Calendar Disk
      "artefak-cina-kuno",    // Ancient Chinese Seal
      "artefak-persia",       // Persian Astrolabe
      "artefak-babilonia",    // Babylonian Seal
      "artefak-mesir-mini",   // Mini Scarab
      "artefak-aztec-mini",   // Mini Sun Disk
      "artefak-timur-tengah", // Brass Lamp
      "kotak-kayu",           // Wooden Box
      "kotak-logam",          // Metal Tin
    ],
    MEDIUM: [
      "mahkota-raja",         // King's Crown
      "mahkota-ratu",         // Queen's Tiara
      "kalung-mutiara",       // Pearl Necklace
      "gelang-perak",         // Silver Bracelet
      "liontin-bulan",        // Moon Pendant
      "anting-giok",          // Jade Earrings
      "diadem-bintang",       // Star Diadem
      "circlet-bulan",        // Moon Circlet
      "guci-jade-hijau",      // Green Jade Vase
      "guci-permata",         // Jeweled Vase
    ],
    RARE: [
      "peti-permata",         // Gemstone Chest
      "peti-kristal",         // Crystal Chest
      "peti-misterius",       // Mysterious Chest
      "peti-abadi",           // Eternal Chest
      "peti-langit",          // Sky Chest
      "peta-naga",            // Dragon Treasure Map
      "surat-naga",           // Ancient Dragon Letter
      "kitab-naga",           // Dragon Tome
      "kompas-naga",          // Dragon Compass
      "segel-naga",           // Dragon Seal
    ],
    ULTRA_RARE: [
      "guci-meissen",         // Meissen Porcelain
      "guci-wedgwood",        // Wedgwood Jasper
      "guci-millefiori",      // Millefiori Glass
      "guci-urn-yunani",      // Greek Amphora
      "guci-kubisme",         // Cubist Vase
      "guci-dunia",           // Globe Vase
      "patung-firaun-emas",   // Golden Pharaoh
      "patung-naga-jade",     // Jade Dragon
      "patung-feniks",        // Phoenix Statue
      "patung-tortoise",      // Jade Tortoise
    ],
  },

  // ── DURABILITY (40 items) — tool / craft / repair items ─────────────────
  DURABILITY: {
    COMMON: [
      "guci-tanah-liat",      // Clay Pot
      "guci-keramik-biru",    // Blue Ceramic Vase
      "guci-porselen-putih",  // White Porcelain
      "guci-tembikar-romawi", // Roman Pottery
      "guci-batik-jawa",      // Batik Vase
      "guci-sakura-jepang",   // Cherry Blossom Vase
      "guci-celadon",         // Celadon Vase
      "guci-majolica",        // Majolica Vase
      "guci-raku",            // Raku Pottery
      "guci-sancai",          // Sancai Glazed Vase
    ],
    MEDIUM: [
      "guci-meissen",         // (note: re-using visually, but real mapping below)
      "guci-jade-hijau",      // Green Jade Vase
      "guci-cloisonne",       // Cloisonne Enamel
      "patung-dewi-lakshmi",  // Goddess Lakshmi
      "patung-dewa-yunani",   // Greek God Statue
      "kristal-kuarsa",       // Quartz Crystal
      "batu-ruby",            // Ruby Stone
      "batu-sapphire",        // Sapphire Stone
      "batu-emerald",         // Emerald Stone
      "kristal-amethyst",     // Amethyst Crystal
    ],
    RARE: [
      "peti-permata",         // Gemstone Chest
      "peti-kristal",         // Crystal Chest
      "bola-kristal-naga",    // Dragon Crystal Ball
      "kalung-ra",            // Ra's Necklace
      "cincin-solomon",       // Solomon's Ring
      "tongkat-hermes",       // Caduceus
      "mahkota-kaisar",       // Emperor's Crown
      "peti-dewa",            // Divine Chest
      "peti-abadi",           // Eternal Chest
      "peti-multiverse",      // Multiverse Chest
    ],
    ULTRA_RARE: [
      "guci-kubisme",         // Cubist Vase
      "guci-permata",         // Jeweled Vase
      "guci-dunia",           // Globe Vase
      "guci-millefiori",      // Millefiori Glass
      "guci-urn-yunani",      // Greek Amphora
      "guci-wedgwood",        // Wedgwood Jasper
      "patung-firaun-emas",   // Golden Pharaoh
      "patung-naga-jade",     // Jade Dragon
      "patung-feniks",        // Phoenix Statue
      "patung-tortoise",      // Jade Tortoise
    ],
  },

  // ── DROPRATE (40 items) — mystical / arcane / rare-find items ───────────
  DROPRATE: {
    COMMON: [
      "artefak-viking",       // Viking Compass
      "artefak-yunani",       // Greek Figurine
      "artefak-aborigin",     // Dreamtime Rock
      "artefak-norse",        // Norse Rune Stone
      "artefak-korea",        // Korean Celadon Cup
      "artefak-india",        // Ancient Chakra
      "artefak-polinesia",    // Tiki Figurine
      "patung-buddha",        // Small Buddha
      "patung-kucing-mesir",  // Bastet Cat
      "patung-merak",         // Peacock Figure
    ],
    MEDIUM: [
      "kitab-sihir",          // Spell Book
      "peta-harta-karun",     // Treasure Map
      "surat-raja",           // Royal Decree
      "codex-kuno",           // Ancient Codex
      "scroll-buddha",        // Buddhist Sutra
      "manuskrip-maya",       // Mayan Codex
      "atlas-kuno",           // Ancient Atlas
      "buku-ramalan",         // Prophecy Book
      "tabel-bintang",        // Star Chart
      "gulungan-mesir",       // Egyptian Papyrus
    ],
    RARE: [
      "peti-misterius",       // Mysterious Chest
      "peti-langit",          // Sky Chest
      "peta-naga",            // Dragon Treasure Map
      "surat-naga",           // Ancient Dragon Letter
      "kitab-naga",           // Dragon Tome
      "kompas-naga",          // Dragon Compass
      "segel-naga",           // Dragon Seal
      "peti-naga",            // Dragon Chest
      "peti-neraka",          // Hellfire Chest
      "peti-emas-raja",       // King's Gold Chest
    ],
    ULTRA_RARE: [
      "batu-topaz",           // Topaz Stone
      "batu-opal",            // Opal Stone
      "kristal-lapis",        // Lapis Lazuli
      "batu-garnet",          // Garnet Stone
      "kristal-aquamarine",   // Aquamarine
      "bros-permata",         // Gemstone Brooch
      "cincin-firaun",        // Pharaoh's Ring
      "mahkota-raja",         // King's Crown
      "mahkota-ratu",         // Queen's Tiara
      "kalung-mutiara",       // Pearl Necklace
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

@Injectable()
export class BuffItemCollectionsService implements OnModuleInit {
  private readonly logger = new Logger(BuffItemCollectionsService.name);

  constructor(
    @InjectModel(BuffItem.name) private buffItemModel: Model<BuffItemDocument>,
    @InjectModel(UserBuffCollection.name)
    private userBuffModel: Model<UserBuffCollectionDocument>,
  ) { }

  // ── Seed on startup ────────────────────────────────────────────────────────
  async onModuleInit() {
    await this.seedBuffItems();
  }

  /**
   * Seed all 160 buff items into the database (idempotent — skips if already seeded).
   */
  private async seedBuffItems() {
    const count = await this.buffItemModel.countDocuments();
    if (count >= 160) {
      this.logger.log(`Buff items already seeded (${count} found)`);
      return;
    }

    this.logger.log("Seeding 160 buff items...");

    const docs: Partial<BuffItem>[] = [];

    for (const buffType of ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"] as BuffType[]) {
      for (const rarity of ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] as BuffRarity[]) {
        const itemIds = BUFF_ASSIGNMENTS[buffType][rarity];
        const values = BUFF_VALUES[rarity];
        const meta = BUFF_TYPE_META[buffType];

        for (let i = 0; i < 10; i++) {
          const buffId = `${buffType}-${rarity}-${String(i + 1).padStart(2, "0")}`;
          const value = values[i];
          const description =
            meta.unit === "percent"
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

    // Bulk upsert — idempotent
    for (const doc of docs) {
      await this.buffItemModel.updateOne(
        { buffId: doc.buffId },
        { $set: doc },
        { upsert: true },
      );
    }

    this.logger.log(`Seeded ${docs.length} buff items`);
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

    return {
      success: true,
      buffItem,
      instanceId,
      message: `Granted "${buffItem.name}" (${buffItem.description})`,
    };
  }

  /**
   * Activate (equip) a buff instance.
   */
  async activateBuff(telegramId: string, instanceId: string) {
    const collection = await this.userBuffModel.findOne({ telegramId });
    if (!collection) return { success: false, error: "User collection not found" };

    const hasInstance = collection.inventory.some(i => i.instanceId === instanceId);
    if (!hasInstance) return { success: false, error: "You do not own this instance" };

    if (collection.activeInstanceIds.includes(instanceId)) {
      return { success: false, error: "Instance is already active" };
    }

    collection.activeInstanceIds.push(instanceId);
    await collection.save();
    return { success: true, activeInstanceIds: collection.activeInstanceIds };
  }

  /**
   * Deactivate (unequip) a buff instance.
   */
  async deactivateBuff(telegramId: string, instanceId: string) {
    const collection = await this.userBuffModel.findOne({ telegramId });
    if (!collection) return { success: false, error: "User collection not found" };

    if (!collection.activeInstanceIds.includes(instanceId)) {
      return { success: false, error: "Instance is not active" };
    }

    collection.activeInstanceIds = collection.activeInstanceIds.filter((id) => id !== instanceId);
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
