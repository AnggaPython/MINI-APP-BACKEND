"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoMiningModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auto_mining_service_1 = require("./auto-mining.service");
const auto_mining_controller_1 = require("./auto-mining.controller");
const auto_mining_schema_1 = require("./schemas/auto-mining.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const mining_stone_schema_1 = require("../miner-stone/schemas/mining-stone.schema");
const case_box_schema_1 = require("../case-box/schemas/case-box.schema");
const miner_stone_module_1 = require("../miner-stone/miner-stone.module");
const case_box_module_1 = require("../case-box/case-box.module");
const buff_item_collections_module_1 = require("../buff-item-collections/buff-item-collections.module");
let AutoMiningModule = class AutoMiningModule {
};
exports.AutoMiningModule = AutoMiningModule;
exports.AutoMiningModule = AutoMiningModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: auto_mining_schema_1.AutoMiningSub.name, schema: auto_mining_schema_1.AutoMiningSubSchema },
                { name: auto_mining_schema_1.AutoMiningDay.name, schema: auto_mining_schema_1.AutoMiningDaySchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: mining_stone_schema_1.MiningStone.name, schema: mining_stone_schema_1.MiningStoneSchema },
                { name: case_box_schema_1.CaseBox.name, schema: case_box_schema_1.CaseBoxSchema },
            ]),
            miner_stone_module_1.MinerStoneModule,
            case_box_module_1.CaseBoxModule,
            buff_item_collections_module_1.BuffItemCollectionsModule,
        ],
        controllers: [auto_mining_controller_1.AutoMiningController],
        providers: [auto_mining_service_1.AutoMiningService],
        exports: [auto_mining_service_1.AutoMiningService],
    })
], AutoMiningModule);
//# sourceMappingURL=auto-mining.module.js.map