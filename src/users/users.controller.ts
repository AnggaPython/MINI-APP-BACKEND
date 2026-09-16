import { Logger, Controller, Post, Body, Get, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { TelegramAuthGuard } from "../auth/telegram.guard";
import { Public, User } from "../auth/telegram-user.decorator";

@Controller("users")
@UseGuards(TelegramAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  // Sync Telegram user on app launch — body still carries full userData object
  @Post("sync")
  async syncUser(
    @Body() userData: any,
  // @ts-ignore - super strict cleanup pending (auto)
    @User("telegramId") telegramId: string,
  ) {
    if (!userData || !userData.id) {
      return { success: false, error: "Invalid user payload" };
    }
    const referredBy = userData.start_param;
    const result = await this.usersService.syncTelegramUser(
      userData,
      referredBy,
    );
    // Piggyback pending referral modals (zero extra connections).
    const notifications =
      await this.usersService.getPendingNotifications(telegramId);
    return { success: true, user: result, notifications };
  }

  // --- PUBLIC: Monetag S2S postback — no Telegram auth available in S2S context ---
  // Anti-abuse: Monetag does not sign its postbacks, so the shared secret must be
  // appended to the postback URL configured in the Monetag dashboard
  // (…&s2s_secret=<MONETAG_S2S_SECRET>). With the secret set, a request without it
  // — i.e. anyone who can guess the URL — is rejected BEFORE any ticket is minted
  // (audit finding monetag.postback.unauthenticated-ticket-grant: adTickets for
  // `telegram_id` of any user, repeatable). With the secret unset the legacy
  // open behaviour is kept so an existing deployment keeps earning; set the
  // variable and update the dashboard URL to close the finding.
  @Public()
  @Get("public/monetag-postback")
  async monetagPostback(
    @Query("s2s_secret") s2sSecret?: string,
    @Query("userid") userid?: string,
    @Query("event") eventLegacy?: string,
    @Query("reward") rewardLegacy?: string,
    @Query("payout") payoutLegacy?: string,
    @Query("ymid") ymid?: string,
    @Query("event_type") eventType?: string,
    @Query("reward_event_type") rewardEventType?: string,
    @Query("estimated_price") estimatedPrice?: string,
    @Query("telegram_id") telegramId?: string,
  ) {
    const resolvedUserId = telegramId ?? userid ?? ymid;
    const requiredSecret = process.env.MONETAG_S2S_SECRET;
    if (requiredSecret && s2sSecret !== requiredSecret) {
      this.logger.warn(
        `[Monetag S2S] REJECTED: missing/invalid s2s_secret for user=${resolvedUserId ?? "?"}`,
      );
      return { status: "rejected", reason: "invalid_secret" };
    }
    const resolvedReward = rewardEventType ?? rewardLegacy;
    const resolvedPayout = estimatedPrice ?? payoutLegacy;
    const resolvedEvent = eventType ?? eventLegacy;

    this.logger.log(`[Monetag S2S] === Incoming postback START ===`);
    this.logger.log(
      `[Monetag S2S] FULL RAW: telegram_id=${telegramId}, userid=${userid}, ymid=${ymid}, event_type=${eventType}, eventLegacy=${eventLegacy}, reward_event_type=${rewardEventType}, rewardLegacy=${rewardLegacy}, estimated_price=${estimatedPrice}, payoutLegacy=${payoutLegacy}`,
    );
    this.logger.log(
      `[Monetag S2S] Resolved: userId=${resolvedUserId}, reward=${resolvedReward}, payout=$${resolvedPayout}, event=${resolvedEvent}`,
    );

    if (!resolvedUserId) {
      this.logger.log(
        `[Monetag S2S] IGNORED: No user ID resolved from query params`,
      );
      return { status: "ignored", reason: "missing_user_id" };
    }
    if (resolvedReward !== "valued") {
      this.logger.log(
        `[Monetag S2S] IGNORED: reward="${resolvedReward}" !== "valued" for user ${resolvedUserId}`,
      );
      return { status: "ignored", reason: "reward_not_valued" };
    }

    const payoutUSD = parseFloat(resolvedPayout || "0") || 0;
    await this.usersService.registerMonetagTicket(resolvedUserId, payoutUSD);

    this.logger.log(
      `[Monetag S2S] SUCCESS: Ticket registered for user ${resolvedUserId}, payout=$${payoutUSD}`,
    );
    return { status: "success", user: resolvedUserId, payout: payoutUSD };
  }

  // --- PUBLIC: Dev-mode username-password login (DISABLED IN PRODUCTION)
  // Chrome Desktop custom mini-app test: call this endpoint first to get a bearer
  // token, then send Authorization: Bearer <token> on every subsequent request.
  @Public()
  @Post("public/login")
  async devPublicLogin(
    @Body("username") username: string,
    @Body("password") password: string,
  ) {
    return await this.usersService.devLoginUsernamePassword(username, password);
  }

  @Post("start-mining")
  async startMining(@User("telegramId") telegramId: string) {
    const result = await this.usersService.startMining(telegramId);
    if (result.error) return { success: false, error: result.error };
    return { success: true, user: result.user };
  }

  @Post("boost-mining")
  async boostMining(@User("telegramId") telegramId: string) {
    const result = await this.usersService.boostMining(telegramId);
    if (result.error) return { success: false, error: result.error };
    return { success: true, user: result.user };
  }

  @Post("claim-mining")
  async claimMining(@User("telegramId") telegramId: string) {
    const result = await this.usersService.claimMining(telegramId);
    if (result.error) return { success: false, error: result.error };
    return {
      success: true,
      user: result.user,
      claimedAmount: result.claimedAmount,
    };
  }

  // Changed from @Post to @Get — read-only, no body needed
  @Get("referral-stats")
  async getReferralStats(@User("telegramId") telegramId: string) {
    const stats = await this.usersService.getReferralStats(telegramId);
    return { success: true, stats };
  }

  @Post("claim-referral")
  async claimReferral(@User("telegramId") telegramId: string) {
    const result = await this.usersService.claimReferralVault(telegramId);
    if (result.error) return { success: false, error: result.error };
    return {
      success: true,
      user: result.user,
      claimedAmount: result.claimedAmount,
    };
  }

  // Manual invite-code binding — fallback when the invitee entered via the
  // bot Menu/LAUNCH button (which cannot carry a referral param).
  @Post("claim-invite")
  async claimInvite(
    @User("telegramId") telegramId: string,
    @Body("code") code: string,
  ) {
    if (!code) return { success: false, error: "Missing invite code" };
    const result = await this.usersService.claimInvite(telegramId, code);
    if (result.error) return { success: false, error: result.error };
    // Return the fresh welcome modal immediately (no waiting for next sync).
    const notifications =
      await this.usersService.getPendingNotifications(telegramId);
    return { success: true, user: result.user, notifications };
  }

  // Explicit modal acknowledgement (X dismissed / CLAIM NOW tapped).
  // Acked events never resurface; only brand-new events trigger modals.
  @Post("ack-notifications")
  async ackNotifications(
    @User("telegramId") telegramId: string,
    @Body("ids") ids: string[],
    @Body("via") via: string,
  ) {
    const result = await this.usersService.ackNotifications(
      telegramId,
      ids,
      via,
    );
    return { success: true, acked: result.acked };
  }

  @Post("claim-daily")
  async claimDaily(@User("telegramId") telegramId: string) {
    const result = await this.usersService.claimDailyLogin(telegramId);
    if (result.error) return { success: false, error: result.error };
    return { success: true, user: result.user, reward: result.reward };
  }

  @Post("claim-faucet")
  async claimFaucet(@User("telegramId") telegramId: string) {
    const result = await this.usersService.claimFaucet(telegramId);
    if (result.error) return { success: false, error: result.error };
    return { success: true, finalNum: result.finalNum, reward: result.reward };
  }

  @Post("claim-drop")
  async claimCodeDrop(
    @User("telegramId") telegramId: string,
    @Body("code") code: string,
  ) {
    if (!code) return { success: false, error: "Missing code parameter" };
    const result = await this.usersService.claimCodeDrop(telegramId, code);
    if (result.error) return { success: false, error: result.error };
    return { success: true, user: result.user, reward: result.reward };
  }

  @Post("claim-vip-rank")
  async claimVipRank(
    @User("telegramId") telegramId: string,
    @Body("rankName") rankName: string,
  ) {
    if (!rankName)
      return { success: false, error: "Missing rankName parameter" };
    const result = await this.usersService.claimVipRank(telegramId, rankName);
    if (result.error) return { success: false, error: result.error };
    return { success: true, user: result.user, reward: result.reward };
  }

  @Post("verify-telegram")
  async verifyTelegram(@User("telegramId") telegramId: string) {
    const result = await this.usersService.verifyTelegramChannel(telegramId);
    if (result.error) return { success: false, error: result.error };
    return { success: true, user: result.user, reward: result.reward };
  }

  // Changed from GET /balance/:id to GET /me/balance — eliminates IDOR risk
  @Get("me/balance")
  async getBalance(@User("telegramId") telegramId: string) {
    const result = await this.usersService.getBalance(telegramId);
    return {
      success: true,
      balance: result.elixirBalance,
      cryptoBalances: result.cryptoBalances,
      materials: result.materials,
      ownedPickaxes: result.ownedPickaxes,
      cwalletUid: result.cwalletUid,
      solanaAddress: result.solanaAddress,
      withdrawLimits: result.withdrawLimits,
      lifetimeElixir: result.lifetimeElixir,
      totalReferrals: result.totalReferrals,
      lastFaucetRoll: result.lastFaucetRoll,
      exp: result.exp,
      isBanned: Boolean(result.isBanned),
    };
  }

  @Post("bind-wallet")
  async bindWallet(
    @User("telegramId") telegramId: string,
    @Body("cwalletUid") cwalletUid: string,
  ) {
    if (!cwalletUid)
      return { success: false, error: "Missing cwalletUid parameter" };
    return await this.usersService.bindCwalletUid(telegramId, cwalletUid);
  }

  @Post("bind-solana")
  async bindSolana(
    @User("telegramId") telegramId: string,
    @Body("solanaAddress") solanaAddress: string,
  ) {
    if (!solanaAddress)
      return { success: false, error: "Missing solanaAddress parameter" };
    return await this.usersService.bindSolanaAddress(telegramId, solanaAddress);
  }

  @Post("convert-dust")
  async convertDust(
    @User("telegramId") telegramId: string,
    @Body("coins") coins: string[],
  ) {
    if (!coins || !coins.length)
      return { success: false, error: "Missing coins array" };
    return await this.usersService.convertDustToElixir(telegramId, coins);
  }

  @Post("swap")
  async swapElixir(
    @User("telegramId") telegramId: string,
    @Body("amount") amount: number,
    @Body("targetCoin") targetCoin: string,
  ) {
    if (!amount || !targetCoin)
      return { success: false, error: "Missing swap parameters" };
    return await this.usersService.swapTokens(telegramId, amount, targetCoin);
  }

  @Post("hilo-bet")
  async executeHiLoBet(
    @User("telegramId") telegramId: string,
    @Body("betAmount") betAmount: any,
    @Body("multiplier") multiplier: any,
    @Body("type") type: "hi" | "lo",
  ) {
    if (!betAmount || !multiplier || !type) {
      return { success: false, error: "Missing required betting parameters" };
    }
    const strictBet = Number(betAmount);
    const strictMultiplier = Number(multiplier);
    if (isNaN(strictBet) || isNaN(strictMultiplier) || strictBet <= 0) {
      return {
        success: false,
        error: "Malicious payload detected: Numeric type coercion failed",
      };
    }
    return await this.usersService.executeHiLoBet(
      telegramId,
      strictBet,
      strictMultiplier,
      type,
    );
  }

  // Changed from @Post to @Get — read-only, no body needed
  @Get("hilo-history")
  async getHiLoHistory(@User("telegramId") telegramId: string) {
    const history = await this.usersService.getHiLoHistory(telegramId);
    return { success: true, history };
  }

  // ── AUTO Repair preference (AUTO button toggle on mining pages) ─────
  // GET returns the persisted toggle; POST writes it. Both are timestamped
  // so the client's localStorage cache can be reconciled by recency.
  @Get("auto-repair")
  async getAutoRepair(@User("telegramId") telegramId: string) {
    if (!telegramId) return { success: false, error: "Missing telegramId" };
    const setting = await this.usersService.getAutoRepairSetting(telegramId);
    return { success: true, ...setting };
  }

  @Post("auto-repair")
  async setAutoRepair(
    @User("telegramId") telegramId: string,
    @Body("autoRepairOn") autoRepairOn: boolean,
    @Body("updatedAt") updatedAt: number,
  ) {
    if (!telegramId || typeof autoRepairOn !== "boolean") {
      return { success: false, error: "Missing autoRepairOn" };
    }
    const setting = await this.usersService.setAutoRepairSetting(
      telegramId,
      autoRepairOn,
      Number(updatedAt) || 0,
    );
    return { success: true, ...setting };
  }
}
