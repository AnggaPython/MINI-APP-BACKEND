"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const achievement_schema_1 = require("./schemas/achievement.schema");
const achievements_data_1 = require("./achievements.data");
const users_service_1 = require("../users/users.service");
let AchievementsService = class AchievementsService {
    achievementModel;
    usersService;
    constructor(achievementModel, usersService) {
        this.achievementModel = achievementModel;
        this.usersService = usersService;
    }
    async getStats(telegramId) {
        const userProgress = await this.achievementModel
            .find({ telegramId })
            .exec();
        return achievements_data_1.ACHIEVEMENTS_DATA.map((ach) => {
            const userAch = userProgress.find((p) => p.achievementId === ach.id);
            return {
                ...ach,
                current: userAch ? userAch.progress : 0,
                claimed: userAch ? userAch.claimed : false,
            };
        });
    }
    async incrementProgress(telegramId, achievementIds, amount = 1) {
        for (const achId of achievementIds) {
            const achDef = achievements_data_1.ACHIEVEMENTS_DATA.find((a) => a.id === achId);
            if (!achDef)
                continue;
            await this.achievementModel
                .findOneAndUpdate({ telegramId, achievementId: achId }, { $inc: { progress: amount } }, { upsert: true, returnDocument: "after" })
                .exec();
        }
    }
    async setProgressMax(telegramId, achievementIds) {
        for (const achId of achievementIds) {
            const achDef = achievements_data_1.ACHIEVEMENTS_DATA.find((a) => a.id === achId);
            if (!achDef)
                continue;
            await this.achievementModel
                .findOneAndUpdate({ telegramId, achievementId: achId }, { $set: { progress: achDef.max } }, { upsert: true, returnDocument: "after" })
                .exec();
        }
    }
    async claimReward(telegramId, achievementId) {
        const achDef = achievements_data_1.ACHIEVEMENTS_DATA.find((a) => a.id === achievementId);
        if (!achDef)
            return { error: "Achievement not found" };
        const claimed = await this.achievementModel
            .findOneAndUpdate({
            telegramId,
            achievementId,
            claimed: { $ne: true },
            progress: { $gte: achDef.max },
        }, { $set: { claimed: true, claimedAt: new Date() } }, { returnDocument: "after" })
            .exec();
        if (!claimed) {
            const progress = await this.achievementModel
                .findOne({ telegramId, achievementId })
                .exec();
            if (!progress || progress.progress < achDef.max)
                return { error: "Requirement not met" };
            return { error: "Already claimed" };
        }
        await this.usersService.creditRewardAndLogTask(telegramId, achDef.reward, `ACHIEVEMENT_${achievementId}`);
        return { success: true, reward: achDef.reward };
    }
};
exports.AchievementsService = AchievementsService;
exports.AchievementsService = AchievementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(achievement_schema_1.Achievement.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService])
], AchievementsService);
//# sourceMappingURL=achievements.service.js.map