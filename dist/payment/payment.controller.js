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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async depositToken(body) {
        if (!body.telegramId || !body.amount) {
            return { success: false, error: "Missing parameters" };
        }
        return await this.paymentService.createDepositCharge(body.telegramId, body.amount);
    }
    async withdrawToken(body) {
        if (!body.telegramId || !body.amount || !body.coin || !body.wallet) {
            return { success: false, error: "Missing parameters" };
        }
        return await this.paymentService.createWithdrawRequest(body.telegramId, body.coin, body.amount, body.wallet, body.tier);
    }
    async getTransactions(id) {
        return await this.paymentService.getTransactions(id);
    }
    async syncDeposit(body) {
        if (!body.telegramId || !body.orderId) {
            return { success: false, error: "Missing parameters" };
        }
        return await this.paymentService.syncPendingDeposit(body.orderId, body.telegramId);
    }
    async handleWebhook(req, res, headers) {
        const rawBodyStr = req.rawBody
            ? req.rawBody.toString("utf8")
            : JSON.stringify(req.body);
        const isValid = this.paymentService.verifyWebhookSignature(headers, rawBodyStr);
        if (!isValid) {
            console.error(`[Webhook Alert] Invalid Signature Detected! timestamp=${headers.timestamp}, sign=${headers.sign || headers["x-signature"]}`);
            console.error(`[Webhook Alert] Raw Body length: ${rawBodyStr.length}`);
            return res.status(common_1.HttpStatus.UNAUTHORIZED).send("Invalid Signature");
        }
        const eventData = req.body;
        const result = await this.paymentService.handleWebhook(eventData);
        if (result.activation) {
            return res.status(common_1.HttpStatus.OK).json({ msg: "Success" });
        }
        if (result.success) {
            return res.status(common_1.HttpStatus.OK).send("success");
        }
        else {
            return res.status(common_1.HttpStatus.BAD_REQUEST).send("failed");
        }
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)("deposit"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "depositToken", null);
__decorate([
    (0, common_1.Post)("withdraw"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "withdrawToken", null);
__decorate([
    (0, common_1.Get)("transactions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)("sync-deposit"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "syncDeposit", null);
__decorate([
    (0, common_1.Post)("webhook"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)("payment"),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map