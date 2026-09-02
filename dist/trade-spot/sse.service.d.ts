import { Response } from "express";
export declare class SseService {
    private readonly logger;
    private readonly subscribers;
    get connectionCount(): number;
    subscribe(pair: string, res: Response): void;
    broadcast(pair: string, event: string, data: Record<string, unknown>): void;
}
