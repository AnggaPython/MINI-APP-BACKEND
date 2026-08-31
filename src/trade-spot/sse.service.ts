import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";

/**
 * Lightweight SSE (Server-Sent Events) hub for real-time price streaming.
 *
 * Each connected client subscribes to one or more pairs. When a trade
 * executes or the mid price changes, the hub pushes an event to all
 * subscribers of that pair.  Connections that error out are auto-removed.
 *
 * This replaces polling: the frontend opens ONE EventSource per pair,
 * and the server only pushes data when something actually changes.
 */
@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);

  /**
   * pair → Set of active SSE responses.
   * Each response has `write()` called to push events.
   */
  private readonly subscribers = new Map<string, Set<Response>>();

  /** Total active connections (for monitoring). */
  get connectionCount(): number {
    let count = 0;
    for (const set of this.subscribers.values()) count += set.size;
    return count;
  }

  /**
   * Subscribe an HTTP response to a pair's SSE stream.
   * Sets up headers, heartbeat, and auto-cleanup on disconnect.
   */
  subscribe(pair: string, res: Response): void {
    // SSE headers — no cache, keep-alive, CORS
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
      "Access-Control-Allow-Origin": "*",
    });

    // Send initial comment to establish connection
    res.write(`:ok\n\n`);

    // Add to subscriber set
    if (!this.subscribers.has(pair)) {
      this.subscribers.set(pair, new Set());
    }
    this.subscribers.get(pair)!.add(res);

    this.logger.debug(
      `[SSE] +1 subscriber for ${pair} (total: ${this.connectionCount})`,
    );

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(`:heartbeat\n\n`);
      } catch {
        cleanup();
      }
    }, 30_000);

    // Cleanup on disconnect
    const cleanup = () => {
      clearInterval(heartbeat);
      const set = this.subscribers.get(pair);
      if (set) {
        set.delete(res);
        if (set.size === 0) this.subscribers.delete(pair);
      }
      this.logger.debug(
        `[SSE] -1 subscriber for ${pair} (total: ${this.connectionCount})`,
      );
    };

    res.on("close", cleanup);
    res.on("error", cleanup);
  }

  /**
   * Broadcast a price/trade event to all subscribers of a pair.
   * Called by executeFill() and botCycle() after state changes.
   *
   * @param pair    The trading pair (e.g. "ELIXCOIN/COPPER")
   * @param event   SSE event name (e.g. "ticker", "trade", "book")
   * @param data    JSON-serializable payload
   */
  broadcast(pair: string, event: string, data: Record<string, unknown>): void {
    const set = this.subscribers.get(pair);
    if (!set || set.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const dead: Response[] = [];

    for (const res of set) {
      try {
        res.write(payload);
      } catch {
        dead.push(res);
      }
    }

    // Remove dead connections
    for (const res of dead) {
      set.delete(res);
    }
    if (set.size === 0) this.subscribers.delete(pair);
  }

  /**
   * Broadcast to ALL pairs that share an asset (cross-pair sync).
   * E.g. after an IRON trade, notify both IRON/USDC and ELIXCOIN/IRON.
   */
  broadcastToPairs(
    pairs: string[],
    event: string,
    data: Record<string, unknown>,
  ): void {
    for (const pair of pairs) {
      this.broadcast(pair, event, data);
    }
  }
}
