"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const circular_casino_service_1 = require("./circular-casino.service");
const admin_schema_1 = require("./schemas/admin.schema");
const profit_log_schema_1 = require("./schemas/profit-log.schema");
const circular_treasury_schema_1 = require("./schemas/circular-treasury.schema");
const user_net_equity_schema_1 = require("./schemas/user-net-equity.schema");
const monthly_book_cycle_schema_1 = require("./schemas/monthly-book-cycle.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_module_1 = require("../users/users.module");
const trade_spot_module_1 = require("../trade-spot/trade-spot.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: admin_schema_1.Admin.name, schema: admin_schema_1.AdminSchema },
                { name: profit_log_schema_1.ProfitLog.name, schema: profit_log_schema_1.ProfitLogSchema },
                { name: circular_treasury_schema_1.CircularTreasury.name, schema: circular_treasury_schema_1.CircularTreasurySchema },
                { name: user_net_equity_schema_1.UserNetEquity.name, schema: user_net_equity_schema_1.UserNetEquitySchema },
                { name: monthly_book_cycle_schema_1.MonthlyBookCycle.name, schema: monthly_book_cycle_schema_1.MonthlyBookCycleSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            trade_spot_module_1.TradeSpotModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, circular_casino_service_1.CircularCasinoService],
        exports: [admin_service_1.AdminService, circular_casino_service_1.CircularCasinoService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map