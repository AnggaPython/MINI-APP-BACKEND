import { ConfigService } from '@nestjs/config';
export declare class TelegramBotService {
    private configService;
    private readonly logger;
    private botToken;
    constructor(configService: ConfigService);
    postDailyVoucherCode(): Promise<void>;
    private massBroadcastDM;
}
