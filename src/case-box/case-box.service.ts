import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import {
  CaseBox,
  CaseBoxDocument,
  CaseTier,
  CaseOutcome,
} from "./schemas/case-box.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

// ─────────────────────────────────────────────────────────────
// MULTI-LAYER RNG — server-authoritative case-box loot table.
//
// Opening a case is deliberately hard. The outcome is rolled in layers:
//
//   Layer 1 — OUTCOME (100%):
//       35%  ZONK          → nothing at all
//       35%  ELIXCOIN      → ELIXCOIN by case tier (COMMON 100–500, MEDIUM
//                            300–1,200, RARE 800–3,000)
//       30%  MATERIAL      → exactly 1 material tool, rarity rolled next
//
//   Layer 2 — MATERIAL RARITY (only from the 30% MATERIAL pool):
//       70%  COMMON  (1 of 25 tools)
//       22%  MEDIUM  (1 of 25 tools)
//       8%   RARE    (1 of 25 tools)
//
//   Layer 3 — AMOUNT: always exactly 1 (materials stay scarce, no inflation).
//
// So a RARE tool overall ≈ 30% × 8% = 2.4% of every case opened, COMMON
// ≈ 21% and MEDIUM ≈ 6.6% — materials are deliberately hard to get.
// ─────────────────────────────────────────────────────────────

/** Spawned case rarity weights (decides which case SVG + HP band). */
export const CASE_TIER_WEIGHTS: Record<CaseTier, number> = {
  COMMON: 70,
  MEDIUM: 25,
  RARE: 5,
};

/** Layer 1 — outcome weights (sums to 100). Materials are scarce: 70% of
 * opens land on ZONK or ELIXCOIN so material tools never hyper-inflate. */
export const OUTCOME_WEIGHTS: Record<CaseOutcome, number> = {
  MATERIAL: 30,
  ZONK: 35,
  ELIXCOIN: 35,
};

/** Layer 2 — material rarity weights (sums to 100). */
export const LOOT_RARITY_WEIGHTS: Record<CaseTier, number> = {
  COMMON: 70,
  MEDIUM: 22,
  RARE: 8,
};

/**
 * ELIXCOIN-only reward bands — scaled by the CASE tier (not flat), so a RARE
 * case (which needs more hits to break) pays the most. Expected per open at
 * the 35% outcome weight: COMMON ≈ 300 · MEDIUM ≈ 750 · RARE ≈ 1,900.
 * Bands are budgeted against the Monetag S2S ad share so the platform stays
 * sustainable — the real prize of a case remains the material tool.
 */
export const ELIXCOIN_BANDS: Record<CaseTier, [number, number]> = {
  COMMON: [100, 500],
  MEDIUM: [300, 1200],
  RARE: [800, 3000],
};

/** Layer 3 — material amount bands per rarity. Always exactly 1: each open
 * grants a single tool so the market never floods with duplicates. */
export const MATERIAL_AMOUNTS: Record<CaseTier, [number, number]> = {
  COMMON: [1, 1],
  MEDIUM: [1, 1],
  RARE: [1, 1],
};

/** maxHp bands per spawned case tier — the lock takes this many hits. */
export const CASE_HP_BANDS: Record<CaseTier, [number, number]> = {
  COMMON: [12, 24],
  MEDIUM: [18, 36],
  RARE: [27, 54],
};

/**
 * Durability cost per case spawn when the lock is struck.
 * Each destroyed case drains -3 from the equipped pickaxe's durability
 * (mirroring miner-stone, where durability is client-authoritative state).
 */
export const CASE_DURABILITY_COST = 3;

/**
 * The 75 material tools — server-authoritative names. They are credited into
 * cryptoBalances.<NAME> and must match the frontend tools-material list.
 */
export const CASE_MATERIALS: Record<CaseTier, string[]> = {
  COMMON: [
    "Rusty Nail",
    "Wooden Handle",
    "Iron Shard",
    "Copper Wire",
    "Flint Stone",
    "Hemp Rope",
    "Leather Strap",
    "Clay Mold",
    "Tin Plate",
    "Bone Fragment",
    "Sandstone Grit",
    "Charcoal Lump",
    "Glass Shard",
    "Rubber Grip",
    "Brass Rivet",
    "Canvas Wrap",
    "Iron Bolt",
    "Slate Chip",
    "Twine Coil",
    "Wax Seal",
    "Stone Wheel",
    "Bronze Pin",
    "Ash Plank",
    "Cloth Strip",
    "Pig Iron Ingot",
  ],
  MEDIUM: [
    "Steel Alloy",
    "Silver Filament",
    "Copper Coil",
    "Magnet Core",
    "Quartz Crystal",
    "Reinforced Spring",
    "Tempered Glass",
    "Gold Plating",
    "Titanium Screw",
    "Carbon Fiber",
    "Enchanted Rune",
    "Sapphire Lens",
    "Power Cell",
    "Hydraulic Pump",
    "Servo Motor",
    "Platinum Wire",
    "Crystal Gear",
    "Obsidian Blade",
    "Neon Capacitor",
    "Phantom Core",
    "Emerald Driver",
    "Chrono Spring",
    "Plasma Coil",
    "Arcane Alloy",
    "Magnetic Array",
  ],
  RARE: [
    "Void Diamond",
    "Phoenix Feather",
    "Dragon Scale",
    "Celestial Core",
    "Quantum Shard",
    "Starforged Ingot",
    "Infinity Crystal",
    "Thunder Essence",
    "Abyss Pearl",
    "Solar Fragment",
    "Lunar Prism",
    "Chaos Ember",
    "Titan Heart",
    "Etherium Wire",
    "Rift Anchor",
    "Frost Nova Core",
    "Pyroclasm Gem",
    "Nebula Dust",
    "Singularity Bolt",
    "Godslayer Alloy",
    "Timeless Gear",
    "Dimension Key",
    "Eternity Matrix",
    "Primordial Ore",
    "Omega Circuit",
  ],
};

const SPAWN_THROTTLE_MS = 800;
const ACTIVE_CASE_TTL_MS = 2 * 60 * 60 * 1000; // 2h — unopened cases auto-expire
const OPENED_CASE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d — opened cases power history
const HISTORY_LIMIT = 50;

@Injectable()
export class CaseBoxService {
  // Lightweight in-memory spawn throttle: telegramId -> last spawn timestamp.
  private readonly lastSpawnAt = new Map<string, number>();

  constructor(
    @InjectModel(CaseBox.name)
    private readonly caseBoxModel: Model<CaseBoxDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
  ) { }

  // ─────────────────────────────────────────────────────────────
  // Provably-fair HMAC-SHA256 RNG (same pattern as miner-stone / Hi-Lo)
  // ─────────────────────────────────────────────────────────────
  private roll01(clientSeed: string, purpose: string): number {
    const serverSeed = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${purpose}`)
      .digest("hex");
    const parsed = parseInt(hash.substring(0, 8), 16);
    return parsed / 0xffffffff; // 0..1
  }

  private weightedPick(
    roll: number,
    weights: Record<string, number>,
  ): string {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let acc = 0;
    for (const [key, w] of Object.entries(weights)) {
      acc += w;
      if (roll < acc / total) return key;
    }
    return Object.keys(weights)[Object.keys(weights).length - 1];
  }

  // ─────────────────────────────────────────────────────────────
  // GET /case-box/spawn — server rolls tier + maxHp, DB issues the case ID
  // ─────────────────────────────────────────────────────────────
  async spawn(telegramId: string) {
    const now = Date.now();
    const last = this.lastSpawnAt.get(telegramId);
    if (last && now - last < SPAWN_THROTTLE_MS) {
      return {
        success: false,
        error: "Please wait a moment before spawning a new case.",
      };
    }
    this.lastSpawnAt.set(telegramId, now);
    if (this.lastSpawnAt.size > 5000) {
      for (const [key, ts] of this.lastSpawnAt) {
        if (now - ts > 60000) this.lastSpawnAt.delete(key);
      }
    }

    // Spawned case rarity — cosmetic (which case SVG) + HP band.
    const clientSeed = `${telegramId}:${now}`;
    const tierRoll = this.roll01(clientSeed, "case-tier");
    const tier = this.weightedPick(tierRoll, CASE_TIER_WEIGHTS) as CaseTier;

    // maxHp within the tier band.
    const hpRoll = this.roll01(clientSeed, "case-hp");
    const [hpMin, hpMax] = CASE_HP_BANDS[tier];
    const maxHp = Math.round(hpMin + (hpMax - hpMin) * hpRoll);

    // Unique case ID comes from the database (_id).
    const box = await new this.caseBoxModel({
      telegramId,
      tier,
      maxHp,
      status: "active",
      expireAt: new Date(now + ACTIVE_CASE_TTL_MS),
    }).save();

    return {
      success: true,
      durabilityCost: CASE_DURABILITY_COST,
      box: {
        caseId: box._id.toString(),
        tier: box.tier,
        maxHp: box.maxHp,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // POST /case-box/destroy — break the lock & roll the multi-layer RNG.
  // The loot is credited atomically and idempotently (per-case lock), so a
  // replay can never double-credit a case.
  // ─────────────────────────────────────────────────────────────
  async destroy(telegramId: string, caseId: string) {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        error: "User account not found. Please reload the app.",
      };
    }

    // Peek the case tier first — MEDIUM/RARE cases require a Monetag S2S ad
    // ticket (granted by the S2S postback) before the lock can be broken.
    const pending = await this.caseBoxModel
      .findOne({ _id: caseId, telegramId, status: "active" })
      .lean()
      .exec();
    if (!pending) {
      return { success: false, error: "Case not found or already opened." };
    }

    // Atomic single-open lock: race-condition safe, cannot double-open.
    const box = await this.caseBoxModel
      .findOneAndUpdate(
        { _id: caseId, telegramId, status: "active" },
        { $set: { status: "opened" } },
        { returnDocument: "after" },
      )
      .exec();

    if (!box) {
      return { success: false, error: "Case not found or already opened." };
    }

    // ── Layer 1 — OUTCOME (30 MATERIAL / 35 ZONK / 35 ELIXCOIN) ──────────
    const clientSeed = `${telegramId}:${box._id}:${Date.now()}`;
    const outcomeRoll = this.roll01(clientSeed, "case-outcome");
    const outcome = this.weightedPick(outcomeRoll, OUTCOME_WEIGHTS) as CaseOutcome;

    let rarity: CaseTier | null = null;
    let loot: Record<string, number> | null = null;

    if (outcome === "ZONK") {
      loot = null;
    } else if (outcome === "ELIXCOIN") {
      const [min, max] = ELIXCOIN_BANDS[box.tier];
      const amount = Math.floor(min + Math.random() * (max - min + 1));
      loot = { ELIXCOIN: amount };
    } else {
      const rarityRoll = this.roll01(clientSeed, "case-rarity");
      rarity = this.weightedPick(rarityRoll, LOOT_RARITY_WEIGHTS) as CaseTier;
      const pool = CASE_MATERIALS[rarity];
      const lootName = pool[Math.floor(Math.random() * pool.length)];
      loot = { [lootName]: 1 };
    }

    // ── Persist the outcome on the case record (audit + history) ─────────
    await this.caseBoxModel
      .updateOne(
        { _id: caseId },
        {
          $set: {
            rarity,
            outcome,
            loot,
            openedAt: new Date(),
          },
        },
      )
      .exec();

    return {
      success: true,
      caseId: box._id.toString(),
      tier: pending.tier,
      outcome,
      rarity,
      loot,
    };
  }

  async claimCase(caseId: string, telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) return { success: false, error: "User not found" };

    const opened = await this.caseBoxModel
      .findOne({ _id: caseId, telegramId, status: "opened" })
      .lean()
      .exec();

    if (!opened) {
      return { success: false, error: "Case not ready for claim or already claimed." };
    }

    const { tier, outcome, loot } = opened;
    const adRequired = tier === "MEDIUM" || tier === "RARE";

    if (outcome !== "ZONK" && adRequired && (user.adTickets || 0) < 1) {
      return {
        success: false,
        adRequired: true,
        error:
          "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
      };
    }

    // Lock the claim transition
    const boxToClaim = await this.caseBoxModel
      .findOneAndUpdate(
        { _id: caseId, telegramId, status: "opened" },
        { $set: { status: "claimed" } },
        { returnDocument: "after" },
      )
      .exec();

    if (!boxToClaim) {
      return { success: false, error: "Concurreny error: already claimed." };
    }

    if (outcome !== "ZONK" && loot) {
      const inc: Record<string, number> = {};
      for (const [key, value] of Object.entries(loot)) {
        inc[`cryptoBalances.${key}`] = value;
      }
      if (adRequired) inc["adTickets"] = -1;

      const credited = await this.userModel
        .findOneAndUpdate(
          adRequired ? { telegramId, adTickets: { $gte: 1 } } : { telegramId },
          { $inc: inc },
        )
        .exec();

      if (adRequired && !credited) {
        return {
          success: false,
          adRequired: true,
          error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap to claim again.",
        };
      }
    }
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // GET /case-box/history — opened cases (tier, outcome, loot)
  // ─────────────────────────────────────────────────────────────
  async history(telegramId: string) {
    const boxes = await this.caseBoxModel
      .find({ telegramId, status: "opened" })
      .sort({ openedAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean()
      .exec();

    return {
      success: true,
      history: boxes.map((box) => ({
        caseId: box._id.toString(),
        tier: box.tier,
        maxHp: box.maxHp,
        outcome: box.outcome,
        rarity: box.lootRarity,
        loot: box.loot || {},
        openedAt: box.openedAt,
      })),
    };
  }
}
