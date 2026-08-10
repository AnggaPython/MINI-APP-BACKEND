"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const users_service_1 = require("./users.service");
const users_controller_1 = require("./users.controller");
const user_schema_1 = require("./schemas/user.schema");
const referral_log_schema_1 = require("./schemas/referral-log.schema");
const hilo_bet_schema_1 = require("./schemas/hilo-bet.schema");
const achievements_module_1 = require("../achievements/achievements.module");
const admin_module_1 = require("../admin/admin.module");
const telegram_guard_1 = require("../auth/telegram.guard");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: referral_log_schema_1.ReferralLog.name, schema: referral_log_schema_1.ReferralLogSchema },
                { name: hilo_bet_schema_1.HiLoBet.name, schema: hilo_bet_schema_1.HiLoBetSchema }
            ]),
            (0, common_1.forwardRef)(() => achievements_module_1.AchievementsModule),
            (0, common_1.forwardRef)(() => admin_module_1.AdminModule)
        ],
        controllers: [users_controller_1.UsersController],
        providers: [
            users_service_1.UsersService,
            telegram_guard_1.TelegramAuthGuard,
            {
                provide: core_1.APP_GUARD,
                useClass: telegram_guard_1.TelegramAuthGuard,
            },
        ],
        exports: [users_service_1.UsersService]
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map