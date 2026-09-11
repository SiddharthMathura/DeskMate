import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { createSession, destroySession, SESSION_TTL_SECONDS } from '../auth/session.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// Cross-origin (Vercel frontend -> Render backend) requires sameSite:'none',
// which browsers only honor when secure:true. Locally, frontend/backend share
// a scheme+effective-site so 'lax' + no HTTPS
function sessionCookieOptions() {
    return {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: (config.isProduction ? 'none' : 'lax') as 'lax' | 'none',
    };
}

router.post('/login', async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid credentials payload', details: parsed.error.flatten() });
        return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Same error whether the user doesn't exist or the password is wrong —
    // don't leak which one it was.
    if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }

    const sessionId = await createSession({ userId: user.id, role: user.role });

    res.cookie(config.sessionCookieName, sessionId, {
        ...sessionCookieOptions(),
        maxAge: SESSION_TTL_SECONDS * 1000,
    });

    res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
});

router.post('/logout', async (req: Request, res: Response) => {
    const sessionId = req.cookies?.[config.sessionCookieName];

    if (sessionId) {
        await destroySession(sessionId);
    }

    res.clearCookie(config.sessionCookieName, sessionCookieOptions());
    res.status(204).send();
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session!.userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
        // Session pointed at a user that no longer exists — treat as logged out.
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    res.status(200).json(user);
});

export default router;