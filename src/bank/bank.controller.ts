import { Controller, Post, Body } from '@nestjs/common';
import { BankService } from './bank.service';

@Controller('bank')
export class BankController {
    constructor(private readonly bankService: BankService) { }

    @Post('stats')
    async getStats(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const stats = await this.bankService.getStats(telegramId);
        return { success: true, stats };
    }

    @Post('stake')
    async stake(@Body() body: { telegramId: string; amount: number; durationDays: number; rate: number; autoClaim?: boolean }) {
        if (!body.telegramId || !body.amount || !body.durationDays || !body.rate) {
            return { error: 'Incomplete parameters' };
        }
        return await this.bankService.createStake(body.telegramId, Number(body.amount), Number(body.durationDays), Number(body.rate), body.autoClaim || false);
    }

    @Post('claim-yield')
    async claimYield(@Body('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        return await this.bankService.claimEarnings(telegramId);
    }

    @Post('unstake')
    async unstake(@Body() body: { telegramId: string; stakeId: string }) {
        if (!body.telegramId || !body.stakeId) return { error: 'Incomplete parameters' };
        return await this.bankService.unstake(body.telegramId, body.stakeId);
    }

    @Post('autoclaim')
    async toggleAutoClaim(@Body() body: { telegramId: string; autoClaim: boolean }) {
        if (!body.telegramId || typeof body.autoClaim !== 'boolean') {
            return { error: 'Incomplete or invalid parameters' };
        }
        return await this.bankService.toggleAutoClaim(body.telegramId, body.autoClaim);
    }
}
