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

/**
 * Server-authoritative balance tables.
 *
 * Spawn probabilities (casino-style weighted RNG):
 *   Common ≈ 85% · Medium ≈ 12% · Rare ≈ 3%
 *
 * HP/MPa bands rolled at spawn:
 *   Common  30.00 – 80.00  MPa
 *   Medium  60.00 – 160.00 MPa
 *   Rare    90.00 – 360.00 MPa
 *
 * Reward bands (scaled by the stone's rolled MPa quality, randomized per claim):
 *   Common → IRON 500–10,000 · COPPER 250–5,000
 *   Medium → SILVER 100–2,000 · GOLD 5–10
 *   Rare   → GOLD 10–50 · DIAMOND 5–10
 */
interface TierConfig {
  hpMin: number;
  hpMax: number;
  weight: number; // cumulative weight out of 100,000
  rewards: Record<string, [number, number]>;
}

const TIER_CONFIG: Record<StoneTier, TierConfig> = {
  Common: {
    hpMin: 30,
    hpMax: 80,
    weight: 85000,
    rewards: {
      IRON: [500, 10000],
      COPPER: [250, 5000],
    },
  },
  Medium: {
    hpMin: 60,
    hpMax: 160,
    weight: 97000,
    rewards: {
      SILVER: [100, 2000],
      GOLD: [5, 10],
    },
  },
  Rare: {
    hpMin: 90,
    hpMax: 360,
    weight: 100000,
    rewards: {
      GOLD: [10, 50],
      DIAMOND: [5, 10],
    },
  },
};

const SPAWN_THROTTLE_MS = 800;
const ACTIVE_STONE_TTL_MS = 2 * 60 * 60 * 1000; // 2h — unclaimed stones auto-expire
const CLAIMED_STONE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d — claimed stones power the History tab
const HISTORY_LIMIT = 50;

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
  IRON: 0.00005,
  COPPER: 0.000075,
  SILVER: 0.1,
  GOLD: 1,
  DIAMOND: 20,
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

export const PICKAXE_COSTS: Record<
  Exclude<PickaxeTier, "Common">,
  { GOLD: number; DIAMOND: number }
> = {
  Uncommon: { GOLD: 1000, DIAMOND: 10 },
  Rare: { GOLD: 5000, DIAMOND: 50 },
  Epic: { GOLD: 20000, DIAMOND: 200 },
  Legendary: { GOLD: 100000, DIAMOND: 1000 },
  Mythic: { GOLD: 500000, DIAMOND: 5000 },
};

const PICKAXE_PREV: Record<Exclude<PickaxeTier, "Common">, PickaxeTier> = {
  Uncommon: "Common",
  Rare: "Uncommon",
  Epic: "Rare",
  Legendary: "Epic",
  Mythic: "Legendary",
};

// Repair costs — each tier is mended with the resources its stones drop:
//   Common → IRON · Uncommon → SILVER · Rare+ → GOLD (Mythic also needs DIAMOND)
// Server-authoritative; the frontend only mirrors this for display.
const PICKAXE_REPAIR_COSTS: Record<PickaxeTier, Record<string, number>> = {
  Common: { IRON: 1000 },
  Uncommon: { SILVER: 800 },
  Rare: { GOLD: 150 },
  Epic: { GOLD: 500 },
  Legendary: { GOLD: 2000 },
  Mythic: { GOLD: 5000, DIAMOND: 50 },
};

// The 5 mining resources (used to shape the balance payload returned to clients)
const RESOURCE_KEYS = ["IRON", "COPPER", "SILVER", "GOLD", "DIAMOND"];

@Injectable()
export class MinerStoneService {
  private readonly logger = new Logger(MinerStoneService.name);

  // Lightweight in-memory spawn throttle: telegramId -> last spawn timestamp.
  // Bounded memory: entries are purged lazily once stale / map grows too large.
  private readonly lastSpawnAt = new Map<string, number>();

  constructor(
    @InjectModel(MiningStone.name)
    private miningStoneModel: Model<MiningStoneDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
  ) { }

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

    // Weighted tier roll: most spawns are Common, Medium/Rare only sometimes
    const clientSeed = `${telegramId}:${now}`;
    const tierRoll = this.roll01(clientSeed, "tier");
    let tier: StoneTier;
    if (tierRoll < TIER_CONFIG.Common.weight / 100000) tier = "Common";
    else if (tierRoll < TIER_CONFIG.Medium.weight / 100000) tier = "Medium";
    else tier = "Rare";

    // MPa roll within the tier band
    const cfg = TIER_CONFIG[tier];
    const hpRoll = this.roll01(clientSeed, "hp");
    const maxHp = this.round2(cfg.hpMin + (cfg.hpMax - cfg.hpMin) * hpRoll);

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
  // POST /miner-stone/purchase-pickaxe — unlock the next pickaxe tier
  // ─────────────────────────────────────────────────────────────
  async purchasePickaxe(telegramId: string, tier: string) {
    const cost = PICKAXE_COSTS[tier as Exclude<PickaxeTier, "Common">];
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
    if (owned.includes(tier)) {
      return { success: false, error: "Pickaxe already owned" };
    }

    // Strict unlock chain: Rare requires Uncommon, Epic requires Rare, etc.
    const prev = PICKAXE_PREV[tier as Exclude<PickaxeTier, "Common">];
    if (!owned.includes(prev)) {
      return {
        success: false,
        error: `Unlock ${prev} pickaxe first`,
      };
    }

    // ONE atomic operation: deduct GOLD + DIAMOND and grant ownership.
    // Balance guards live inside the query, so a race can never double-spend
    // or grant the pickaxe without paying (findOneAndUpdate is atomic).
    const updated = await this.userModel
      .findOneAndUpdate(
        {
          telegramId,
          ownedPickaxes: { $nin: [tier] },
          "cryptoBalances.GOLD": { $gte: cost.GOLD },
          "cryptoBalances.DIAMOND": { $gte: cost.DIAMOND },
        },
        {
          $inc: {
            "cryptoBalances.GOLD": -cost.GOLD,
            "cryptoBalances.DIAMOND": -cost.DIAMOND,
          },
          // Idempotent: new users already have Common; legacy docs missing the
          // field get it backfilled here so ownership is never truncated.
          $addToSet: { ownedPickaxes: { $each: ["Common", tier] } },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return {
        success: false,
        error: "Insufficient Gold/Diamond or pickaxe already owned",
      };
    }

    return {
      success: true,
      tier,
      ownedPickaxes: updated.ownedPickaxes?.length
        ? updated.ownedPickaxes
        : ["Common", tier],
      balances: {
        GOLD: updated.cryptoBalances?.GOLD || 0,
        DIAMOND: updated.cryptoBalances?.DIAMOND || 0,
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
    const filter: Record<string, any> = {
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
    // Guard: never work for a phantom account. The user is normally created by
    // /users/sync on app launch, but fail loudly instead of dropping loot.
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        error: "User account not found. Please reload the app.",
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

    // ZONK stone — no loot, nothing to claim
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
      };
    }

    // Higher MPa stone ⇒ quality closer to 1 ⇒ larger rewards within the band
    const cfg = TIER_CONFIG[stone.tier];
    const quality = Math.max(
      0,
      Math.min(1, (stone.maxHp - cfg.hpMin) / (cfg.hpMax - cfg.hpMin)),
    );

    const rewards: Record<string, number> = {};
    for (const [resource, [min, max]] of Object.entries(cfg.rewards)) {
      const point = min + (max - min) * quality;
      const jitter = 0.75 + Math.random() * 0.5; // every claim differs
      rewards[resource] = Math.max(
        min,
        Math.min(max, Math.round(point * jitter)),
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

    const rewards = stone.rewards || {};
    const credited: Record<string, number> = {};
    let elixir = 0;

    if (Object.keys(rewards).length > 0) {
      if (action === "save") {
        // SAVE: atomic $inc per resource straight into the Bag
        const inc: Record<string, number> = {};
        for (const [resource, amount] of Object.entries(rewards)) {
          inc[`cryptoBalances.${resource}`] = amount;
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
        Object.assign(credited, rewards);
      } else {
        // SELL: convert each resource at its fixed ELIXCOIN rate and credit
        // cryptoBalances.ELIXCOIN. This is a distinct coin from ELIXIR — the
        // sale NEVER touches elixirBalance / lifetimeElixir.
        elixir = 0;
        for (const [resource, amount] of Object.entries(rewards)) {
          const rate = ELIX_RATES[resource] || 0;
          elixir += amount * rate;
        }
        elixir = Math.round(elixir * 100) / 100; // 2 decimals, no float dust
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
