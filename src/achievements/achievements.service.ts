import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Achievement, AchievementDocument } from "./schemas/achievement.schema";
import { ACHIEVEMENTS_DATA } from "./achievements.data";
import { UsersService } from "../users/users.service";

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(Achievement.name)
    private achievementModel: Model<AchievementDocument>,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
  ) {}

  async getStats(telegramId: string) {
    const userProgress = await this.achievementModel
      .find({ telegramId })
      .exec();

    return ACHIEVEMENTS_DATA.map((ach) => {
      const userAch = userProgress.find((p) => p.achievementId === ach.id);
      return {
        ...ach,
        current: userAch ? userAch.progress : 0,
        claimed: userAch ? userAch.claimed : false,
      };
    });
  }

  async incrementProgress(
    telegramId: string,
    achievementIds: number[],
    amount: number = 1,
  ) {
    for (const achId of achievementIds) {
      const achDef = ACHIEVEMENTS_DATA.find((a) => a.id === achId);
      if (!achDef) continue;

      await this.achievementModel
        .findOneAndUpdate(
          { telegramId, achievementId: achId },
          { $inc: { progress: amount } },
          { upsert: true, returnDocument: "after" },
        )
        .exec();
    }
  }

  async setProgressMax(telegramId: string, achievementIds: number[]) {
    for (const achId of achievementIds) {
      const achDef = ACHIEVEMENTS_DATA.find((a) => a.id === achId);
      if (!achDef) continue;

      await this.achievementModel
        .findOneAndUpdate(
          { telegramId, achievementId: achId },
          { $set: { progress: achDef.max } },
          { upsert: true, returnDocument: "after" },
        )
        .exec();
    }
  }

  async claimReward(telegramId: string, achievementId: number) {
    const achDef = ACHIEVEMENTS_DATA.find((a) => a.id === achievementId);
    if (!achDef) return { error: "Achievement not found" };

    // Atomic one-shot: only the request that flips claimed false -> true may pay.
    // The previous findOne + save() pair let two parallel claims of the same
    // achievement both reach the credit (measured: two 20 ELIXIR credits).
    const claimed = await this.achievementModel
      .findOneAndUpdate(
        {
          telegramId,
          achievementId,
          claimed: { $ne: true },
          progress: { $gte: achDef.max },
        },
        { $set: { claimed: true, claimedAt: new Date() } },
        { returnDocument: "after" },
      )
      .exec();

    if (!claimed) {
      // Distinguish "not met / already claimed" without leaking anything else.
      const progress = await this.achievementModel
        .findOne({ telegramId, achievementId })
        .exec();
      if (!progress || progress.progress < achDef.max)
        return { error: "Requirement not met" };
      return { error: "Already claimed" };
    }

    await this.usersService.creditRewardAndLogTask(
      telegramId,
      achDef.reward,
      // Per-achievement task id so one user's claim cannot collide with another's.
      `ACHIEVEMENT_${achievementId}`,
    );

    return { success: true, reward: achDef.reward };
  }
}
