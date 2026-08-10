import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { TelegramAuthGuard } from '../auth/telegram.guard';
import { Public, User } from '../auth/telegram-user.decorator';

@Controller('users')
@UseGuards(TelegramAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // Sync Telegram user on app launch — body still carries full userData object
    @Post('sync')
    async syncUser(@Body() userData: any, @User('telegramId') telegramId: string) {
        if (!userData || !userData.id) {
            return { success: false, error: 'Invalid user payload' };
        }
        const referredBy = userData.start_param;
        const result = await this.usersService.syncTelegramUser(userData, referredBy);
        return { success: true, user: result };
    }

    // --- PUBLIC: Monetag S2S postback — no Telegram auth available in S2S context ---
    @Public()
    @Get('public/monetag-postback')
    async monetagPostback(
        @Query('userid') userid?: string,
        @Query('event') eventLegacy?: string,
        @Query('reward') rewardLegacy?: string,
        @Query('payout') payoutLegacy?: string,
        @Query('ymid') ymid?: string,
        @Query('event_type') eventType?: string,
        @Query('reward_event_type') rewardEventType?: string,
        @Query('estimated_price') estimatedPrice?: string,
        @Query('telegram_id') telegramId?: string
    ) {
        const resolvedUserId = telegramId ?? userid ?? ymid;
        const resolvedReward = rewardEventType ?? rewardLegacy;
        const resolvedPayout = estimatedPrice ?? payoutLegacy;
        const resolvedEvent = eventType ?? eventLegacy;

        console.log(`[Monetag S2S] Incoming postback: telegram_id=${telegramId}, userid=${userid}, ymid=${ymid}, reward=${resolvedReward}, event=${resolvedEvent}, payout=${resolvedPayout}`);

        if (!resolvedUserId) {
            console.log(`[Monetag S2S] IGNORED: No user ID resolved from query params`);
            return { status: 'ignored', reason: 'missing_user_id' };
        }
        if (resolvedReward !== 'valued') {
            console.log(`[Monetag S2S] IGNORED: reward="${resolvedReward}" !== "valued" for user ${resolvedUserId}`);
            return { status: 'ignored', reason: 'reward_not_valued' };
        }

        const payoutUSD = parseFloat(resolvedPayout || '0') || 0;
        await this.usersService.registerMonetagTicket(resolvedUserId, payoutUSD);

        console.log(`[Monetag S2S] SUCCESS: Ticket registered for user ${resolvedUserId}, payout=$${payoutUSD}`);
        return { status: 'success', user: resolvedUserId, payout: payoutUSD };
    }

    @Post('start-mining')
    async startMining(@User('telegramId') telegramId: string) {
        const result = await this.usersService.startMining(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user };
    }

    @Post('boost-mining')
    async boostMining(@User('telegramId') telegramId: string) {
        const result = await this.usersService.boostMining(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user };
    }

    @Post('claim-mining')
    async claimMining(@User('telegramId') telegramId: string) {
        const result = await this.usersService.claimMining(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, claimedAmount: result.claimedAmount };
    }

    // Changed from @Post to @Get — read-only, no body needed
    @Get('referral-stats')
    async getReferralStats(@User('telegramId') telegramId: string) {
        const stats = await this.usersService.getReferralStats(telegramId);
        return { success: true, stats };
    }

    @Post('claim-referral')
    async claimReferral(@User('telegramId') telegramId: string) {
        const result = await this.usersService.claimReferralVault(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, claimedAmount: result.claimedAmount };
    }

    @Post('claim-daily')
    async claimDaily(@User('telegramId') telegramId: string) {
        const result = await this.usersService.claimDailyLogin(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }

    @Post('claim-faucet')
    async claimFaucet(@User('telegramId') telegramId: string) {
        const result = await this.usersService.claimFaucet(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, finalNum: result.finalNum, reward: result.reward };
    }

    @Post('claim-drop')
    async claimCodeDrop(
        @User('telegramId') telegramId: string,
        @Body('code') code: string
    ) {
        if (!code) return { success: false, error: 'Missing code parameter' };
        const result = await this.usersService.claimCodeDrop(telegramId, code);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }

    @Post('claim-vip-rank')
    async claimVipRank(
        @User('telegramId') telegramId: string,
        @Body('rankName') rankName: string
    ) {
        if (!rankName) return { success: false, error: 'Missing rankName parameter' };
        const result = await this.usersService.claimVipRank(telegramId, rankName);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }

    @Post('verify-telegram')
    async verifyTelegram(@User('telegramId') telegramId: string) {
        const result = await this.usersService.verifyTelegramChannel(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }

    // Changed from GET /balance/:id to GET /me/balance — eliminates IDOR risk
    @Get('me/balance')
    async getBalance(@User('telegramId') telegramId: string) {
        const result = await this.usersService.getBalance(telegramId);
        return {
            success: true,
            balance: result.elixirBalance,
            cryptoBalances: result.cryptoBalances,
            cwalletUid: result.cwalletUid,
            solanaAddress: result.solanaAddress,
            withdrawLimits: result.withdrawLimits,
            lifetimeElixir: result.lifetimeElixir,
            totalReferrals: result.totalReferrals,
            lastFaucetRoll: result.lastFaucetRoll,
            exp: result.exp
        };
    }

    @Post('bind-wallet')
    async bindWallet(
        @User('telegramId') telegramId: string,
        @Body('cwalletUid') cwalletUid: string
    ) {
        if (!cwalletUid) return { success: false, error: 'Missing cwalletUid parameter' };
        return await this.usersService.bindCwalletUid(telegramId, cwalletUid);
    }

    @Post('bind-solana')
    async bindSolana(
        @User('telegramId') telegramId: string,
        @Body('solanaAddress') solanaAddress: string
    ) {
        if (!solanaAddress) return { success: false, error: 'Missing solanaAddress parameter' };
        return await this.usersService.bindSolanaAddress(telegramId, solanaAddress);
    }

    @Post('convert-dust')
    async convertDust(
        @User('telegramId') telegramId: string,
        @Body('coins') coins: string[]
    ) {
        if (!coins || !coins.length) return { success: false, error: 'Missing coins array' };
        return await this.usersService.convertDustToElixir(telegramId, coins);
    }

    @Post('swap')
    async swapElixir(
        @User('telegramId') telegramId: string,
        @Body('amount') amount: number,
        @Body('targetCoin') targetCoin: string
    ) {
        if (!amount || !targetCoin) return { success: false, error: 'Missing swap parameters' };
        return await this.usersService.swapTokens(telegramId, amount, targetCoin);
    }

    @Post('hilo-bet')
    async executeHiLoBet(
        @User('telegramId') telegramId: string,
        @Body('betAmount') betAmount: any,
        @Body('multiplier') multiplier: any,
        @Body('type') type: 'hi' | 'lo'
    ) {
        if (!betAmount || !multiplier || !type) {
            return { success: false, error: 'Missing required betting parameters' };
        }
        const strictBet = Number(betAmount);
        const strictMultiplier = Number(multiplier);
        if (isNaN(strictBet) || isNaN(strictMultiplier) || strictBet <= 0) {
            return { success: false, error: 'Malicious payload detected: Numeric type coercion failed' };
        }
        return await this.usersService.executeHiLoBet(telegramId, strictBet, strictMultiplier, type);
    }

    // Changed from @Post to @Get — read-only, no body needed
    @Get('hilo-history')
    async getHiLoHistory(@User('telegramId') telegramId: string) {
        const history = await this.usersService.getHiLoHistory(telegramId);
        return { success: true, history };
    }
}
