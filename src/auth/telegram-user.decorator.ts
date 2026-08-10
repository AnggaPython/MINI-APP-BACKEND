import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './telegram.guard';

/**
 * @Public() — bypass TelegramAuthGuard for a specific endpoint.
 * Usage: @Public() before @Get() or @Post()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @User('telegramId') — extracts a field from request.user injected by TelegramAuthGuard.
 * Usage: @User('telegramId') telegramId: string
 */
export const User = createParamDecorator(
    (field: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        if (!request.user) return null;
        return field ? request.user[field] : request.user;
    },
);
