import { Controller, Get, Post, Body } from "@nestjs/common";
import { FragmentService } from "./fragment.service";
import { User } from "../auth/telegram-user.decorator";

@Controller("fragment")
export class FragmentController {
  constructor(private readonly fragmentService: FragmentService) {}

  // ── Balance ────────────────────────────────────────────────────────────

  /** Get fragment balances for the current user. */
  @Get("balance")
  async getBalance(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.fragmentService.getBalance(telegramId);
  }

  // ── Spin Wheel ─────────────────────────────────────────────────────────

  /** Play the Spin Wheel: costs 100 spin-wheel fragments, instant reward. */
  @Post("spin-wheel/spin")
  async spinWheel(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.fragmentService.spinWheel(telegramId);
  }

  // ── Claim Holding Balances ──────────────────────────────────────────────

  /** Claim spin wheel GOLD holding balance → transfers to cryptoBalances.GOLD. */
  @Post("spin-wheel/claim")
  async claimSpinWheel(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.fragmentService.claimSpinWheelBalance(telegramId);
  }

  /** Claim mine swipe ELIXCOIN holding balance → transfers to cryptoBalances.ELIXCOIN. */
  @Post("mine-swipe/claim-balance")
  async claimMineSwipe(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.fragmentService.claimMineSwipeBalance(telegramId);
  }

  // ── Mine Swipe ─────────────────────────────────────────────────────────

  /** Start a new Mine Swipe game: costs 100 mine-swipe fragments. */
  @Post("mine-swipe/start")
  async mineSwipeStart(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.fragmentService.mineSwipeStart(telegramId);
  }

  /** Reveal a tile in the current Mine Swipe game. */
  @Post("mine-swipe/reveal")
  async mineSwipeReveal(
    @User("telegramId") telegramId: string,
    @Body() body: { sessionId?: string; row?: number; col?: number },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    if (!body?.sessionId || body?.row === undefined || body?.col === undefined) {
      return { success: false, error: "Missing sessionId, row, or col" };
    }
    return await this.fragmentService.mineSwipeReveal(
      telegramId,
      String(body.sessionId),
      Number(body.row),
      Number(body.col),
    );
  }

  /** Cash out accumulated reward from Mine Swipe. */
  @Post("mine-swipe/claim")
  async mineSwipeClaim(
    @User("telegramId") telegramId: string,
    @Body() body: { sessionId?: string },
  ) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    if (!body?.sessionId) return { success: false, error: "Missing sessionId" };
    return await this.fragmentService.mineSwipeClaim(
      telegramId,
      String(body.sessionId),
    );
  }

  /** Get current Mine Swipe session state (for reconnecting after page refresh). */
  @Get("mine-swipe/status")
  async mineSwipeStatus(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    return await this.fragmentService.mineSwipeStatus(telegramId);
  }
}
