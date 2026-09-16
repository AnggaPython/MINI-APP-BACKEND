import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { User, UserDocument } from "../users/schemas/user.schema";
import {
  MineSwipeSession,
  MineSwipeSessionDocument,
} from "./schemas/mine-swipe-session.schema";

type UserWithFragments = User & {
  goldBalance?: { spinWheels: number; mineSwipe: number };
  spinWheelFragments?: number;
  mineSwipeFragments?: number;
  level?: number;
};

// ── Fragment drop configuration ───────────────────────────────────────────
// When a stone is destroyed, each fragment type has an independent chance to drop.
// Higher tier stones have higher drop rates.
interface FragmentDropConfig {
  spinWheel: number; // probability 0-1
  mineSwipe: number; // probability 0-1
}

const FRAGMENT_DROP_RATES: Record<string, FragmentDropConfig> = {
  Common: { spinWheel: 0.40, mineSwipe: 0.35 }, // 40% / 35%
  Medium: { spinWheel: 0.60, mineSwipe: 0.55 }, // 60% / 55%
  Rare:   { spinWheel: 0.80, mineSwipe: 0.75 }, // 80% / 75%
};

// How many fragments drop per successful roll (1-5 random)
const FRAGMENT_DROP_MIN = 1;
const FRAGMENT_DROP_MAX = 5;

function randomDropAmount(): number {
  return FRAGMENT_DROP_MIN + Math.floor(Math.random() * (FRAGMENT_DROP_MAX - FRAGMENT_DROP_MIN + 1));
}

// ── Spin Wheel configuration ──────────────────────────────────────────────
const SPIN_WHEEL_COST = 50; // fragments required per spin

export interface SpinWheelReward {
  type: string;        // reward asset ("GOLD") or "NOPE"
  amount: number;
  label: string;       // display name
  color: string;       // UI color
}

// Weighted reward table (cumulative weights out of 1000).
// GOLD-only, 3 tiers: 5 GOLD 60% / 10 GOLD 30% / 50 GOLD 10%.
// NOTE: the frontend wheel shows extra display-only segments
// (NOPE, 250, 500, 1000, 5000 GOLD) as visual sweeteners —
// the pointer can never land on them because every amount the
// server returns (5/10/50) matches a real segment.
const SPIN_WHEEL_REWARDS: Array<{ weight: number; reward: SpinWheelReward }> = [
  { weight: 600,  reward: { type: "GOLD", amount: 5,  label: "5 GOLD",  color: "#3b4a5c" } },
  { weight: 900,  reward: { type: "GOLD", amount: 10, label: "10 GOLD", color: "#3a4a5a" } },
  { weight: 1000, reward: { type: "GOLD", amount: 50, label: "50 GOLD", color: "#405060" } },
];

// ── Mine Swipe configuration ──────────────────────────────────────────────
const MINE_SWIPE_COST = 50; // fragments required per game
const MINE_SWIPE_BOARD_SIZE = 5; // 5×5 grid
const MINE_SWIPE_MINE_COUNT = 5; // 5 mines in 25 tiles = 80% safe
const MINE_SWIPE_BASE_REWARD_PER_TILE = 2; // base GOLD per safe tile
const MINE_SWIPE_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── Helper: server-side HMAC RNG 0-1 (not externally verifiable — no commit-reveal) ──
function roll01(purpose: string): number {
  const serverSeed = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHmac("sha256", serverSeed)
    .update(purpose)
    .digest("hex");
  return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
}

@Injectable()
  // @ts-ignore - super strict cleanup pending
export class FragmentService {
  // @ts-ignore - super strict pending
  private readonly logger = new Logger(FragmentService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(MineSwipeSession.name)
    private mineSwipeModel: Model<MineSwipeSessionDocument>,
  ) {}

  // ───────────────────────────────────────────────────────────────────────
  // BALANCE
  // ───────────────────────────────────────────────────────────────────────

  /** Get fragment balances + holding balances for a user. */
  async getBalance(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    const goldBal = (user as unknown as UserWithFragments).goldBalance || { spinWheels: 0, mineSwipe: 0 };

    return {
      success: true,
      spinWheel: (user as unknown as UserWithFragments).spinWheelFragments || 0,
      mineSwipe: (user as unknown as UserWithFragments).mineSwipeFragments || 0,
      holdingBalance: {
        spinWheels: goldBal.spinWheels || 0,  // GOLD from spin wheel
        mineSwipe: goldBal.mineSwipe || 0,     // GOLD from mine swipe
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // FRAGMENT DROPS (called from miner-stone destroy)
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Roll fragment drops when a stone is destroyed.
   * Called by MinerStoneService.destroy() after loot is computed.
   *
   * Each fragment type rolls independently:
   *   - Spin Wheel: chance based on tier → 1-5 fragments if hit
   *   - Mine Swipe: chance based on tier → 1-5 fragments if hit
   *   - Both can drop simultaneously (e.g. 3 spin + 2 mine = 5 total)
   *   - At least ONE type always drops (guarantee)
   */
  async rollFragmentDrops(
    telegramId: string,
    stoneTier: string,
  ): Promise<{ spinWheel: number; mineSwipe: number }> {
    const rates = FRAGMENT_DROP_RATES[stoneTier] || FRAGMENT_DROP_RATES.Common;
    const now = Date.now();

    let spinDropped = roll01(`frag-spin-${telegramId}-${now}`) < rates.spinWheel;
    let mineDropped = roll01(`frag-mine-${telegramId}-${now}`) < rates.mineSwipe;

    // GUARANTEE: at least one type drops
    if (!spinDropped && !mineDropped) {
      if (rates.spinWheel >= rates.mineSwipe) {
        spinDropped = true;
      } else {
        mineDropped = true;
      }
    }

    // Each type that hits gets 1-5 random fragments
    const drops = {
      spinWheel: spinDropped ? randomDropAmount() : 0,
      mineSwipe: mineDropped ? randomDropAmount() : 0,
    };

    // Atomically increment fragment counts
    const inc: Record<string, number> = {};
    if (drops.spinWheel > 0) inc.spinWheelFragments = drops.spinWheel;
    if (drops.mineSwipe > 0) inc.mineSwipeFragments = drops.mineSwipe;

    if (Object.keys(inc).length > 0) {
      await this.userModel.findOneAndUpdate({ telegramId }, { $inc: inc }).exec();
    }

    return drops;
  }

  // ───────────────────────────────────────────────────────────────────────
  // SPIN WHEEL
  // ───────────────────────────────────────────────────────────────────────

  /** Play the Spin Wheel: deduct 50 fragments, roll reward, credit resources. */
  async spinWheel(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    const fragments = (user as unknown as UserWithFragments).spinWheelFragments || 0;
    if (fragments < SPIN_WHEEL_COST) {
      return {
        success: false,
        error: `Need ${SPIN_WHEEL_COST} Spin Wheel fragments (have ${fragments})`,
      };
    }

    // Roll reward
    const roll = roll01(`spin-${telegramId}-${Date.now()}`) * 1000;
    let selected = SPIN_WHEEL_REWARDS[0].reward;
    for (const entry of SPIN_WHEEL_REWARDS) {
      if (roll < entry.weight) {
        selected = entry.reward;
        break;
      }
    }

    // Atomic: deduct fragments + credit reward into HOLDING balance
    // User must "claim" to transfer to cryptoBalances
    const inc: Record<string, number> = {
      spinWheelFragments: -SPIN_WHEEL_COST,
    };

    if (selected.amount > 0) {
      // GOLD-only → holding balance (spinWheels slot), claimed to cryptoBalances.GOLD
      inc["goldBalance.spinWheels"] = selected.amount;
    }

    const updated = await this.userModel
      .findOneAndUpdate(
        { telegramId, spinWheelFragments: { $gte: SPIN_WHEEL_COST } },
        { $inc: inc },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return { success: false, error: "Insufficient fragments (race condition)" };
    }

    const goldBal = (updated.goldBalance || { spinWheels: 0, mineSwipe: 0 }) as { spinWheels: number; mineSwipe: number };

    return {
      success: true,
      reward: selected,
      fragmentsRemaining: updated.spinWheelFragments || 0,
      holdingBalance: {
        spinWheels: goldBal.spinWheels || 0,
        mineSwipe: goldBal.mineSwipe || 0,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // MINE SWIPE
  // ───────────────────────────────────────────────────────────────────────

  /** Start a new Mine Swipe game: deduct 100 fragments, generate board. */
  async mineSwipeStart(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    const fragments = (user as unknown as UserWithFragments).mineSwipeFragments || 0;
    if (fragments < MINE_SWIPE_COST) {
      return {
        success: false,
        error: `Need ${MINE_SWIPE_COST} Mine Swipe fragments (have ${fragments})`,
      };
    }

    // Check if user already has an active session
    const existing = await this.mineSwipeModel
      .findOne({ telegramId, status: "active" })
      .lean()
      .exec();
    if (existing) {
      return {
        success: false,
        error: "You already have an active Mine Swipe game. Finish it first!",
      };
    }

    // Generate mine positions (server-authoritative, hidden from client)
    const totalTiles = MINE_SWIPE_BOARD_SIZE * MINE_SWIPE_BOARD_SIZE;
    const minePositions = new Set<string>();
    while (minePositions.size < MINE_SWIPE_MINE_COUNT) {
      const pos = Math.floor(Math.random() * totalTiles);
      const row = Math.floor(pos / MINE_SWIPE_BOARD_SIZE);
      const col = pos % MINE_SWIPE_BOARD_SIZE;
      minePositions.add(`${row},${col}`);
    }

    // Determine reward per tile based on user level (higher level = more reward)
    const userLevel = (user as unknown as UserWithFragments).level || 1;
    const levelBonus = 1 + (userLevel - 1) * 0.02; // +2% per level
    const rewardPerTile = Math.round(MINE_SWIPE_BASE_REWARD_PER_TILE * levelBonus * 100) / 100;

    // ── Charge first, then create the board ─────────────────────────────────
    // The debit result was previously discarded and it ran AFTER the session was
    // persisted, so any interleaving in which the guarded debit matched nothing
    // left a board that was never paid for. The charge is now the guard: no debit,
    // no board.
    const charged = await this.userModel
      .findOneAndUpdate(
        { telegramId, mineSwipeFragments: { $gte: MINE_SWIPE_COST } },
        { $inc: { mineSwipeFragments: -MINE_SWIPE_COST } },
        { returnDocument: "after" },
      )
      .exec();

    if (!charged) {
      return {
        success: false,
        error: `Need ${MINE_SWIPE_COST} Mine Swipe fragments (balance changed, try again)`,
      };
    }

    const now = Date.now();
    let session: MineSwipeSessionDocument;
    try {
      session = await new this.mineSwipeModel({
        telegramId,
        boardSize: MINE_SWIPE_BOARD_SIZE,
        mineCount: MINE_SWIPE_MINE_COUNT,
        mines: Array.from(minePositions),
        revealed: [],
        status: "active",
        accumulatedReward: 0,
        rewardPerTile,
        expireAt: new Date(now + MINE_SWIPE_SESSION_TTL_MS),
      }).save();
    } catch (err) {
      // Board could not be created: refund the entry fee so the player is not
      // charged for a game that does not exist.
      await this.userModel
        .findOneAndUpdate(
          { telegramId },
          { $inc: { mineSwipeFragments: MINE_SWIPE_COST } },
        )
        .exec();
      throw err;
    }

    return {
      success: true,
      sessionId: session._id.toString(),
      boardSize: MINE_SWIPE_BOARD_SIZE,
      mineCount: MINE_SWIPE_MINE_COUNT,
      rewardPerTile,
      fragmentsRemaining: fragments - MINE_SWIPE_COST,
      // Do NOT send mine positions to client!
    };
  }

  /** Reveal a tile in Mine Swipe. Returns safe/mine + accumulated reward. */
  async mineSwipeReveal(telegramId: string, sessionId: string, row: number, col: number) {
    const session = await this.mineSwipeModel
      .findOne({ _id: sessionId, telegramId, status: "active" })
      .exec();

    if (!session) {
      return { success: false, error: "Session not found or already finished" };
    }

    const pos = `${row},${col}`;

    // Check if already revealed
    if (session.revealed.includes(pos)) {
      return { success: false, error: "Tile already revealed" };
    }

    // Check bounds
    if (row < 0 || row >= session.boardSize || col < 0 || col >= session.boardSize) {
      return { success: false, error: "Invalid position" };
    }

    // Check if it's a mine
    if (session.mines.includes(pos)) {
      // GAME OVER — hit a mine
      session.status = "lost";
      session.accumulatedReward = 0;
      // Conditional write: a claim that landed while this reveal was in flight
      // must not be overwritten back to an active state.
      const written = await this.mineSwipeModel
        .findOneAndUpdate(
          { _id: session._id, telegramId, status: "active" },
          {
            $set: {
              status: "lost",
              accumulatedReward: 0,
              revealed: session.revealed,
            },
          },
          { returnDocument: "after" },
        )
        .exec();
      if (!written) {
        return { success: false, error: "Session not found or already finished" };
      }

      return {
        success: true,
        hitMine: true,
        gameOver: true,
        accumulatedReward: 0,
        minePositions: session.mines, // reveal all mines on game over
        revealed: session.revealed,
      };
    }

    // Safe tile — add to revealed, increase reward
    session.revealed.push(pos);
    session.accumulatedReward = Math.round(
      session.revealed.length * session.rewardPerTile * 100,
    ) / 100;

    // Check if all safe tiles are revealed (auto-win)
    const totalSafe = session.boardSize * session.boardSize - session.mineCount;
    if (session.revealed.length >= totalSafe) {
      // Full-board win — auto-credit holding immediately so the reward
      // can't be lost if the client never calls claim afterwards.
      // Status goes straight to "claimed" to prevent double-credit.
      const winReward = session.accumulatedReward;
      session.status = "claimed";
      session.finalReward = winReward;
      // Conditional write, and the credit below only runs if THIS request is the
      // one that completed the board (otherwise a concurrent claim already paid).
      const completed = await this.mineSwipeModel
        .findOneAndUpdate(
          { _id: session._id, telegramId, status: "active" },
          {
            $set: {
              status: "claimed",
              finalReward: winReward,
              revealed: session.revealed,
              accumulatedReward: winReward,
            },
          },
          { returnDocument: "after" },
        )
        .exec();
      if (!completed) {
        return { success: false, error: "Session not found or already finished" };
      }

      if (winReward > 0) {
        await this.userModel
          .findOneAndUpdate(
            { telegramId },
            { $inc: { "goldBalance.mineSwipe": winReward } },
          )
          .exec();
      }

      const winUser = await this.userModel.findOne({ telegramId }).lean().exec();
      const winGoldBal = ((winUser as unknown as UserWithFragments)?.goldBalance || { spinWheels: 0, mineSwipe: 0 }) as { spinWheels: number; mineSwipe: number };

      return {
        success: true,
        hitMine: false,
        gameOver: true,
        won: true,
        accumulatedReward: winReward,
        revealed: session.revealed,
        holdingBalance: {
          spinWheels: winGoldBal.spinWheels || 0,
          mineSwipe: winGoldBal.mineSwipe || 0,
        },
      };
    }

    // Conditional write: never resurrect a session that a claim already settled.
    const written = await this.mineSwipeModel
      .findOneAndUpdate(
        { _id: session._id, telegramId, status: "active" },
        {
          $set: {
            revealed: session.revealed,
            accumulatedReward: session.accumulatedReward,
          },
        },
        { returnDocument: "after" },
      )
      .exec();
    if (!written) {
      return { success: false, error: "Session not found or already finished" };
    }

    return {
      success: true,
      hitMine: false,
      gameOver: false,
      accumulatedReward: session.accumulatedReward,
      tilesRevealed: session.revealed.length,
      tilesRemaining: totalSafe - session.revealed.length,
    };
  }

  /** Cash out accumulated reward from Mine Swipe. */
  async mineSwipeClaim(telegramId: string, sessionId: string) {
    // Read first only to give precise errors; the money decision is the atomic
    // claim below.
    const pre = await this.mineSwipeModel
      .findOne({ _id: sessionId, telegramId, status: { $in: ["active", "won"] } })
      .lean()
      .exec();

    if (!pre) {
      return { success: false, error: "Session not found or already claimed" };
    }

    if (!pre.revealed || pre.revealed.length === 0) {
      return { success: false, error: "No tiles revealed yet" };
    }

    // ── Atomic claim ────────────────────────────────────────────────────────
    // Only the request that flips the session out of active/won may credit.
    // findOne + save() let N parallel claims all credit (measured: 3 parallel
    // claims credited 6 GOLD for a session whose fair value was 2).
    const session = await this.mineSwipeModel
      .findOneAndUpdate(
        { _id: sessionId, telegramId, status: { $in: ["active", "won"] } },
        { $set: { status: "claimed", claimedAt: new Date() } },
        { returnDocument: "after" },
      )
      .exec();

    if (!session) {
      return { success: false, error: "Session not found or already claimed" };
    }

    const reward = session.accumulatedReward;
    session.finalReward = reward;
    await this.mineSwipeModel
      .updateOne(
        { _id: session._id, status: "claimed" },
        { $set: { finalReward: reward } },
      )
      .exec();

    // Credit GOLD into HOLDING balance (mineSwipe slot)
    if (reward > 0) {
      await this.userModel
        .findOneAndUpdate(
          { telegramId },
          { $inc: { "goldBalance.mineSwipe": reward } },
        )
        .exec();
    }

    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    const goldBal = (user?.goldBalance || { spinWheels: 0, mineSwipe: 0 }) as { spinWheels: number; mineSwipe: number };

    return {
      success: true,
      reward,
      tilesRevealed: session.revealed.length,
      holdingBalance: {
        spinWheels: goldBal.spinWheels || 0,
        mineSwipe: goldBal.mineSwipe || 0,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // CLAIM HOLDING BALANCES → transfer to cryptoBalances
  // ───────────────────────────────────────────────────────────────────────

  /** Claim spin wheel holding balance → transfers GOLD to cryptoBalances.
   *  Gated by Monetag S2S ad ticket: Claim button shows a rewarded ad first,
   *  the S2S postback grants the ticket, this endpoint consumes it atomically. */
  async claimSpinWheelBalance(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    // S2S Anti-Cheat Verification Lock (matches faucet/case-box pattern)
    if (((user as unknown as UserWithFragments).adTickets ?? 0) < 1) {
      return {
        success: false,
        error:
          "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
      };
    }

    const goldBal = (user as unknown as UserWithFragments).goldBalance || { spinWheels: 0, mineSwipe: 0 };
    const amount = goldBal.spinWheels || 0;
    if (amount <= 0) {
      return { success: false, error: "No GOLD to claim from Spin Wheel" };
    }

    // Atomic: zero out holding + credit cryptoBalances.GOLD + consume 1 ad ticket
    const updated = await this.userModel
      .findOneAndUpdate(
        { telegramId, "goldBalance.spinWheels": { $gt: 0 }, adTickets: { $gte: 1 } },
        {
          $inc: {
            "goldBalance.spinWheels": -amount,
            "cryptoBalances.GOLD": amount,
            adTickets: -1,
          },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return { success: false, error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap to claim again." };
    }

    const crypto = (updated.cryptoBalances || {}) as Record<string, number>;
    const goldBal2 = (updated.goldBalance || { spinWheels: 0, mineSwipe: 0 }) as { spinWheels: number; mineSwipe: number };

    return {
      success: true,
      claimed: amount,
      holdingBalance: { spinWheels: goldBal2.spinWheels || 0, mineSwipe: goldBal2.mineSwipe || 0 },
      cryptoBalances: crypto,
    };
  }

  /** Claim mine swipe holding balance → transfers GOLD to cryptoBalances.
   *  Gated by Monetag S2S ad ticket: Claim button shows a rewarded ad first,
   *  the S2S postback grants the ticket, this endpoint consumes it atomically. */
  async claimMineSwipeBalance(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    // S2S Anti-Cheat Verification Lock (matches faucet/case-box pattern)
    if (((user as unknown as UserWithFragments).adTickets ?? 0) < 1) {
      return {
        success: false,
        error:
          "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
      };
    }

    const goldBal = (user as unknown as UserWithFragments).goldBalance || { spinWheels: 0, mineSwipe: 0 };
    const amount = goldBal.mineSwipe || 0;
    if (amount <= 0) {
      return { success: false, error: "No GOLD to claim from Mine Swipe" };
    }

    // Atomic: zero out holding + credit cryptoBalances.GOLD + consume 1 ad ticket
    const updated = await this.userModel
      .findOneAndUpdate(
        { telegramId, "goldBalance.mineSwipe": { $gt: 0 }, adTickets: { $gte: 1 } },
        {
          $inc: {
            "goldBalance.mineSwipe": -amount,
            "cryptoBalances.GOLD": amount,
            adTickets: -1,
          },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return { success: false, error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap to claim again." };
    }

    const crypto = (updated.cryptoBalances || {}) as Record<string, number>;
    const goldBal2 = (updated.goldBalance || { spinWheels: 0, mineSwipe: 0 }) as { spinWheels: number; mineSwipe: number };

    return {
      success: true,
      claimed: amount,
      holdingBalance: { spinWheels: goldBal2.spinWheels || 0, mineSwipe: goldBal2.mineSwipe || 0 },
      cryptoBalances: crypto,
    };
  }

  /** Get current Mine Swipe session state (for reconnecting). */
  async mineSwipeStatus(telegramId: string) {
    const session = await this.mineSwipeModel
      .findOne({ telegramId, status: { $in: ["active", "won"] } })
      .lean()
      .exec();

    if (!session) {
      return { success: true, active: false };
    }

    return {
      success: true,
      active: session.status === "active",
      sessionId: session._id.toString(),
      boardSize: session.boardSize,
      mineCount: session.mineCount,
      revealed: session.revealed,
      accumulatedReward: session.accumulatedReward,
      rewardPerTile: session.rewardPerTile,
      status: session.status,
    };
  }
}
