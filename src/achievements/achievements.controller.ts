import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
    constructor(private readonly achievementsService: AchievementsService) { }

    @Get('stats/:telegramId')
    async getStats(@Param('telegramId') telegramId: string) {
        if (!telegramId) return { error: 'Missing telegramId' };
        const stats = await this.achievementsService.getStats(telegramId);
        return { success: true, stats };
    }

    @Post('claim')
    async claimReward(@Body() body: { telegramId: string; achievementId: number }) {
        if (!body.telegramId || !body.achievementId) {
            return { error: 'Incomplete parameters' };
        }
        return await this.achievementsService.claimReward(body.telegramId, body.achievementId);
    }
}
