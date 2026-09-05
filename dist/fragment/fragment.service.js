"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FragmentService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FragmentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto = __importStar(require("crypto"));
const user_schema_1 = require("../users/schemas/user.schema");
const mine_swipe_session_schema_1 = require("./schemas/mine-swipe-session.schema");
const FRAGMENT_DROP_RATES = {
    Common: { spinWheel: 0.40, mineSwipe: 0.35 },
    Medium: { spinWheel: 0.60, mineSwipe: 0.55 },
    Rare: { spinWheel: 0.80, mineSwipe: 0.75 },
};
const FRAGMENT_DROP_MIN = 1;
const FRAGMENT_DROP_MAX = 5;
function randomDropAmount() {
    return FRAGMENT_DROP_MIN + Math.floor(Math.random() * (FRAGMENT_DROP_MAX - FRAGMENT_DROP_MIN + 1));
}
const SPIN_WHEEL_COST = 50;
const SPIN_WHEEL_REWARDS = [
    { weight: 600, reward: { type: "GOLD", amount: 5, label: "5 GOLD", color: "#3b4a5c" } },
    { weight: 900, reward: { type: "GOLD", amount: 10, label: "10 GOLD", color: "#3a4a5a" } },
    { weight: 1000, reward: { type: "GOLD", amount: 50, label: "50 GOLD", color: "#405060" } },
];
const MINE_SWIPE_COST = 50;
const MINE_SWIPE_BOARD_SIZE = 5;
const MINE_SWIPE_MINE_COUNT = 5;
const MINE_SWIPE_BASE_REWARD_PER_TILE = 2;
const MINE_SWIPE_SESSION_TTL_MS = 30 * 60 * 1000;
function roll01(purpose) {
    const serverSeed = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .createHmac("sha256", serverSeed)
        .update(purpose)
        .digest("hex");
    return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
}
let FragmentService = FragmentService_1 = class FragmentService {
    userModel;
    mineSwipeModel;
    logger = new common_1.Logger(FragmentService_1.name);
    constructor(userModel, mineSwipeModel) {
        this.userModel = userModel;
        this.mineSwipeModel = mineSwipeModel;
    }
    async getBalance(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return { success: false, error: "User not found" };
        const goldBal = user.goldBalance || { spinWheels: 0, mineSwipe: 0 };
        return {
            success: true,
            spinWheel: user.spinWheelFragments || 0,
            mineSwipe: user.mineSwipeFragments || 0,
            holdingBalance: {
                spinWheels: goldBal.spinWheels || 0,
                mineSwipe: goldBal.mineSwipe || 0,
            },
        };
    }
    async rollFragmentDrops(telegramId, stoneTier) {
        const rates = FRAGMENT_DROP_RATES[stoneTier] || FRAGMENT_DROP_RATES.Common;
        const now = Date.now();
        let spinDropped = roll01(`frag-spin-${telegramId}-${now}`) < rates.spinWheel;
        let mineDropped = roll01(`frag-mine-${telegramId}-${now}`) < rates.mineSwipe;
        if (!spinDropped && !mineDropped) {
            if (rates.spinWheel >= rates.mineSwipe) {
                spinDropped = true;
            }
            else {
                mineDropped = true;
            }
        }
        const drops = {
            spinWheel: spinDropped ? randomDropAmount() : 0,
            mineSwipe: mineDropped ? randomDropAmount() : 0,
        };
        const inc = {};
        if (drops.spinWheel > 0)
            inc.spinWheelFragments = drops.spinWheel;
        if (drops.mineSwipe > 0)
            inc.mineSwipeFragments = drops.mineSwipe;
        if (Object.keys(inc).length > 0) {
            await this.userModel.findOneAndUpdate({ telegramId }, { $inc: inc }).exec();
        }
        return drops;
    }
    async spinWheel(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return { success: false, error: "User not found" };
        const fragments = user.spinWheelFragments || 0;
        if (fragments < SPIN_WHEEL_COST) {
            return {
                success: false,
                error: `Need ${SPIN_WHEEL_COST} Spin Wheel fragments (have ${fragments})`,
            };
        }
        const roll = roll01(`spin-${telegramId}-${Date.now()}`) * 1000;
        let selected = SPIN_WHEEL_REWARDS[0].reward;
        for (const entry of SPIN_WHEEL_REWARDS) {
            if (roll < entry.weight) {
                selected = entry.reward;
                break;
            }
        }
        const inc = {
            spinWheelFragments: -SPIN_WHEEL_COST,
        };
        if (selected.amount > 0) {
            inc["goldBalance.spinWheels"] = selected.amount;
        }
        const updated = await this.userModel
            .findOneAndUpdate({ telegramId, spinWheelFragments: { $gte: SPIN_WHEEL_COST } }, { $inc: inc }, { returnDocument: "after" })
            .exec();
        if (!updated) {
            return { success: false, error: "Insufficient fragments (race condition)" };
        }
        const goldBal = (updated.goldBalance || { spinWheels: 0, mineSwipe: 0 });
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
    async mineSwipeStart(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return { success: false, error: "User not found" };
        const fragments = user.mineSwipeFragments || 0;
        if (fragments < MINE_SWIPE_COST) {
            return {
                success: false,
                error: `Need ${MINE_SWIPE_COST} Mine Swipe fragments (have ${fragments})`,
            };
        }
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
        const totalTiles = MINE_SWIPE_BOARD_SIZE * MINE_SWIPE_BOARD_SIZE;
        const minePositions = new Set();
        while (minePositions.size < MINE_SWIPE_MINE_COUNT) {
            const pos = Math.floor(Math.random() * totalTiles);
            const row = Math.floor(pos / MINE_SWIPE_BOARD_SIZE);
            const col = pos % MINE_SWIPE_BOARD_SIZE;
            minePositions.add(`${row},${col}`);
        }
        const userLevel = user.level || 1;
        const levelBonus = 1 + (userLevel - 1) * 0.02;
        const rewardPerTile = Math.round(MINE_SWIPE_BASE_REWARD_PER_TILE * levelBonus * 100) / 100;
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
        await this.userModel
            .findOneAndUpdate({ telegramId, mineSwipeFragments: { $gte: MINE_SWIPE_COST } }, { $inc: { mineSwipeFragments: -MINE_SWIPE_COST } })
            .exec();
        return {
            success: true,
            sessionId: session._id.toString(),
            boardSize: MINE_SWIPE_BOARD_SIZE,
            mineCount: MINE_SWIPE_MINE_COUNT,
            rewardPerTile,
            fragmentsRemaining: fragments - MINE_SWIPE_COST,
        };
    }
    async mineSwipeReveal(telegramId, sessionId, row, col) {
        const session = await this.mineSwipeModel
            .findOne({ _id: sessionId, telegramId, status: "active" })
            .exec();
        if (!session) {
            return { success: false, error: "Session not found or already finished" };
        }
        const pos = `${row},${col}`;
        if (session.revealed.includes(pos)) {
            return { success: false, error: "Tile already revealed" };
        }
        if (row < 0 || row >= session.boardSize || col < 0 || col >= session.boardSize) {
            return { success: false, error: "Invalid position" };
        }
        if (session.mines.includes(pos)) {
            session.status = "lost";
            session.accumulatedReward = 0;
            await session.save();
            return {
                success: true,
                hitMine: true,
                gameOver: true,
                accumulatedReward: 0,
                minePositions: session.mines,
                revealed: session.revealed,
            };
        }
        session.revealed.push(pos);
        session.accumulatedReward = Math.round(session.revealed.length * session.rewardPerTile * 100) / 100;
        const totalSafe = session.boardSize * session.boardSize - session.mineCount;
        if (session.revealed.length >= totalSafe) {
            const winReward = session.accumulatedReward;
            session.status = "claimed";
            session.finalReward = winReward;
            await session.save();
            if (winReward > 0) {
                await this.userModel
                    .findOneAndUpdate({ telegramId }, { $inc: { "goldBalance.mineSwipe": winReward } })
                    .exec();
            }
            const winUser = await this.userModel.findOne({ telegramId }).lean().exec();
            const winGoldBal = (winUser?.goldBalance || { spinWheels: 0, mineSwipe: 0 });
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
    async mineSwipeClaim(telegramId, sessionId) {
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
        session.status = "claimed";
        session.finalReward = reward;
        await session.save();
        if (reward > 0) {
            await this.userModel
                .findOneAndUpdate({ telegramId }, { $inc: { "goldBalance.mineSwipe": reward } })
                .exec();
        }
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        const goldBal = (user?.goldBalance || { spinWheels: 0, mineSwipe: 0 });
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
    async claimSpinWheelBalance(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return { success: false, error: "User not found" };
        if ((user.adTickets ?? 0) < 1) {
            return {
                success: false,
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }
        const goldBal = user.goldBalance || { spinWheels: 0, mineSwipe: 0 };
        const amount = goldBal.spinWheels || 0;
        if (amount <= 0) {
            return { success: false, error: "No GOLD to claim from Spin Wheel" };
        }
        const updated = await this.userModel
            .findOneAndUpdate({ telegramId, "goldBalance.spinWheels": { $gt: 0 }, adTickets: { $gte: 1 } }, {
            $inc: {
                "goldBalance.spinWheels": -amount,
                "cryptoBalances.GOLD": amount,
                adTickets: -1,
            },
        }, { returnDocument: "after" })
            .exec();
        if (!updated) {
            return { success: false, error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap to claim again." };
        }
        const crypto = (updated.cryptoBalances || {});
        const goldBal2 = (updated.goldBalance || { spinWheels: 0, mineSwipe: 0 });
        return {
            success: true,
            claimed: amount,
            holdingBalance: { spinWheels: goldBal2.spinWheels || 0, mineSwipe: goldBal2.mineSwipe || 0 },
            cryptoBalances: crypto,
        };
    }
    async claimMineSwipeBalance(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user)
            return { success: false, error: "User not found" };
        if ((user.adTickets ?? 0) < 1) {
            return {
                success: false,
                error: "⚠️ ANTI-CHEAT: S2S Timeout. Server did not receive the token. This often happens on slow cellular networks or if the ad was closed early.",
            };
        }
        const goldBal = user.goldBalance || { spinWheels: 0, mineSwipe: 0 };
        const amount = goldBal.mineSwipe || 0;
        if (amount <= 0) {
            return { success: false, error: "No GOLD to claim from Mine Swipe" };
        }
        const updated = await this.userModel
            .findOneAndUpdate({ telegramId, "goldBalance.mineSwipe": { $gt: 0 }, adTickets: { $gte: 1 } }, {
            $inc: {
                "goldBalance.mineSwipe": -amount,
                "cryptoBalances.GOLD": amount,
                adTickets: -1,
            },
        }, { returnDocument: "after" })
            .exec();
        if (!updated) {
            return { success: false, error: "⚠️ ANTI-CHEAT: S2S ticket lost to a concurrent claim. Tap to claim again." };
        }
        const crypto = (updated.cryptoBalances || {});
        const goldBal2 = (updated.goldBalance || { spinWheels: 0, mineSwipe: 0 });
        return {
            success: true,
            claimed: amount,
            holdingBalance: { spinWheels: goldBal2.spinWheels || 0, mineSwipe: goldBal2.mineSwipe || 0 },
            cryptoBalances: crypto,
        };
    }
    async mineSwipeStatus(telegramId) {
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
};
exports.FragmentService = FragmentService;
exports.FragmentService = FragmentService = FragmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(mine_swipe_session_schema_1.MineSwipeSession.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object])
], FragmentService);
//# sourceMappingURL=fragment.service.js.map