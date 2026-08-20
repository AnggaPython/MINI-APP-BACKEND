"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const achievements_service_1 = require("./achievements.service");
const achievements_controller_1 = require("./achievements.controller");
const achievement_schema_1 = require("./schemas/achievement.schema");
const users_module_1 = require("../users/users.module");
let AchievementsModule = class AchievementsModule {
};
exports.AchievementsModule = AchievementsModule;
exports.AchievementsModule = AchievementsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: achievement_schema_1.Achievement.name, schema: achievement_schema_1.AchievementSchema },
            ]),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
        ],
        controllers: [achievements_controller_1.AchievementsController],
        providers: [achievements_service_1.AchievementsService],
        exports: [achievements_service_1.AchievementsService],
    })
], AchievementsModule);
//# sourceMappingURL=achievements.module.js.map