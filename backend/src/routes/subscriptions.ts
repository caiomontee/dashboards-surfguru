import { Router, Request, Response } from 'express';
import { getLatestTotal, getHistoricalChart, clearCache } from '../services/sheetsService';
import {
  getActiveSubscriptionStats,
  countNewSubscriptions,
  listSubscriptions,
  getChargesSummary,
  getActiveSubscriptionsByInterval,
} from '../services/pagarmeService';

const router = Router();

function getPagarmeKey(): string {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key || key.includes('COLOQUE_SUA_CHAVE')) {
    throw new Error('PAGARME_SECRET_KEY não configurada no .env');
  }
  return key;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── POST /api/subscriptions/refresh ──────────────────────────────────────────
// Invalida o cache da planilha e retorna os dados frescos imediatamente.
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    clearCache();
    const data = await getLatestTotal();
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error('[subscriptions/refresh]', err);
    res.status(503).json({ error: err instanceof Error ? err.message : 'Erro ao atualizar' });
  }
});

// ── GET /api/subscriptions/total ──────────────────────────────────────────────
// Fonte: Planilha Geral (Google Sheets, export CSV público)
// Retorna o total de assinantes da última semana com dado preenchido,
// mais o crescimento semanal (delta vs. semana anterior).
router.get('/total', async (_req: Request, res: Response) => {
  try {
    const data = await getLatestTotal();
    res.json(data);
  } catch (err) {
    console.error('[subscriptions/total]', err);
    res.status(503).json({
      error: err instanceof Error ? err.message : 'Erro ao ler planilha',
      fonte: 'Planilha Geral',
    });
  }
});

// ── GET /api/subscriptions/historical ────────────────────────────────────────
// Fonte: Planilha Geral — últimas 52 semanas (1 ano)
// Lacunas NÃO são interpoladas (total: null indica ausência real de dado).
// Semanas de migração retornam isMigration: true para anotação no gráfico.
router.get('/historical', async (_req: Request, res: Response) => {
  try {
    const data = await getHistoricalChart();
    res.json(data);
  } catch (err) {
    console.error('[subscriptions/historical]', err);
    res.status(503).json({
      error: err instanceof Error ? err.message : 'Erro ao ler histórico da planilha',
      fonte: 'Planilha Geral',
    });
  }
});

// ── GET /api/subscriptions/pagarme-summary?from=ISO&to=ISO ───────────────────
// Fonte: API Pagar.me (única fonte para dados financeiros e métricas diárias)
// MRR = activeCount × ARPU médio (amostra de 300 subs ativas)
// newInPeriod = assinaturas criadas no período (created_since/created_until)
router.get('/pagarme-summary', async (req: Request, res: Response) => {
  const to   = req.query.to   ? new Date(String(req.query.to))   : new Date();
  const from = req.query.from ? new Date(String(req.query.from)) : daysAgo(30);

  try {
    const key = getPagarmeKey();

    const [activeStats, activeNew, futureNew, canceledRaw] = await Promise.all([
      getActiveSubscriptionStats(key),
      countNewSubscriptions(key, from, to, 'active'),
      countNewSubscriptions(key, from, to, 'future'),
      // Aproximação: assinaturas criadas no período que estão em status=canceled.
      // A API v5 não expõe data de cancelamento sem webhooks; usamos created_since/until.
      countNewSubscriptions(key, from, to, 'canceled'),
    ]);

    const churnRate = activeStats.count > 0
      ? Math.round(canceledRaw / activeStats.count * 10000) / 100
      : 0;

    res.json({
      mrr:              Math.round(activeStats.count * activeStats.averageMonthlyValue * 100) / 100,
      activeCount:      activeStats.count,
      newInPeriod:      activeNew + futureNew,
      canceledInPeriod: canceledRaw,
      churnRate,
      fonte:            'API Pagar.me',
    });
  } catch (err) {
    console.error('[subscriptions/pagarme-summary]', err);
    res.status(503).json({
      error: err instanceof Error ? err.message : 'Erro na API Pagar.me',
      fonte: 'API Pagar.me',
    });
  }
});

// ── GET /api/subscriptions/charges-summary?from=ISO&to=ISO ───────────────────
// Fonte: API Pagar.me — TPV (volume total de pagamentos) no período
// createdTPV = soma dos amounts de todas as cobranças criadas
// authorizedTPV = soma dos paid_amounts das cobranças com status=paid
router.get('/charges-summary', async (req: Request, res: Response) => {
  const to   = req.query.to   ? new Date(String(req.query.to))   : new Date();
  const from = req.query.from ? new Date(String(req.query.from)) : daysAgo(30);

  try {
    const key  = getPagarmeKey();
    const data = await getChargesSummary(key, from, to);
    res.json({ ...data, fonte: 'API Pagar.me' });
  } catch (err) {
    console.error('[subscriptions/charges-summary]', err);
    res.status(503).json({
      error: err instanceof Error ? err.message : 'Erro na API Pagar.me',
      fonte: 'API Pagar.me',
    });
  }
});

// ── GET /api/subscriptions/plan-split ────────────────────────────────────────
// Fonte: API Pagar.me — contagem de assinaturas ativas por tipo de plano (mensal/anual)
router.get('/plan-split', async (_req: Request, res: Response) => {
  try {
    const key  = getPagarmeKey();
    const data = await getActiveSubscriptionsByInterval(key);
    res.json({ ...data, fonte: 'API Pagar.me' });
  } catch (err) {
    console.error('[subscriptions/plan-split]', err);
    res.status(503).json({
      error: err instanceof Error ? err.message : 'Erro na API Pagar.me',
      fonte: 'API Pagar.me',
    });
  }
});

// ── GET /api/subscriptions/list?page=1&size=20&status=active ─────────────────
// Fonte: API Pagar.me — listagem paginada de assinaturas individuais
router.get('/list', async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(String(req.query.page  || '1'),  10));
  const size   = Math.min(100, Math.max(1, parseInt(String(req.query.size || '20'), 10)));
  const status = req.query.status ? String(req.query.status) : undefined;

  try {
    const key    = getPagarmeKey();
    const result = await listSubscriptions(key, page, size, status);
    res.json(result);
  } catch (err) {
    console.error('[subscriptions/list]', err);
    res.status(503).json({
      error: err instanceof Error ? err.message : 'Erro na API Pagar.me',
      fonte: 'API Pagar.me',
    });
  }
});

export default router;
