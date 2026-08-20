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
exports.BuffItemSchema = exports.BuffItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let BuffItem = class BuffItem {
    buffId;
    collectionItemId;
    buffType;
    rarity;
    buffValue;
    buffUnit;
    name;
    description;
    icon;
};
exports.BuffItem = BuffItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], BuffItem.prototype, "buffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BuffItem.prototype, "collectionItemId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["ATK", "ECONOMY", "DURABILITY", "DROPRATE"] }),
    __metadata("design:type", String)
], BuffItem.prototype, "buffType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["COMMON", "MEDIUM", "RARE", "ULTRA_RARE"] }),
    __metadata("design:type", String)
], BuffItem.prototype, "rarity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], BuffItem.prototype, "buffValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ["flat", "percent"] }),
    __metadata("design:type", String)
], BuffItem.prototype, "buffUnit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BuffItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BuffItem.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "📦" }),
    __metadata("design:type", String)
], BuffItem.prototype, "icon", void 0);
exports.BuffItem = BuffItem = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: "buff_items" })
], BuffItem);
exports.BuffItemSchema = mongoose_1.SchemaFactory.createForClass(BuffItem);
exports.BuffItemSchema.index({ buffType: 1, rarity: 1 });
exports.BuffItemSchema.index({ collectionItemId: 1 });
//# sourceMappingURL=buff-item.schema.js.map