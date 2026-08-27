"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeSpotModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const trade_spot_service_1 = require("./trade-spot.service");
const trade_spot_controller_1 = require("./trade-spot.controller");
const market_maker_service_1 = require("./market-maker.service");
const asset_registry_service_1 = require("./asset-registry.service");
const trade_schema_1 = require("./schemas/trade.schema");
const pool_schema_1 = require("./schemas/pool.schema");
const open_order_schema_1 = require("./schemas/open-order.schema");
const asset_registry_schema_1 = require("./schemas/asset-registry.schema");
const marketplace_item_schema_1 = require("./schemas/marketplace-item.schema");
const marketplace_service_1 = require("./marketplace.service");
const marketplace_controller_1 = require("./marketplace.controller");
const user_schema_1 = require("../users/schemas/user.schema");
const buff_item_collections_module_1 = require("../buff-item-collections/buff-item-collections.module");
let TradeSpotModule = class TradeSpotModule {
};
exports.TradeSpotModule = TradeSpotModule;
exports.TradeSpotModule = TradeSpotModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: trade_schema_1.Trade.name, schema: trade_schema_1.TradeSchema },
                { name: pool_schema_1.LiquidityPool.name, schema: pool_schema_1.LiquidityPoolSchema },
                { name: open_order_schema_1.OpenOrder.name, schema: open_order_schema_1.OpenOrderSchema },
                { name: asset_registry_schema_1.AssetRegistry.name, schema: asset_registry_schema_1.AssetRegistrySchema },
                { name: marketplace_item_schema_1.MarketplaceItem.name, schema: marketplace_item_schema_1.MarketplaceItemSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            buff_item_collections_module_1.BuffItemCollectionsModule,
        ],
        controllers: [trade_spot_controller_1.TradeSpotController, marketplace_controller_1.MarketplaceController],
        providers: [trade_spot_service_1.TradeSpotService, market_maker_service_1.MarketMakerService, asset_registry_service_1.AssetRegistryService, marketplace_service_1.MarketplaceService],
        exports: [trade_spot_service_1.TradeSpotService, market_maker_service_1.MarketMakerService, asset_registry_service_1.AssetRegistryService, marketplace_service_1.MarketplaceService],
    })
], TradeSpotModule);
//# sourceMappingURL=trade-spot.module.js.map