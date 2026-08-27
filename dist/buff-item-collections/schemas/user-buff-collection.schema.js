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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBuffCollectionSchema = exports.UserBuffCollection = exports.ItemInstanceSchema = exports.ItemInstance = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ItemInstance = class ItemInstance {
    instanceId;
    baseItemId;
    acquiredAt;
};
exports.ItemInstance = ItemInstance;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], ItemInstance.prototype, "instanceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ItemInstance.prototype, "baseItemId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], ItemInstance.prototype, "acquiredAt", void 0);
exports.ItemInstance = ItemInstance = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ItemInstance);
exports.ItemInstanceSchema = mongoose_1.SchemaFactory.createForClass(ItemInstance);
let UserBuffCollection = class UserBuffCollection {
    telegramId;
    inventory;
    activeInstanceIds;
};
exports.UserBuffCollection = UserBuffCollection;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], UserBuffCollection.prototype, "telegramId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.ItemInstanceSchema], default: [] }),
    __metadata("design:type", Array)
], UserBuffCollection.prototype, "inventory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], UserBuffCollection.prototype, "activeInstanceIds", void 0);
exports.UserBuffCollection = UserBuffCollection = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: "user_buff_collections" })
], UserBuffCollection);
exports.UserBuffCollectionSchema = mongoose_1.SchemaFactory.createForClass(UserBuffCollection);
//# sourceMappingURL=user-buff-collection.schema.js.map