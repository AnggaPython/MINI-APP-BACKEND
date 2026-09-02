"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseService = void 0;
const common_1 = require("@nestjs/common");
let SseService = SseService_1 = class SseService {
    logger = new common_1.Logger(SseService_1.name);
    subscribers = new Map();
    get connectionCount() {
        let count = 0;
        for (const set of this.subscribers.values())
            count += set.size;
        return count;
    }
    subscribe(pair, res) {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        });
        res.write(`:ok\n\n`);
        if (!this.subscribers.has(pair)) {
            this.subscribers.set(pair, new Set());
        }
        this.subscribers.get(pair).add(res);
        this.logger.debug(`[SSE] +1 subscriber for ${pair} (total: ${this.connectionCount})`);
        const heartbeat = setInterval(() => {
            try {
                res.write(`:heartbeat\n\n`);
            }
            catch {
                cleanup();
            }
        }, 30_000);
        const cleanup = () => {
            clearInterval(heartbeat);
            const set = this.subscribers.get(pair);
            if (set) {
                set.delete(res);
                if (set.size === 0)
                    this.subscribers.delete(pair);
            }
            this.logger.debug(`[SSE] -1 subscriber for ${pair} (total: ${this.connectionCount})`);
        };
        res.on("close", cleanup);
        res.on("error", cleanup);
    }
    broadcast(pair, event, data) {
        const set = this.subscribers.get(pair);
        if (!set || set.size === 0)
            return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        const dead = [];
        for (const res of set) {
            try {
                res.write(payload);
            }
            catch {
                dead.push(res);
            }
        }
        for (const res of dead) {
            set.delete(res);
        }
        if (set.size === 0)
            this.subscribers.delete(pair);
    }
};
exports.SseService = SseService;
exports.SseService = SseService = SseService_1 = __decorate([
    (0, common_1.Injectable)()
], SseService);
//# sourceMappingURL=sse.service.js.map