import { Router, Request, Response } from 'express';
import { countNewSubscriptions, getActiveSubscriptionStats } from '../services/pagarmeService';
import { parseOverloadReport } from '../parsers/overloadParser';

const router = Router();

function getSecretKey(): string {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key || key.includes('COLOQUE_SUA_CHAVE')) {
    throw new Error('PAGARME_SECRET_KEY não configurada no .env');
  }
  return key;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function startOfYear(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

type Granularity = 'day' | 'week' | 'month';

interface Bucket {
  from: Date;
  to: Date;
  label: string;
}

function generateBuckets(from: Date, to: Date, gran: Granularity): Bucket[] {
  const buckets: Bucket[] = [];
  const cur = new Date(from);

  while (cur < to) {
    const bucketFrom = new Date(cur);
    let bucketTo: Date;
    let label: string;

    if (gran === 'day') {
      bucketTo = new Date(cur);
      bucketTo.setDate(bucketTo.getDate() + 1);
      label = cur.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } else if (gran === 'week') {
      bucketTo = new Date(cur);
      bucketTo.setDate(bucketTo.getDate() + 7);
      label = cur.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } else {
      bucketTo = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      label = cur.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }

    if (bucketTo > to) bucketTo = new Date(to);
    buckets.push({ from: bucketFrom, to: bucketTo, label });
    cur.setTime(bucketTo.getTime());
  }

  return buckets;
}

// Conta assinaturas ativas + futuras criadas no período (exclui canceled/failed)
async function countConverted(key: string, from: Date, to: Date): Promise<number> {
  const [active, future] = await Promise.all([
    countNewSubscriptions(key, from, to, 'active'),
    countNewSubscriptions(key, from, to, 'future'),
  ]);
  return active + future;
}

// GET /api/metrics/acquisition
router.get('/acquisition', async (_req: Request, res: Response) => {
  try {
    const secretKey = getSecretKey();
    const now = new Date();

    const [hoje, semana, quinzena, mes, ano] = await Promise.all([
      countConverted(secretKey, daysAgo(1),      now),
      countConverted(secretKey, daysAgo(7),      now),
      countConverted(secretKey, daysAgo(15),     now),
      countConverted(secretKey, daysAgo(30),     now),
      countConverted(secretKey, startOfYear(),   now),
    ]);

    res.json({ hoje, semana, quinzena, mes, ano, updatedAt: now.toISOString() });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
  }
});

// GET /api/metrics/evolution?from=ISO&to=ISO&granularity=day|week|month
router.get('/evolution', async (req: Request, res: Response) => {
  try {
    const secretKey = getSecretKey();
    const from = req.query.from ? new Date(req.query.from as string) : daysAgo(30);
    const to   = req.query.to   ? new Date(req.query.to   as string) : new Date();
    const gran = (['day', 'week', 'month'].includes(req.query.granularity as string)
      ? req.query.granularity
      : 'month') as Granularity;

    const buckets = generateBuckets(from, to, gran);

    const points = await Promise.all(
      buckets.map(async (b) => ({
        date:        b.label,
        subscribers: await countNewSubscriptions(secretKey, b.from, b.to),
      })),
    );

    res.json(points);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
  }
});

// GET /api/metrics/comparison?from=ISO&to=ISO
router.get('/comparison', async (req: Request, res: Response) => {
  try {
    const secretKey = getSecretKey();
    const to   = req.query.to   ? new Date(req.query.to   as string) : new Date();
    const from = req.query.from ? new Date(req.query.from as string) : daysAgo(30);

    const durationMs = to.getTime() - from.getTime();
    const prevFrom   = new Date(from.getTime() - durationMs);
    const prevTo     = new Date(from);

    const curBuckets  = generateBuckets(from, to,       'week');
    const prevBuckets = generateBuckets(prevFrom, prevTo, 'week');

    const [curCounts, prevCounts] = await Promise.all([
      Promise.all(curBuckets.map((b)  => countNewSubscriptions(secretKey, b.from, b.to))),
      Promise.all(prevBuckets.map((b) => countNewSubscriptions(secretKey, b.from, b.to))),
    ]);

    const result = curBuckets.map((b, i) => ({
      label:    b.label,
      current:  curCounts[i],
      previous: prevCounts[i] ?? 0,
    }));

    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
  }
});

// POST /api/metrics/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  const { overloadReport, lifetimeMonths = 12, periodDays = 30 } = req.body as {
    overloadReport: string;
    lifetimeMonths?: number;
    periodDays?: number;
  };

  if (!overloadReport || typeof overloadReport !== 'string') {
    res.status(400).json({ error: 'Campo "overloadReport" é obrigatório.' });
    return;
  }

  try {
    const secretKey  = getSecretKey();
    const now        = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const [parseResult, activeNew, futureNew, activeStats] = await Promise.all([
      Promise.resolve(parseOverloadReport(overloadReport)),
      countNewSubscriptions(secretKey, periodStart, now, 'active'),
      countNewSubscriptions(secretKey, periodStart, now, 'future'),
      getActiveSubscriptionStats(secretKey),
    ]);
    const newSubs = activeNew + futureNew;

    const { totalCost } = parseResult;
    const cac   = newSubs > 0 ? totalCost / newSubs : null;
    const ltv   = activeStats.averageMonthlyValue * lifetimeMonths;
    const ratio = cac && cac > 0 ? ltv / cac : null;

    res.json({
      period: { days: periodDays, from: periodStart.toISOString(), to: now.toISOString() },
      acquisition: { newSubscribers: newSubs },
      costs: {
        total: totalCost,
        currency: parseResult.currency,
        parsedFrom: parseResult.matchedLabel,
        warning: parseResult.warning,
      },
      financial: {
        cac, ltv, ltvCacRatio: ratio,
        arpu:               activeStats.averageMonthlyValue,
        activeSubscribers:  activeStats.count,
        lifetimeMonthsUsed: lifetimeMonths,
        retentionMonths:    lifetimeMonths,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
  }
});

export default router;
