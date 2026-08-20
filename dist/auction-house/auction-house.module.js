"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionHouseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auction_house_service_1 = require("./auction-house.service");
const auction_house_controller_1 = require("./auction-house.controller");
const auction_schema_1 = require("./schemas/auction.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_module_1 = require("../users/users.module");
const buff_item_schema_1 = require("../buff-item-collections/schemas/buff-item.schema");
const user_buff_collection_schema_1 = require("../buff-item-collections/schemas/user-buff-collection.schema");
let AuctionHouseModule = class AuctionHouseModule {
};
exports.AuctionHouseModule = AuctionHouseModule;
exports.AuctionHouseModule = AuctionHouseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: auction_schema_1.Auction.name, schema: auction_schema_1.AuctionSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: buff_item_schema_1.BuffItem.name, schema: buff_item_schema_1.BuffItemSchema },
                { name: user_buff_collection_schema_1.UserBuffCollection.name, schema: user_buff_collection_schema_1.UserBuffCollectionSchema },
            ]),
            users_module_1.UsersModule,
        ],
        controllers: [auction_house_controller_1.AuctionHouseController],
        providers: [auction_house_service_1.AuctionHouseService],
        exports: [auction_house_service_1.AuctionHouseService],
    })
], AuctionHouseModule);
//# sourceMappingURL=auction-house.module.js.map