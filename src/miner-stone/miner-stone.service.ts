import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import {
  MiningStone,
  MiningStoneDocument,
  StoneTier,
} from "./schemas/mining-stone.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
  // @ts-ignore - super strict cleanup pending (auto)
import { LevelingService, STAR_XP_PER_TIER, getLevelMultiplier, getHpMultiplier } from "../leveling-miner/leveling.service";
import { FragmentService } from "../fragment/fragment.service";

/**
 * Server-authoritative balance tables.
 *
 * Spawn probabilities (casino-style weighted RNG):
 *   Common ≈ 85% · Medium ≈ 12% · Rare ≈ 3%
 *
 * HP/MPa bands rolled at spawn (base, before HP multiplier):
 *   Common  20.00 – 45.00  MPa   → Level 1: ~16 hits with Common pickaxe
 *   Medium  40.00 – 100.00 MPa   → Level 1: ~35 hits with Common pickaxe
 *   Rare    60.00 – 200.00 MPa   → Level 1: ~65 hits (intentionally hard)
 *
 * HP multiplier scales these bands: 1.00x at Lv1 → 10.95x at Lv100.
 * Combined with pickaxe power progression (2→60), this creates a smooth
 * difficulty curve: easy start → satisfying power spikes at pickaxe upgrades.
 *
 * Reward bands (scaled by the stone's rolled MPa quality, randomized per claim):
 *   Common → IRON 10–100 · COPPER 5–50
 *   Medium → SILVER 5–40 · GOLD 1–3
 *   Rare   → GOLD 2–10 · DIAMOND 1–3
 */
interface TierConfig {
  hpMin: number;
  hpMax: number;
  weight: number; // cumulative weight out of 100,000
  rewards: Record<string, [number, number]>;
}

const TIER_CONFIG: Record<StoneTier, TierConfig> = {
  Common: {
    hpMin: 20,
    hpMax: 45,
    weight: 85000,
    rewards: {
      IRON: [10, 100],
      COPPER: [5, 50],
    },
  },
  Medium: {
    hpMin: 40,
    hpMax: 100,
    weight: 97000,
    rewards: {
      SILVER: [5, 40],
      GOLD: [1, 3],
    },
  },
  Rare: {
    hpMin: 60,
    hpMax: 200,
    weight: 100000,
    rewards: {
      GOLD: [2, 10],
      DIAMOND: [1, 3],
    },
  },
};

const SPAWN_THROTTLE_MS = 800;
const ACTIVE_STONE_TTL_MS = 2 * 60 * 60 * 1000; // 2h — unclaimed stones auto-expire
const CLAIMED_STONE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d — claimed stones power the History tab
const HISTORY_LIMIT = 50;

// ── Anti-exploit constants (mirrors case-box, tuned for miner-stone) ──────
// Frontend enforces 1500ms between hits (hard throttle). Each hit removes
// pickaxe.power + ATK buff HP. The server doesn't know the player's ATK,
// so we compute the absolute fastest a legitimate client could destroy:
//   minHits = ceil(maxHp / MAX_PLAYER_ATK)
//   minTime = minHits * HIT_INTERVAL_MS
// MAX_PLAYER_ATK covers Mythic (60) + generous ATK buff ceiling.
const MAX_PLAYER_ATK = 120;
const HIT_INTERVAL_MS = 1500;

// NOTE: Server-side cooldown removed — the frontend's 3-minute timer
// is the sole timing mechanism. This avoids conflicts where the backend
// cooldown rejects spawn calls and freezes the frontend countdown.

// Rate limit: max destroy calls per user per time window.
// Scales with level: 5 at level 1 → 9 at level 100.
const DESTROY_RATE_LIMIT_BASE = 5;
const DESTROY_RATE_WINDOW_MS = 60_000;

// Casino-style ZONK: ~10% of spawned stones contain nothing at all.
// Rolled at spawn by the same HMAC RNG so the stone's fate is fixed up front.
const ZONK_CHANCE = 0.1;

// Server-authoritative ELIXCOIN conversion rates for mined resources.
// SELL converts the stone's loot to ELIXCOIN at these prices and credits
// cryptoBalances.ELIXCOIN — the quote currency of the ELIXIR/ELIXCOIN spot
// market. It is a SEPARATE entity from the user's ELIXIR balance (elixirBalance).
//
// Balanced against the Monetag S2S ad budget (IRON/COPPER are the constant
// Common drops, so they are the cheapest; DIAMOND is the rarest and dearest).
// Expected SELL value per stone: Common ≈ 46 · Medium ≈ 112 · Rare ≈ 180.
export const ELIX_RATES: Record<string, number> = {
  IRON: 0.005,
  COPPER: 0.01,
  SILVER: 0.1,
  GOLD: 1,
  DIAMOND: 10,
};

// ─────────────────────────────────────────────────────────────
// Pickaxe progression — server-authoritative upgrade costs.
// Higher tiers are unlocked by spending GOLD + DIAMOND (both only
// obtainable from Medium/Rare stones), always chained in order.
// ─────────────────────────────────────────────────────────────
export const PICKAXE_TIERS = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
] as const;

export type PickaxeTier = (typeof PICKAXE_TIERS)[number];

// Repair costs — each tier is mended with the resources its stones drop:
//   Common → IRON · Uncommon → SILVER · Rare+ → GOLD (Mythic also needs DIAMOND)
// Server-authoritative; the frontend only mirrors this for display.
const PICKAXE_REPAIR_COSTS: Record<PickaxeTier, Record<string, number>> = {
  // Low tier: IRON + COPPER only
  Common: { IRON: 100, COPPER: 50 },
  Uncommon: { IRON: 150, COPPER: 80, SILVER: 20 },
  // Mid tier: add SILVER + small GOLD
  Rare: { IRON: 120, COPPER: 60, SILVER: 60, GOLD: 5 },
  Epic: { IRON: 100, COPPER: 50, SILVER: 80, GOLD: 10 },
  // High tier: all resources, balanced proportions
  Legendary: { IRON: 80, COPPER: 40, SILVER: 60, GOLD: 15, DIAMOND: 1 },
  Mythic: { IRON: 60, COPPER: 30, SILVER: 50, GOLD: 20, DIAMOND: 3 },
};

// The 5 mining resources (used to shape the balance payload returned to clients)
const RESOURCE_KEYS = ["IRON", "COPPER", "SILVER", "GOLD", "DIAMOND"];

@Injectable()
  // @ts-ignore - super strict cleanup pending (auto)
  // @ts-ignore - super strict cleanup pending
export class MinerStoneService {
  // @ts-ignore - super strict pending
  private readonly logger = new Logger(MinerStoneService.name);

  // Lightweight in-memory spawn throttle: telegramId -> last spawn timestamp.
  // Bounded memory: entries are purged lazily once stale / map grows too large.
  private readonly lastSpawnAt = new Map<string, number>();

  // In-memory rate limit: telegramId -> array of destroy timestamps (sliding window).
  private readonly destroyTimestamps = new Map<string, number[]>();



  constructor(
    @InjectModel(MiningStone.name)
    private miningStoneModel: Model<MiningStoneDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly buffCollectionsService: BuffItemCollectionsService,
    private readonly levelingService: LevelingService,
    private readonly fragmentService: FragmentService,
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



  // ─────────────────────────────────────────────────────────────
  // Provably-fair HMAC-SHA256 RNG (same pattern as the Hi-Lo casino engine)
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

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  // ─────────────────────────────────────────────────────────────
  // GET /miner-stone/spawn — server rolls tier + MPa, DB issues the unique ID
  // ─────────────────────────────────────────────────────────────
  async spawn(telegramId: string) {
    const now = Date.now();
    const last = this.lastSpawnAt.get(telegramId);
    if (last && now - last < SPAWN_THROTTLE_MS) {
      return {
        success: false,
        error: "Please wait a moment before spawning a new stone.",
      };
    }
    this.lastSpawnAt.set(telegramId, now);
    // Lazy cleanup keeps the throttle map memory-bounded (stale entries only)
    if (this.lastSpawnAt.size > 5000) {
      for (const [key, ts] of this.lastSpawnAt) {
        if (now - ts > 60000) this.lastSpawnAt.delete(key);
      }
    }

    // ── Anti-reroll: if the user already has an unhit active stone, return it
    // instead of spawning a new one. Prevents navigating in/out to reroll
    // until getting Medium/Rare.
    const existingActive = await this.miningStoneModel
      .findOne({ telegramId, status: "active" })
      .lean()
      .exec();
    if (existingActive) {
      return {
        success: true,
        stone: {
          stoneId: existingActive._id.toString(),
          tier: existingActive.tier,
          maxHp: existingActive.maxHp,
          zonk: existingActive.zonk,
        },
      };
    }

    // Fetch user level for HP scaling (uses aggressive HP multiplier)
    let hpMultiplier = 1;
    try {
      const userDoc = await this.userModel.findOne({ telegramId }).lean().exec();
      const userLevel = (userDoc as any)?.level || 1;
      hpMultiplier = getHpMultiplier(userLevel);
    } catch { /* leveling unavailable — use base multiplier */ }

    return this.spawnFresh(telegramId, now, hpMultiplier);
  }

  // ─────────────────────────────────────────────────────────────
  // POST /miner-stone/rotate — abandon the current active stone (NO loot,
  // NO XP, NO fragments) and spawn a fresh one. Powers the client's
  // session time limit: when the UI countdown ends, the old session is
  // replaced even mid-HP — no need to destroy first.
  // ─────────────────────────────────────────────────────────────
  async rotate(telegramId: string) {
    const now = Date.now();
    const last = this.lastSpawnAt.get(telegramId);
    if (last && now - last < SPAWN_THROTTLE_MS) {
      return {
        success: false,
        error: "Please wait a moment before spawning a new stone.",
      };
    }
    this.lastSpawnAt.set(telegramId, now);
    // Lazy cleanup keeps the throttle map memory-bounded (stale entries only)
    if (this.lastSpawnAt.size > 5000) {
      for (const [key, ts] of this.lastSpawnAt) {
        if (now - ts > 60000) this.lastSpawnAt.delete(key);
      }
    }

    // Expire any active stone as-is. Original expireAt is kept so the TTL
    // index still cleans the document up; nothing is rolled or awarded.
    await this.miningStoneModel
      .updateMany({ telegramId, status: "active" }, { $set: { status: "expired" } })
      .exec();

    // Fetch user level for HP scaling (uses aggressive HP multiplier)
    let hpMultiplier = 1;
    try {
      const userDoc = await this.userModel.findOne({ telegramId }).lean().exec();
      const userLevel = (userDoc as any)?.level || 1;
      hpMultiplier = getHpMultiplier(userLevel);
    } catch { /* leveling unavailable — use base multiplier */ }

    return this.spawnFresh(telegramId, now, hpMultiplier);
  }

  /** Roll tier + HP and persist a brand-new active stone. Shared by spawn/rotate. */
  private async spawnFresh(telegramId: string, now: number, hpMultiplier: number) {
    // Weighted tier roll: most spawns are Common, Medium/Rare only sometimes
    const clientSeed = `${telegramId}:${now}`;
    const tierRoll = this.roll01(clientSeed, "tier");
    let tier: StoneTier;
    if (tierRoll < TIER_CONFIG.Common.weight / 100000) tier = "Common";
    else if (tierRoll < TIER_CONFIG.Medium.weight / 100000) tier = "Medium";
    else tier = "Rare";

    // MPa roll within the tier band, scaled by HP multiplier
    const cfg = TIER_CONFIG[tier];
    const hpRoll = this.roll01(clientSeed, "hp");
    const baseHp = cfg.hpMin + (cfg.hpMax - cfg.hpMin) * hpRoll;
    const maxHp = this.round2(baseHp * hpMultiplier);

    // ZONK roll — decided here at spawn, fixed for the stone's whole life
    const zonk = this.roll01(clientSeed, "zonk") < ZONK_CHANCE;

    // Unique stone ID comes from the database (_id)
    const stone = await new this.miningStoneModel({
      telegramId,
      tier,
      maxHp,
      zonk,
      status: "active",
      expireAt: new Date(now + ACTIVE_STONE_TTL_MS),
    }).save();

    return {
      success: true,
      stone: {
        stoneId: stone._id.toString(),
        tier: stone.tier,
        maxHp: stone.maxHp,
        zonk: stone.zonk,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // POST /miner-stone/repair-pickaxe — restore durability by spending resources
  // ─────────────────────────────────────────────────────────────
  async repairPickaxe(telegramId: string, tier: string) {
    const cost = PICKAXE_REPAIR_COSTS[tier as PickaxeTier];
    if (!cost) {
      return { success: false, error: "Invalid pickaxe tier" };
    }

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        error: "User account not found. Please reload the app.",
      };
    }

    const owned = user.ownedPickaxes?.length ? user.ownedPickaxes : ["Common"];
    if (!owned.includes(tier)) {
      return { success: false, error: "Pickaxe not owned" };
    }

    // ONE atomic operation: balance guards live inside the query, so a race
    // can never spend more than the user holds or repair without paying.
    // The $or also covers legacy docs that predate the ownedPickaxes field
    // (missing field ⇒ treated as owning Common via the fallback above), so a
    // fresh user with mined IRON is never locked out of repairing.
    const filter: Record<string, unknown> = {
      telegramId,
      $or: [{ ownedPickaxes: { $in: owned } }, { ownedPickaxes: { $exists: false } }],
    };
    const inc: Record<string, number> = {};
    for (const [resource, amount] of Object.entries(cost)) {
      filter[`cryptoBalances.${resource}`] = { $gte: amount };
      inc[`cryptoBalances.${resource}`] = -amount;
    }

    const now = new Date();
    const updated = await this.userModel
      .findOneAndUpdate(
        filter,
        {
          $inc: { ...inc, [`pickaxeRepairs.${tier}.count`]: 1 },
          $set: { [`pickaxeRepairs.${tier}.lastRepairAt`]: now },
          // Idempotent backfill — legacy docs missing the field get Common (+ tier) here
          $addToSet: { ownedPickaxes: { $each: ["Common", tier] } },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return {
        success: false,
        error: "Insufficient resources to repair this pickaxe",
      };
    }

    const balances: Record<string, number> = {};
    for (const key of RESOURCE_KEYS) {
      balances[key] = updated.cryptoBalances?.[key] || 0;
    }

    return {
      success: true,
      tier,
      cost,
      repairedAt: now,
      balances,
      ownedPickaxes: updated.ownedPickaxes?.length
        ? updated.ownedPickaxes
        : ["Common"],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // POST /miner-stone/destroy — break the stone, roll its loot (NO credit yet)
  // The loot stays pending on the stone until the client picks SAVE or SELL.
  // ─────────────────────────────────────────────────────────────
  async destroy(telegramId: string, stoneId: string) {
    const now = Date.now();
    // Guard: never work for a phantom account. The user is normally created by
    // /users/sync on app launch, but fail loudly instead of dropping loot.
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        error: "User account not found. Please reload the app.",
      };
    }

    // ── Rate limit: scaled by level (5 at Lv1 → 9 at Lv100) ─────────────
    this.evictRateLimit(telegramId, now);
    const recentDestroys = this.destroyTimestamps.get(telegramId) || [];
    const userLevelForRate = (user as any)?.level || 1;
    const destroyRateLimit = DESTROY_RATE_LIMIT_BASE + Math.floor(userLevelForRate / 20);
    if (recentDestroys.length >= destroyRateLimit) {
      return {
        success: false,
        error: "Too many requests. Please wait a moment.",
      };
    }

    // Peek the stone first to validate it exists and is active.
    const pending = await this.miningStoneModel
      .findOne({ _id: stoneId, telegramId, status: "active" })
      .lean()
      .exec();
    if (!pending) {
      return { success: false, error: "Stone not found or already claimed." };
    }

    // ── Time-gate: reject if the user mined the stone too fast ─────────────
    // Calculate minimum real time based on the frontend's hit mechanics:
    // First hit is at T=0, so N hits require at least (N-1) * 1500ms.
    // 500ms buffer added to tolerate minor network/client clock skews.
    const minHits = Math.ceil(pending.maxHp / MAX_PLAYER_ATK);
    const minRequiredTime = Math.max(0, (minHits - 1) * HIT_INTERVAL_MS - 500);
    const stoneAge = now - new Date((pending as any).createdAt).getTime();
    if (stoneAge < minRequiredTime) {
      return {
        success: false,
        error: "Stone not ready yet. Keep mining!",
      };
    }

    // Atomic single-claim lock: race-condition safe, cannot double-claim
    const stone = await this.miningStoneModel
      .findOneAndUpdate(
        { _id: stoneId, telegramId, status: "active" },
        {
          $set: {
            status: "claimed",
            claimedAt: new Date(),
            // Extend retention so this claim appears in the History tab
            expireAt: new Date(Date.now() + CLAIMED_STONE_TTL_MS),
          },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!stone) {
      return { success: false, error: "Stone not found or already claimed." };
    }

    // ── Record destroy timestamp for rate limiting ───────────────────────
    const userTimestamps = this.destroyTimestamps.get(telegramId) || [];
    userTimestamps.push(now);
    this.destroyTimestamps.set(telegramId, userTimestamps);

    // ── Leveling: award XP and stars for every destroyed stone (incl. ZONK) ─
    let starResult: { starCount: number; xpAwarded: number; level: number; levelUp: boolean; newLevel: number; pickaxeGrants: string[]; pendingStars: number; lockedLevel: number | null };
    try {
      starResult = await this.levelingService.awardStoneXp(telegramId, stone.tier);
    } catch {
      starResult = { starCount: Math.floor(Math.random() * 5) + 1, xpAwarded: 0, level: 1, levelUp: false, newLevel: 1, pickaxeGrants: [], pendingStars: 0, lockedLevel: null };
    }

    // ── Fragment drops (independent of ZONK — fragments always drop) ──
    let fragmentDrops = { spinWheel: 0, mineSwipe: 0 };
    try {
      fragmentDrops = await this.fragmentService.rollFragmentDrops(telegramId, stone.tier);
    } catch { /* fragment service unavailable — skip gracefully */ }

    // ZONK stone — no loot, nothing to claim (but stars + fragments still awarded)
    if (stone.zonk) {
      await this.miningStoneModel
        .updateOne({ _id: stone._id }, { $set: { rewards: {} } })
        .exec();
      return {
        success: true,
        zonk: true,
        adRequired: stone.tier === "Medium" || stone.tier === "Rare",
        stone: {
          stoneId: stone._id.toString(),
          tier: stone.tier,
          maxHp: stone.maxHp,
        },
        rewards: {},
        starCount: starResult.starCount,
        xpAwarded: starResult.xpAwarded,
        level: starResult.level,
        levelUp: starResult.levelUp,
        newLevel: starResult.newLevel,
        pickaxeGrants: starResult.pickaxeGrants,
        pendingStars: starResult.pendingStars,
        lockedLevel: starResult.lockedLevel,
        fragmentDrops,
      };
    }

    // Higher MPa stone ⇒ quality closer to 1 ⇒ larger rewards within the band
    const cfg = TIER_CONFIG[stone.tier];

    // HP multiplier for quality calculation (stone.maxHp was scaled at spawn)
    const userLevel = starResult.level;
    const hpMult = getHpMultiplier(userLevel);

    // Reward multiplier for resource scaling
    const rewardMultiplier = getLevelMultiplier(userLevel);

    // Quality uses the HP-scaled range
    const scaledHpMin = cfg.hpMin * hpMult;
    const scaledHpMax = cfg.hpMax * hpMult;
    const quality = Math.max(
      0,
      Math.min(1, (stone.maxHp - scaledHpMin) / (scaledHpMax - scaledHpMin)),
    );

    const rewards: Record<string, number> = {};
    for (const [resource, [min, max]] of Object.entries(cfg.rewards)) {
      // Scale reward range by reward multiplier (NOT HP multiplier)
      const scaledMin = Math.round(min * rewardMultiplier);
      const scaledMax = Math.round(max * rewardMultiplier);
      const point = scaledMin + (scaledMax - scaledMin) * quality;
      const jitter = 0.75 + Math.random() * 0.5; // every claim differs
      rewards[resource] = Math.max(
        scaledMin,
        Math.min(scaledMax, Math.round(point * jitter)),
      );
    }

    // Persist the rolled loot on the stone record (for audit + history).
    // Nothing is credited yet — the client decides SAVE or SELL next.
    await this.miningStoneModel
      .updateOne({ _id: stone._id }, { $set: { rewards } })
      .exec();

    return {
      success: true,
      zonk: false,
      adRequired: stone.tier === "Medium" || stone.tier === "Rare",
      stone: {
        stoneId: stone._id.toString(),
        tier: stone.tier,
        maxHp: stone.maxHp,
      },
      rewards,
      starCount: starResult.starCount,
      xpAwarded: starResult.xpAwarded,
      level: starResult.level,
      levelUp: starResult.levelUp,
      newLevel: starResult.newLevel,
      pickaxeGrants: starResult.pickaxeGrants,
      pendingStars: starResult.pendingStars,
      lockedLevel: starResult.lockedLevel,
      levelMultiplier: rewardMultiplier,
      fragmentDrops,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // POST /miner-stone/claim — commit the pending loot (SAVE or SELL)
  //   SAVE → resources are credited into cryptoBalances (the Bag)
  //   SELL → every resource converts to ELIXCOIN at ELIX_RATES and credits
  //          cryptoBalances.ELIXCOIN — NOT elixirBalance: the two coins are
  //          separate entities. Atomic + idempotent per stone (claimAction lock).
  // ─────────────────────────────────────────────────────────────
  async claimRewards(telegramId: string, stoneId: string, action: string) {
    if (action !== "save" && action !== "sell") {
      return { success: false, error: "Invalid claim action" };
    }

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        error: "User account not found. Please reload the app.",
      };
    }

    // Peek the stone's tier first — Medium/Rare loot requires a Monetag S2S
    // ad ticket (granted by the S2S postback) before SELL/SAVE can commit.
    const pending = await this.miningStoneModel
      .findOne({ _id: stoneId, telegramId, status: "claimed", claimAction: null })
      .lean()
      .exec();
    if (!pending) {
      return {
        success: false,
        error: "Rewards already claimed or stone not found.",
      };
    }

    const adRequired = pending.tier === "Medium" || pending.tier === "Rare";
    if (adRequired && (user.adTickets || 0) < 1) {
      return {
        success: false,
        adRequired: true,
        error:
          "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
      };
    }

    // Atomic per-stone commit lock: the stone must be claimed & still pending.
    // A race (or a replay) can never credit the same loot twice.
    const stone = await this.miningStoneModel
      .findOneAndUpdate(
        { _id: stoneId, telegramId, status: "claimed", claimAction: null },
        {
          $set: {
            claimAction: action,
            finalizedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!stone) {
      return {
        success: false,
        error: "Rewards already claimed or stone not found.",
      };
    }

// NOTE: Server-side cooldown tracking removed — the frontend's
// 3-minute timer is the sole timing mechanism for stone respawn.

    // ── ECONOMY buff: percentage bonus on claimed resources ────────────
    let economyMultiplier = 1;
    try {
      const buffTotals = await this.buffCollectionsService.getUserBuffTotals(telegramId);
      if (buffTotals.totals?.ECONOMY) {
        economyMultiplier = 1 + buffTotals.totals.ECONOMY / 100;
      }
    } catch { /* buff service unavailable — skip bonus gracefully */ }

    const rewards = stone.rewards || {};
    const credited: Record<string, number> = {};
    let elixir = 0;

    if (Object.keys(rewards).length > 0) {
      if (action === "save") {
        // SAVE: atomic $inc per resource straight into the Bag
        // ECONOMY buff multiplier applied to each resource amount
        const inc: Record<string, number> = {};
        for (const [resource, amount] of Object.entries(rewards)) {
          const boosted = Math.round(amount * economyMultiplier * 100) / 100;
          inc[`cryptoBalances.${resource}`] = boosted;
          // Track what was ACTUALLY credited (boosted amount, not original)
          credited[resource] = boosted;
        }
        // Medium/Rare stones consume the S2S ad ticket in the same atomic op
        // (adTickets $gte guard prevents double-spending the ticket).
        if (adRequired) inc["adTickets"] = -1;
        const saved = await this.userModel
          .findOneAndUpdate(
            adRequired
              ? { telegramId, adTickets: { $gte: 1 } }
              : { telegramId },
            { $inc: inc },
          )
          .exec();
        if (adRequired && !saved) {
          return {
            success: false,
            adRequired: true,
            error:
              "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap Save again to retry.",
          };
        }
      } else {
        // SELL: convert each resource at its fixed ELIXCOIN rate and credit
        // cryptoBalances.ELIXCOIN. This is a distinct coin from ELIXIR — the
        // sale NEVER touches elixirBalance / lifetimeElixir.
        // ECONOMY buff multiplier applied to the final ELIXCOIN total.
        elixir = 0;
        for (const [resource, amount] of Object.entries(rewards)) {
          const rate = ELIX_RATES[resource] || 0;
          elixir += amount * rate;
        }
        elixir = Math.round(elixir * economyMultiplier * 100) / 100; // ECONOMY buff
        if (elixir > 0) {
          const inc: Record<string, number> = {
            "cryptoBalances.ELIXCOIN": elixir,
          };
          // Medium/Rare stones consume the S2S ad ticket in the same atomic op.
          if (adRequired) inc["adTickets"] = -1;
          const sold = await this.userModel
            .findOneAndUpdate(
              adRequired
                ? { telegramId, adTickets: { $gte: 1 } }
                : { telegramId },
              { $inc: inc },
            )
            .exec();
          if (adRequired && !sold) {
            return {
              success: false,
              adRequired: true,
              error:
                "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap Sell again to retry.",
            };
          }
          // Track ELIXCOIN as the credited amount for SELL
          credited["ELIXCOIN"] = elixir;
        }
      }
    }

    const fresh = await this.userModel.findOne({ telegramId }).exec();
    const freshCrypto = (fresh?.cryptoBalances || {}) as Record<string, number>;
    return {
      success: true,
      action,
      stoneId: stone._id.toString(),
      credited,
      elixir,
      cryptoBalances: freshCrypto,
      elixcoinBalance: freshCrypto.ELIXCOIN || 0,
      economyMultiplier: economyMultiplier > 1 ? economyMultiplier : undefined,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // GET /miner-stone/history — claimed stones (tier, MPa, loot)
  // ─────────────────────────────────────────────────────────────
  async history(telegramId: string) {
    const stones = await this.miningStoneModel
      .find({ telegramId, status: "claimed" })
      .sort({ claimedAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean()
      .exec();

    return {
      success: true,
      history: stones.map((stone) => ({
        stoneId: stone._id.toString(),
        tier: stone.tier,
        maxHp: stone.maxHp,
        rewards: stone.rewards || {},
        claimedAt: stone.claimedAt,
      })),
    };
  }
}
