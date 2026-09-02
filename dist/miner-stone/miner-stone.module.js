"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinerStoneModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const miner_stone_service_1 = require("./miner-stone.service");
const miner_stone_controller_1 = require("./miner-stone.controller");
const mining_stone_schema_1 = require("./schemas/mining-stone.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_module_1 = require("../users/users.module");
const buff_item_collections_module_1 = require("../buff-item-collections/buff-item-collections.module");
const leveling_module_1 = require("../leveling-miner/leveling.module");
const fragment_module_1 = require("../fragment/fragment.module");
let MinerStoneModule = class MinerStoneModule {
};
exports.MinerStoneModule = MinerStoneModule;
exports.MinerStoneModule = MinerStoneModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: mining_stone_schema_1.MiningStone.name, schema: mining_stone_schema_1.MiningStoneSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            users_module_1.UsersModule,
            buff_item_collections_module_1.BuffItemCollectionsModule,
            leveling_module_1.LevelingModule,
            fragment_module_1.FragmentModule,
        ],
        controllers: [miner_stone_controller_1.MinerStoneController],
        providers: [miner_stone_service_1.MinerStoneService],
        exports: [miner_stone_service_1.MinerStoneService],
    })
], MinerStoneModule);
//# sourceMappingURL=miner-stone.module.js.map