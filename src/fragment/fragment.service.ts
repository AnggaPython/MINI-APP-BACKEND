import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { User, UserDocument } from "../users/schemas/user.schema";
import {
  MineSwipeSession,
  MineSwipeSessionDocument,
} from "./schemas/mine-swipe-session.schema";

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
  type: string;        // resource name or "ELIXCOIN"
  amount: number;
  label: string;       // display name
  color: string;       // UI color
}

// Weighted reward table (cumulative weights out of 1000)
const SPIN_WHEEL_REWARDS: Array<{ weight: number; reward: SpinWheelReward }> = [
  { weight: 300,  reward: { type: "IRON",      amount: 50,   label: "Iron",        color: "#b0b7c3" } },
  { weight: 550,  reward: { type: "COPPER",    amount: 30,   label: "Copper",      color: "#f97316" } },
  { weight: 700,  reward: { type: "SILVER",    amount: 10,   label: "Silver",      color: "#d8dee9" } },
  { weight: 820,  reward: { type: "GOLD",      amount: 3,    label: "Gold",        color: "#facc15" } },
  { weight: 900,  reward: { type: "DIAMOND",   amount: 1,    label: "Diamond",     color: "#22d3ee" } },
  { weight: 950,  reward: { type: "ELIXCOIN",  amount: 10,   label: "ElixCoin",    color: "#a78bfa" } },
  { weight: 980,  reward: { type: "ELIXCOIN",  amount: 50,   label: "ElixCoin",    color: "#a78bfa" } },
  { weight: 995,  reward: { type: "GOLD",      amount: 10,   label: "Gold ×10",    color: "#facc15" } },
  { weight: 1000, reward: { type: "DIAMOND",   amount: 5,    label: "Diamond ×5",  color: "#22d3ee" } },
];

// ── Mine Swipe configuration ──────────────────────────────────────────────
const MINE_SWIPE_COST = 50; // fragments required per game
const MINE_SWIPE_BOARD_SIZE = 5; // 5×5 grid
const MINE_SWIPE_MINE_COUNT = 5; // 5 mines in 25 tiles = 80% safe
const MINE_SWIPE_BASE_REWARD_PER_TILE = 2; // base ELIXCOIN per safe tile
const MINE_SWIPE_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── Helper: provably-fair RNG 0-1 ────────────────────────────────────────
function roll01(purpose: string): number {
  const serverSeed = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHmac("sha256", serverSeed)
    .update(purpose)
    .digest("hex");
  return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
}

@Injectable()
export class FragmentService {
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

    const goldBal = (user as any).goldBalance || { spinWheels: 0, mineSwipe: 0 };

    return {
      success: true,
      spinWheel: (user as any).spinWheelFragments || 0,
      mineSwipe: (user as any).mineSwipeFragments || 0,
      holdingBalance: {
        spinWheels: goldBal.spinWheels || 0,  // GOLD from spin wheel
        mineSwipe: goldBal.mineSwipe || 0,     // ELIXCOIN from mine swipe
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

  /** Play the Spin Wheel: deduct 100 fragments, roll reward, credit resources. */
  async spinWheel(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    const fragments = (user as any).spinWheelFragments || 0;
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

    if (selected.type === "ELIXCOIN") {
      // ELIXCOIN from spin → holding balance (mineSwipe slot used generically)
      inc["goldBalance.mineSwipe"] = selected.amount;
    } else {
      // GOLD / resources from spin → holding balance (spinWheels slot)
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

    const fragments = (user as any).mineSwipeFragments || 0;
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
    const userLevel = (user as any).level || 1;
    const levelBonus = 1 + (userLevel - 1) * 0.02; // +2% per level
    const rewardPerTile = Math.round(MINE_SWIPE_BASE_REWARD_PER_TILE * levelBonus * 100) / 100;

    // Atomic: deduct fragments + create session
    const now = Date.now();
    const session = await new this.mineSwipeModel({
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

    // Deduct fragments
    await this.userModel
      .findOneAndUpdate(
        { telegramId, mineSwipeFragments: { $gte: MINE_SWIPE_COST } },
        { $inc: { mineSwipeFragments: -MINE_SWIPE_COST } },
      )
      .exec();

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
      await session.save();

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
      session.status = "won";
      session.finalReward = session.accumulatedReward;
      await session.save();

      return {
        success: true,
        hitMine: false,
        gameOver: true,
        won: true,
        accumulatedReward: session.accumulatedReward,
        revealed: session.revealed,
      };
    }

    await session.save();

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
    const session = await this.mineSwipeModel
      .findOne({ _id: sessionId, telegramId, status: { $in: ["active", "won"] } })
      .exec();

    if (!session) {
      return { success: false, error: "Session not found or already claimed" };
    }

    if (session.revealed.length === 0) {
      return { success: false, error: "No tiles revealed yet" };
    }

    const reward = session.status === "won"
      ? session.accumulatedReward
      : session.accumulatedReward;

    // Mark as claimed
    session.status = "claimed";
    session.finalReward = reward;
    await session.save();

    // Credit ELIXCOIN into HOLDING balance (mineSwipe slot)
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

  /** Claim spin wheel holding balance → transfers GOLD to cryptoBalances. */
  async claimSpinWheelBalance(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    const goldBal = (user as any).goldBalance || { spinWheels: 0, mineSwipe: 0 };
    const amount = goldBal.spinWheels || 0;
    if (amount <= 0) {
      return { success: false, error: "No GOLD to claim from Spin Wheel" };
    }

    // Atomic: zero out holding + credit cryptoBalances.GOLD
    const updated = await this.userModel
      .findOneAndUpdate(
        { telegramId, "goldBalance.spinWheels": { $gt: 0 } },
        {
          $inc: {
            "goldBalance.spinWheels": -amount,
            "cryptoBalances.GOLD": amount,
          },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return { success: false, error: "Nothing to claim" };
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

  /** Claim mine swipe holding balance → transfers ELIXCOIN to cryptoBalances. */
  async claimMineSwipeBalance(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId }).lean().exec();
    if (!user) return { success: false, error: "User not found" };

    const goldBal = (user as any).goldBalance || { spinWheels: 0, mineSwipe: 0 };
    const amount = goldBal.mineSwipe || 0;
    if (amount <= 0) {
      return { success: false, error: "No ELIXCOIN to claim from Mine Swipe" };
    }

    // Atomic: zero out holding + credit cryptoBalances.ELIXCOIN
    const updated = await this.userModel
      .findOneAndUpdate(
        { telegramId, "goldBalance.mineSwipe": { $gt: 0 } },
        {
          $inc: {
            "goldBalance.mineSwipe": -amount,
            "cryptoBalances.ELIXCOIN": amount,
          },
        },
        { returnDocument: "after" },
      )
      .exec();

    if (!updated) {
      return { success: false, error: "Nothing to claim" };
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
