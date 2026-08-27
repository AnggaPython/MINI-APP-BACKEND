"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuffItemCollectionsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const buff_item_collections_service_1 = require("./buff-item-collections.service");
const buff_item_collections_controller_1 = require("./buff-item-collections.controller");
const buff_item_schema_1 = require("./schemas/buff-item.schema");
const user_buff_collection_schema_1 = require("./schemas/user-buff-collection.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let BuffItemCollectionsModule = class BuffItemCollectionsModule {
};
exports.BuffItemCollectionsModule = BuffItemCollectionsModule;
exports.BuffItemCollectionsModule = BuffItemCollectionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: buff_item_schema_1.BuffItem.name, schema: buff_item_schema_1.BuffItemSchema },
                { name: user_buff_collection_schema_1.UserBuffCollection.name, schema: user_buff_collection_schema_1.UserBuffCollectionSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
        ],
        controllers: [buff_item_collections_controller_1.BuffItemCollectionsController],
        providers: [buff_item_collections_service_1.BuffItemCollectionsService],
        exports: [buff_item_collections_service_1.BuffItemCollectionsService],
    })
], BuffItemCollectionsModule);
//# sourceMappingURL=buff-item-collections.module.js.map