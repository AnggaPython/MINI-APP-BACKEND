import { HistoryService } from './history.service';
export declare class HistoryController {
    private readonly historyService;
    constructor(historyService: HistoryService);
    getUnifiedHistory(telegramId: string, page?: string, limit?: string, filter?: string): Promise<{
        success: boolean;
        filter: string;
        data: any[];
        hasMore: boolean;
        totalItems: number;
    }>;
}
