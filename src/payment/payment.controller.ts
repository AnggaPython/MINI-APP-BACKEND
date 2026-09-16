import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Headers,
  HttpStatus,
  Get,
  Param,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { User } from "../auth/telegram-user.decorator";
import type { Request, Response } from "express";

@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("deposit")
  async depositToken(
    @Body() body: { amount: number; telegramId?: string },
    @User("telegramId") telegramId: string,
  ) {
    // The actor is the session, never the body. `telegramId` stays in the type
    // only so an older client does not fail validation; it is ignored.
    if (!telegramId || !body.amount) {
      return { success: false, error: "Missing parameters" };
    }
    return await this.paymentService.createDepositCharge(telegramId, body.amount);
  }

  @Post("withdraw")
  async withdrawToken(
    @Body()
    body: {
      amount: number;
      coin: string;
      wallet: string;
      /** Legacy: accepted and ignored, the account is taken from the session. */
      telegramId?: string;
      tier?: string;
    },
    @User("telegramId") telegramId: string,
  ) {
    if (!telegramId || !body.amount || !body.coin || !body.wallet) {
      return { success: false, error: "Missing parameters" };
    }
    return await this.paymentService.createWithdrawRequest(
      telegramId,
      body.coin,
      body.amount,
      body.wallet,
      body.tier,
    );
  }

  @Get("transactions/:id")
  async getTransactions(@Param("id") id: string) {
    return await this.paymentService.getTransactions(id);
  }

  @Post("sync-deposit")
  async syncDeposit(
    @Body() body: { orderId: string; telegramId?: string },
    @User("telegramId") telegramId: string,
  ) {
    if (!telegramId || !body.orderId) {
      return { success: false, error: "Missing parameters" };
    }
    return await this.paymentService.syncPendingDeposit(body.orderId, telegramId);
  }

  @Post("webhook")
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any,
  ) {
    // Retrieve raw body if Nest is configured with {rawBody: true}, else fallback to stringified body
    const rawBodyStr = (req as any).rawBody
      ? (req as any).rawBody.toString("utf8")
      : JSON.stringify(req.body);

    // Security check
    const isValid = this.paymentService.verifyWebhookSignature(
      headers,
      rawBodyStr,
    );
    if (!isValid) {
      console.error(
        `[Webhook Alert] Invalid Signature Detected! timestamp=${headers.timestamp}, sign=${headers.sign || headers["x-signature"]}`,
      );
      console.error(`[Webhook Alert] Raw Body length: ${rawBodyStr.length}`);
      // Unathorized forged request
      return res.status(HttpStatus.UNAUTHORIZED).send("Invalid Signature");
    }

    // Process Event
    const eventData = req.body;

    // Let service handle core logic
    const result = await this.paymentService.handleWebhook(eventData);

    // CCPayment explicitly demands { msg: 'Success' } JSON for activation
    if (result.activation) {
      return res.status(HttpStatus.OK).json({ msg: "Success" });
    }

    // Acknowledge CCPayment so they stop retrying
    if (result.success) {
      return res.status(HttpStatus.OK).send("success");
    } else {
      return res.status(HttpStatus.BAD_REQUEST).send("failed");
    }
  }
}
