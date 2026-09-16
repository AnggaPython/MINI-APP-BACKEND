import { Controller, Post, Body } from "@nestjs/common";
import { BankService } from "./bank.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("bank")
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post("stats")
  async getStats(@User("telegramId") telegramId: string) {
    if (!telegramId) return { error: "Missing telegramId" };
    const stats = await this.bankService.getStats(telegramId);
    return { success: true, stats };
  }

  @Post("stake")
  async stake(
    @User("telegramId") telegramId: string,
    @Body()
    body: {
      amount: number;
      durationDays: number;
      /** Legacy field from older clients: accepted and ignored — see BankService.STAKE_RATES. */
      rate?: number;
      autoClaim?: boolean;
    },
  ) {
    if (!telegramId || !body.amount || !body.durationDays) {
      return { error: "Incomplete parameters" };
    }
    return await this.bankService.createStake(
      telegramId,
      Number(body.amount),
      Number(body.durationDays),
      // Rate deliberately NOT forwarded: the server derives it from the duration.
      undefined,
      body.autoClaim || false,
    );
  }

  @Post("claim-yield")
  async claimYield(@User("telegramId") telegramId: string) {
    if (!telegramId) return { error: "Missing telegramId" };
    return await this.bankService.claimEarnings(telegramId);
  }

  @Post("unstake")
  async unstake(
    @User("telegramId") telegramId: string,
    @Body() body: { stakeId: string },
  ) {
    if (!telegramId || !body.stakeId) return { error: "Incomplete parameters" };
    return await this.bankService.unstake(telegramId, body.stakeId);
  }

  @Post("stake/toggle")
  async toggleStakeConfig(
    @User("telegramId") telegramId: string,
    @Body()
    body: { stakeId: string; autoClaim?: boolean; autoReinvest?: boolean },
  ) {
    if (!telegramId || !body.stakeId) return { error: "Incomplete parameters" };
    return await this.bankService.toggleStakeConfig(
      telegramId,
      body.stakeId,
      body.autoClaim as any,
      body.autoReinvest as any,
    );
  }

  @Post("stake/toggle-global")
  async toggleGlobalStakeConfig(
    @User("telegramId") telegramId: string,
    @Body() body: { field: "autoClaim" | "autoReinvest"; state: boolean },
  ) {
    return this.bankService.toggleGlobalConfig(
      telegramId,
      body.field,
      body.state,
    );
  }
}
