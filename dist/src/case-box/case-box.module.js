"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseBoxModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const case_box_service_1 = require("./case-box.service");
const case_box_controller_1 = require("./case-box.controller");
const case_box_schema_1 = require("./schemas/case-box.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_module_1 = require("../users/users.module");
let CaseBoxModule = class CaseBoxModule {
};
exports.CaseBoxModule = CaseBoxModule;
exports.CaseBoxModule = CaseBoxModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: case_box_schema_1.CaseBox.name, schema: case_box_schema_1.CaseBoxSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            users_module_1.UsersModule,
        ],
        controllers: [case_box_controller_1.CaseBoxController],
        providers: [case_box_service_1.CaseBoxService],
        exports: [case_box_service_1.CaseBoxService],
    })
], CaseBoxModule);
//# sourceMappingURL=case-box.module.js.map