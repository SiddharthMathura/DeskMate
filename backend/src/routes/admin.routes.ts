import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { seedDatabase } from '../services/seed.service';

const router = Router();

/**
 * POST /api/admin/reseed
 * Protected by a shared secret header, not session auth — this is triggered
 * by a GitHub Actions cron job, which has no session cookie to send.
 * Re-runs the same idempotent seed logic used by `npm run seed`.
 */
router.post('/reseed', async (req: Request, res: Response) => {
    const providedSecret = req.header('X-Reseed-Secret');
    const expectedSecret = process.env.RESEED_SECRET;

    if (!expectedSecret) {
        res.status(500).json({ error: 'RESEED_SECRET is not configured on the server' });
        return;
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
        res.status(401).json({ error: 'Invalid or missing reseed secret' });
        return;
    }

    const result = await seedDatabase(prisma);
    res.status(200).json({ message: 'Database reseeded', ticketsSeeded: result.ticketsSeeded });
});

export default router;