import { Router, Request, Response } from 'express';
import { syncSubscriptions } from '../workers/syncSubscriptions';

const router = Router();

// GET /api/cron/sync
// Chamado pela Vercel Cron diariamente. Protegido por CRON_SECRET.
router.get('/sync', async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET?.trim();
  const auth   = req.headers.authorization ?? '';

  if (!secret || auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    await syncSubscriptions();
    res.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/sync]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro no sync' });
  }
});

export default router;
