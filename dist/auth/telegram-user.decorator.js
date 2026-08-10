"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Public = void 0;
const common_1 = require("@nestjs/common");
const telegram_guard_1 = require("./telegram.guard");
const Public = () => (0, common_1.SetMetadata)(telegram_guard_1.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.User = (0, common_1.createParamDecorator)((field, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user)
        return null;
    return field ? request.user[field] : request.user;
});
//# sourceMappingURL=telegram-user.decorator.js.map