import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class TelegramBotService implements OnModuleInit {
    private configService;
    private readonly logger;
    private botToken;
    private lastUpdateId;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private startPolling;
    private handleIncomingMessage;
    postDailyVoucherCode(): Promise<void>;
    private massBroadcastDM;
}
