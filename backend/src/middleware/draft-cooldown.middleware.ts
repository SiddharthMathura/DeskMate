import { Request, Response, NextFunction } from 'express';

const COOLDOWN_MS = 10_000; // 10 seconds between draft requests, per IP

const lastRequestByIp = new Map<string, number>();

export function draftCooldown(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const last = lastRequestByIp.get(ip);

    if (last && now - last < COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
        res.status(429)
            .set('Retry-After', String(retryAfterSeconds))
            .json({
                error: 'Too many draft requests. Please wait a moment before trying again.',
                retryAfterSeconds,
            });
        return;
    }

    lastRequestByIp.set(ip, now);
    next();
}