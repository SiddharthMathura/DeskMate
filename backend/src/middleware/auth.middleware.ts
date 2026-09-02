import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { readSession, touchSession, SESSION_TTL_SECONDS } from '../auth/session.service';

/**
 * Reads the session cookie (if present), loads the session from Redis, and
 * attaches it to req.session. Always calls next() — this does NOT reject
 * unauthenticated requests, it just makes session data available downstream.
 * Use requireAuth/requireAdmin on specific routes to actually gate access.
 */
export async function attachSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const sessionId = req.cookies?.[config.sessionCookieName];

    if (!sessionId) {
        return next();
    }

    const payload = await readSession(sessionId);
    if (payload) {
        req.session = payload;
        // Sliding expiry on activity. Not awaited — a slow Redis EXPIRE
        // shouldn't add latency to every request.
        void touchSession(sessionId, SESSION_TTL_SECONDS);
    }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.session) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.session) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    if (req.session.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}