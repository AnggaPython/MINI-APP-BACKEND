import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('sync')
    async syncUser(@Body() userData: any) {
        if (!userData || !userData.id) {
            return { error: 'Invalid user payload' };
        }
        const referredBy = userData.start_param;
        const result = await this.usersService.syncTelegramUser(userData, referredBy);
        return { success: true, user: result };
    }

    @Post('start-mining')
    async startMining(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const result = await this.usersService.startMining(telegramId);
        return { success: true, user: result };
    }

    @Post('claim-mining')
    async claimMining(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const result = await this.usersService.claimMining(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, claimedAmount: result.claimedAmount };
    }

    @Post('referral-stats')
    async getReferralStats(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const stats = await this.usersService.getReferralStats(telegramId);
        return { success: true, stats };
    }

    @Post('claim-referral')
    async claimReferral(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const result = await this.usersService.claimReferralVault(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, claimedAmount: result.claimedAmount };
    }

    @Post('claim-daily')
    async claimDaily(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const result = await this.usersService.claimDailyLogin(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }

    @Post('verify-telegram')
    async verifyTelegram(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const result = await this.usersService.verifyTelegramChannel(telegramId);
        if (result.error) return { success: false, error: result.error };
        return { success: true, user: result.user, reward: result.reward };
    }

    @Get('balance/:id')
    async getBalance(@Param('id') id: string) {
        if (!id) return { error: 'Missing id' };
        const result = await this.usersService.getBalance(id);
        return { success: true, balance: result.elixirBalance, cryptoBalances: result.cryptoBalances, cwalletUid: result.cwalletUid, solanaAddress: result.solanaAddress };
    }

    @Post('bind-wallet')
    async bindWallet(@Body() body: { telegramId: string, cwalletUid: string }) {
        if (!body.telegramId || !body.cwalletUid) return { error: 'Missing parameters' };
        return await this.usersService.bindCwalletUid(body.telegramId, body.cwalletUid);
    }

    @Post('bind-solana')
    async bindSolana(@Body() body: { telegramId: string, solanaAddress: string }) {
        if (!body.telegramId || !body.solanaAddress) return { error: 'Missing parameters' };
        return await this.usersService.bindSolanaAddress(body.telegramId, body.solanaAddress);
    }

    @Post('swap')
    async swapElixir(@Body() body: { telegramId: string, amount: number, targetCoin: string }) {
        if (!body.telegramId || !body.amount || !body.targetCoin) {
            return { error: 'Missing swap parameters' };
        }
        return await this.usersService.swapTokens(body.telegramId, body.amount, body.targetCoin);
    }
}
