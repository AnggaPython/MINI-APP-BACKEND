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
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";

// ─────────────────────────────────────────────────────────────
// MULTI-LAYER RNG — server-authoritative case-box loot table.
//
// Opening a case is deliberately hard. The outcome is rolled in layers:
//
//   Layer 1 — OUTCOME (100%):
//       25%  ZONK          → nothing at all
//       10%  ELIXCOIN      → ELIXCOIN by case tier
//       20%  MATERIAL      → exactly 1 material tool, rarity rolled next
//       45%  BUFF          → buff collection item, rarity rolled next
//
//   Layer 2 — MATERIAL RARITY (only from the 20% MATERIAL pool):
//       70%  COMMON  (1 of 25 tools)
//       22%  MEDIUM  (1 of 25 tools)
//       8%   RARE    (1 of 25 tools)
//
//   Layer 2b — BUFF RARITY (only from the 45% BUFF pool):
//        60%  COMMON     (+0.10…+0.60 buff)
//        15%  MEDIUM     (+1.25…+3.50 buff)
//         5%  RARE       (+3.75…+6.00 buff)
//        0.5% ULTRA_RARE (+6.00…+33.00 buff)
//
//   Layer 3 — AMOUNT: always exactly 1 (materials stay scarce, no inflation).
// ─────────────────────────────────────────────────────────────

/** Spawned case rarity weights (decides which case SVG + HP band). */
export const CASE_TIER_WEIGHTS: Record<CaseTier, number> = {
  COMMON: 70,
  MEDIUM: 25,
  RARE: 5,
};

/** Layer 1 — outcome weights (sums to 100). */
export const OUTCOME_WEIGHTS: Record<CaseOutcome, number> = {
  MATERIAL: 20,
  BUFF: 45,
  ZONK: 25,
  ELIXCOIN: 10,
};

/** Layer 2 — material rarity weights (sums to 100). */
export const LOOT_RARITY_WEIGHTS: Record<CaseTier, number> = {
  COMMON: 70,
  MEDIUM: 22,
  RARE: 8,
};

/** Layer 2b — buff rarity weights (sums to 80.5). */
export const BUFF_RARITY_WEIGHTS: Record<string, number> = {
  COMMON: 60,
  MEDIUM: 15,
  RARE: 5,
  ULTRA_RARE: 0.5,
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

// ── Anti-exploit constants ────────────────────────────────────────────────
// Minimum ms per HP point when opening a case. Frontend enforces 1.7s between
// hits (HIT_DELAY_MS), but the server is more lenient (800ms) to account for
// network latency and page-load time. A bot that opens a 24-HP case in under
// 19 seconds (24 × 800ms) will be rejected.
const MIN_HIT_TIME_PER_HP_MS = 800;

// Server-side cooldown between cases (matches frontend COOLDOWN_MS = 78s).
// Enforced by checking the last claimed case's claimedAt timestamp.
const CASE_COOLDOWN_MS = 78_000;

// Rate limit: max destroy calls per user per time window.
const DESTROY_RATE_LIMIT = 5;
const DESTROY_RATE_WINDOW_MS = 60_000;

@Injectable()
export class CaseBoxService {
  // Lightweight in-memory spawn throttle: telegramId -> last spawn timestamp.
  private readonly lastSpawnAt = new Map<string, number>();

  // In-memory rate limit: telegramId -> array of destroy timestamps (sliding window).
  private readonly destroyTimestamps = new Map<string, number[]>();

  // In-memory cooldown: telegramId -> last claim timestamp (ms).
  // Mirrors lastSpawnAt pattern — lost on server restart, but that's fine:
  // one extra spawn after restart is harmless, and the DB claimedAt field
  // serves as the durable audit trail.
  private readonly lastClaimAt = new Map<string, number>();

  constructor(
    @InjectModel(CaseBox.name)
    private readonly caseBoxModel: Model<CaseBoxDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly buffCollectionsService: BuffItemCollectionsService,
  ) { }

  /** Evict stale destroy timestamps older than the rate window. */
  private evictRateLimit(telegramId: string, now: number): void {
    const ts = this.destroyTimestamps.get(telegramId);
    if (!ts) return;
    const cutoff = now - DESTROY_RATE_WINDOW_MS;
    const filtered = ts.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      this.destroyTimestamps.delete(telegramId);
    } else {
      this.destroyTimestamps.set(telegramId, filtered);
    }
  }

  /** Returns the remaining cooldown in ms (0 = no cooldown). Pure in-memory. */
  private getCooldownLeft(telegramId: string, now: number): number {
    const last = this.lastClaimAt.get(telegramId);
    if (!last) return 0;
    return Math.max(0, CASE_COOLDOWN_MS - (now - last));
  }

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

    // Server-side cooldown: reject if the user's last claimed case was <78s ago.
    // Pure in-memory — no DB query, zero cost.
    const cooldownLeft = this.getCooldownLeft(telegramId, now);
    if (cooldownLeft > 0) {
      return {
        success: false,
        error: "Please wait before opening another case.",
        cooldownLeft,
      };
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
    const now = Date.now();
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        error: "User account not found. Please reload the app.",
      };
    }

    // ── Rate limit: max DESTROY_RATE_LIMIT destroys per minute ────────────
    this.evictRateLimit(telegramId, now);
    const recentDestroys = this.destroyTimestamps.get(telegramId) || [];
    if (recentDestroys.length >= DESTROY_RATE_LIMIT) {
      return {
        success: false,
        error: "Too many requests. Please wait a moment.",
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

    // ── Time-gate: reject if the user opened the case too fast ────────────
    // The fastest possible legitimate time is maxHp × MIN_HIT_TIME_PER_HP_MS.
    // Bots that skip hits will be caught here.
    const minRequiredTime = pending.maxHp * MIN_HIT_TIME_PER_HP_MS;
    const caseAge = now - new Date((pending as any).createdAt).getTime();
    if (caseAge < minRequiredTime) {
      return {
        success: false,
        error: "Case not ready yet. Keep hitting the lock!",
      };
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

    // ── Fetch active buffs (ECONOMY + DROPRATE) before rolling loot ────
    let economyMultiplier = 1;
    let droprateBonus = 0;
    try {
      const buffTotals = await this.buffCollectionsService.getUserBuffTotals(telegramId);
      if (buffTotals.totals?.ECONOMY) economyMultiplier = 1 + buffTotals.totals.ECONOMY / 100;
      if (buffTotals.totals?.DROPRATE) droprateBonus = buffTotals.totals.DROPRATE;
    } catch { /* buff service unavailable — skip bonuses gracefully */ }

    // DROPRATE buff: shift rarity weights upward so rarer items are more likely.
    // Formula: add droprateBonus% of RARE weight to RARE, and half that to ULTRA_RARE.
    const boostedMaterialWeights = { ...LOOT_RARITY_WEIGHTS };
    const boostedBuffWeights = { ...BUFF_RARITY_WEIGHTS };
    if (droprateBonus > 0) {
      const rareBoost = Math.min(droprateBonus, 30); // cap at 30% to prevent 100% rare
      const ultraBoost = rareBoost * 0.3;
      boostedMaterialWeights.RARE = LOOT_RARITY_WEIGHTS.RARE + rareBoost;
      boostedMaterialWeights.COMMON = Math.max(10, LOOT_RARITY_WEIGHTS.COMMON - rareBoost);
      boostedBuffWeights.RARE = BUFF_RARITY_WEIGHTS.RARE + rareBoost;
      boostedBuffWeights.ULTRA_RARE = BUFF_RARITY_WEIGHTS.ULTRA_RARE + ultraBoost;
      boostedBuffWeights.COMMON = Math.max(10, BUFF_RARITY_WEIGHTS.COMMON - rareBoost - ultraBoost);
    }

    // ── Layer 1 — OUTCOME (20 MATERIAL / 45 BUFF / 25 ZONK / 10 ELIXCOIN) ──
    const clientSeed = `${telegramId}:${box._id}:${Date.now()}`;
    const outcomeRoll = this.roll01(clientSeed, "case-outcome");
    const outcome = this.weightedPick(outcomeRoll, OUTCOME_WEIGHTS) as CaseOutcome;

    let rarity: CaseTier | null = null;
    let loot: Record<string, number> | null = null;
    let buffGranted: any = null;

    if (outcome === "ZONK") {
      loot = null;
    } else if (outcome === "ELIXCOIN") {
      // ECONOMY buff: multiply ELIXCOIN drop amount
      const [min, max] = ELIXCOIN_BANDS[box.tier];
      const base = Math.floor(min + Math.random() * (max - min + 1));
      const amount = Math.round(base * economyMultiplier);
      loot = { ELIXCOIN: amount };
    } else if (outcome === "MATERIAL") {
      // Layer 2 — material rarity (DROPRATE buff boosted weights)
      const rarityRoll = this.roll01(clientSeed, "case-rarity");
      rarity = this.weightedPick(rarityRoll, boostedMaterialWeights) as CaseTier;
      const pool = CASE_MATERIALS[rarity];
      const lootName = pool[Math.floor(Math.random() * pool.length)];
      loot = { [lootName]: 1 };
    } else if (outcome === "BUFF") {
      // Layer 2b — buff rarity roll (DROPRATE buff boosted weights)
      const buffRarityRoll = this.roll01(clientSeed, "case-buff-rarity");
      const buffRarity = this.weightedPick(buffRarityRoll, boostedBuffWeights);
      // Grant a random buff item of the rolled rarity to the user
      const grantResult: any = await this.buffCollectionsService.grantRandomBuff(
        telegramId,
        buffRarity as any,
      );
      buffGranted = grantResult;
      if (grantResult?.buffItem) {
        rarity = grantResult.buffItem.rarity;
        loot = { [grantResult.buffItem.name]: 1 };
      } else {
        // Fallback: if collection is complete or grant failed, give ELIXCOIN
        const [min, max] = ELIXCOIN_BANDS[box.tier];
        const base = Math.floor(min + Math.random() * (max - min + 1));
        const amount = Math.round(base * economyMultiplier);
        loot = { ELIXCOIN: amount };
      }
    }

    // ── Record destroy timestamp for rate limiting ───────────────────────
    const userTimestamps = this.destroyTimestamps.get(telegramId) || [];
    userTimestamps.push(now);
    this.destroyTimestamps.set(telegramId, userTimestamps);

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
      buffGranted: outcome === "BUFF" ? buffGranted : undefined,
      economyMultiplier: economyMultiplier > 1 ? economyMultiplier : undefined,
      droprateBonus: droprateBonus > 0 ? droprateBonus : undefined,
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

    // Lock the claim transition — record claimedAt for server-side cooldown
    const boxToClaim = await this.caseBoxModel
      .findOneAndUpdate(
        { _id: caseId, telegramId, status: "opened" },
        { $set: { status: "claimed", claimedAt: new Date() } },
        { returnDocument: "after" },
      )
      .exec();

    if (!boxToClaim) {
      return { success: false, error: "Concurreny error: already claimed." };
    }

    // Record claim time in memory for server-side cooldown (zero DB cost).
    this.lastClaimAt.set(telegramId, Date.now());
    // Lazy cleanup — evict entries older than 2× cooldown.
    if (this.lastClaimAt.size > 5000) {
      const cutoff = Date.now() - CASE_COOLDOWN_MS * 2;
      for (const [key, ts] of this.lastClaimAt) {
        if (ts < cutoff) this.lastClaimAt.delete(key);
      }
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
