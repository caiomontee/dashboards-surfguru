import axios, { AxiosInstance } from 'axios';

const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';
const PAGE_SIZE = 100;

interface PagarmeSubscription {
  id: string;
  created_at: string;
  status: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  current_cycle?: {
    billing_at?: string;
    cycle?: number;
    end_at?: string;
    id?: string;
    start_at?: string;
  };
  plan?: {
    id: string;
    name: string;
    interval: 'month' | 'year' | 'week' | 'day';
    interval_count: number;
    billing_type: string;
  };
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    pricing_scheme: {
      price: number; // valor em centavos
      scheme_type: string;
    };
  }>;
}

interface PagarmePaging {
  total: number;
  previous?: string | null;
  next?: string | null;
}

interface PagarmeResponse {
  data: PagarmeSubscription[];
  paging: PagarmePaging;
}

export interface SubscriptionStats {
  count: number;
  averageMonthlyValue: number; // em reais
}

function makeClient(secretKey: string): AxiosInstance {
  const token = Buffer.from(`${secretKey}:`).toString('base64');
  return axios.create({
    baseURL: PAGARME_BASE_URL,
    headers: { Authorization: `Basic ${token}` },
    timeout: 15000,
  });
}

// Retorna preço mensal em reais de uma assinatura
function getMonthlyValueBRL(sub: PagarmeSubscription): number {
  const priceInCents =
    sub.items?.[0]?.pricing_scheme?.price ?? 0;

  if (!priceInCents || !sub.plan) return 0;

  const { interval, interval_count } = sub.plan;

  // Normaliza para valor mensal
  const daysPerInterval: Record<string, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  };
  const days = (daysPerInterval[interval] ?? 30) * interval_count;
  const monthlyValue = (priceInCents / 100) * (30 / days);

  return monthlyValue;
}

// Usa paging.total para contagem exata sem paginar tudo
async function getTotalCount(
  client: AxiosInstance,
  params: Record<string, string | number>,
): Promise<number> {
  const resp = await client.get<PagarmeResponse>('/subscriptions', {
    params: { ...params, size: 1, page: 1 },
  });
  return resp.data.paging?.total ?? 0;
}

// Busca até maxSubs assinaturas para amostragem (ex: cálculo de ARPU)
// A Pagar.me pode retornar menos itens que o 'size' solicitado — para apenas em página vazia.
async function fetchSample(
  client: AxiosInstance,
  params: Record<string, string | number>,
  maxSubs = 300,
): Promise<PagarmeSubscription[]> {
  const all: PagarmeSubscription[] = [];
  let page = 1;

  while (all.length < maxSubs) {
    const resp = await client.get<PagarmeResponse>('/subscriptions', {
      params: { ...params, page, size: PAGE_SIZE },
    });
    const { data } = resp.data;
    if (data.length === 0) break; // sem mais páginas
    all.push(...data);
    page++;
  }

  return all.slice(0, maxSubs);
}

export async function countNewSubscriptions(
  secretKey: string,
  createdSince: Date,
  createdUntil: Date,
  status?: string,
): Promise<number> {
  const client = makeClient(secretKey);
  const params: Record<string, string | number> = {
    created_since: createdSince.toISOString(),
    created_until: createdUntil.toISOString(),
  };
  if (status) params.status = status;
  return getTotalCount(client, params);
}

// ── Subscription Summary & List (para o Dashboard de Assinaturas) ──────────

export interface SubscriptionSummary {
  activeCount: number;
  mrr: number;
  newInPeriod: number;
  canceledInPeriod: number;
  churnRate: number;
  pausedCount: number;
  unpaidCount: number;
  trialCount: number;
  canceledMrrLost: number;
}

export interface SubscriptionListItem {
  id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  startDate: string;
  lastPaymentDate: string | null;
  monthlyValue: number;
  planName: string;
}

export interface SubscriptionListResult {
  data: SubscriptionListItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

async function countByStatus(client: AxiosInstance, status: string): Promise<number> {
  return getTotalCount(client, { status });
}

async function countCanceledInPeriod(
  client: AxiosInstance,
  from: Date,
  to: Date,
): Promise<number> {
  // Aproximação: assinaturas com status=canceled criadas no período.
  // Datas exatas de cancelamento requerem webhooks ou banco local.
  return getTotalCount(client, {
    status: 'canceled',
    created_since: from.toISOString(),
    created_until: to.toISOString(),
  });
}

export async function getSubscriptionSummary(
  secretKey: string,
  from: Date,
  to: Date,
): Promise<SubscriptionSummary> {
  const client = makeClient(secretKey);

  // Status válidos na API Pagar.me v5: active, canceled, future, failed, overdue, finished
  // 'overdue' = inadimplente (cobrado mas não pago)
  // 'future'  = agendada (ainda não começou a cobrar)
  const [activeStats, newInPeriod, canceledInPeriod, overdueCount, futureCount] =
    await Promise.all([
      getActiveSubscriptionStats(secretKey),
      countNewSubscriptions(secretKey, from, to),
      countCanceledInPeriod(client, from, to),
      countByStatus(client, 'overdue'),
      countByStatus(client, 'future'),
    ]);

  const churnRate =
    activeStats.count > 0 ? (canceledInPeriod / activeStats.count) * 100 : 0;

  return {
    activeCount: activeStats.count,
    mrr: Math.round(activeStats.count * activeStats.averageMonthlyValue * 100) / 100,
    newInPeriod,
    canceledInPeriod,
    churnRate: Math.round(churnRate * 100) / 100,
    pausedCount:  futureCount,   // 'future' = agendadas ainda não ativas
    unpaidCount:  overdueCount,  // 'overdue' = inadimplentes
    trialCount: 0,
    canceledMrrLost:
      Math.round(canceledInPeriod * activeStats.averageMonthlyValue * 100) / 100,
  };
}

export async function listSubscriptions(
  secretKey: string,
  page: number,
  size: number,
  status?: string,
): Promise<SubscriptionListResult> {
  const client = makeClient(secretKey);
  const params: Record<string, string | number> = { page, size };
  if (status) params.status = status;

  const resp = await client.get<{ data: PagarmeSubscription[]; paging: PagarmePaging }>(
    '/subscriptions',
    { params },
  );
  const { data: subs, paging } = resp.data;

  const items: SubscriptionListItem[] = subs.map((sub) => ({
    id: sub.id,
    customerName: sub.customer?.name ?? 'N/A',
    customerEmail: sub.customer?.email ?? 'N/A',
    status: sub.status,
    startDate: sub.current_cycle?.start_at ?? sub.created_at,
    lastPaymentDate: sub.current_cycle?.billing_at ?? null,
    monthlyValue: getMonthlyValueBRL(sub),
    planName: sub.plan?.name ?? 'SurfGuru Pro',
  }));

  const total = paging?.total ?? 0;

  return { data: items, total, page, size, totalPages: Math.ceil(total / size) };
}

// ── Charges summary (TPV) ────────────────────────────────────────────────────

interface PagarmeCharge {
  id: string;
  amount: number;      // total em centavos
  paid_amount: number; // valor pago em centavos
  status: string;      // paid, pending, failed, canceled, etc.
}

interface PagarmeChargeResponse {
  data: PagarmeCharge[];
  paging: PagarmePaging;
}

export interface ChargesSummary {
  createdCount:    number; // total de cobranças no período
  createdTPV:      number; // soma de amount (R$)
  authorizedCount: number; // cobranças com status=paid
  authorizedTPV:   number; // soma de paid_amount para status=paid (R$)
  averageTicket:   number; // authorizedTPV / authorizedCount (R$)
}

export async function getChargesSummary(
  secretKey: string,
  from: Date,
  to: Date,
): Promise<ChargesSummary> {
  const client = makeClient(secretKey);
  const baseParams = {
    created_since: from.toISOString(),
    created_until: to.toISOString(),
  };

  // Página 1 — descobre total real via paging.total e tamanho efetivo de página.
  // A Pagar.me pode retornar menos itens que o 'size' solicitado (ex: max 30 interno).
  const firstResp = await client.get<PagarmeChargeResponse>('/charges', {
    params: { ...baseParams, size: 100, page: 1 },
  });
  const { data: firstPage, paging } = firstResp.data;
  const createdCount   = paging?.total ?? 0;
  const allCharges: PagarmeCharge[] = [...firstPage];
  const effectiveSize  = firstPage.length; // tamanho real retornado pela API

  if (createdCount > allCharges.length && effectiveSize > 0) {
    const totalPages = Math.ceil(createdCount / effectiveSize);
    // Busca restante em lotes paralelos de 5 para equilibrar velocidade e rate-limit
    const BATCH = 5;
    for (let batchStart = 2; batchStart <= totalPages; batchStart += BATCH) {
      const batchEnd  = Math.min(batchStart + BATCH - 1, totalPages);
      const pageNums  = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i);
      const results   = await Promise.all(
        pageNums.map(p =>
          client.get<PagarmeChargeResponse>('/charges', {
            params: { ...baseParams, size: 100, page: p },
          })
        )
      );
      results.forEach(r => allCharges.push(...r.data.data));
    }
  }

  let createdTPVCents    = 0;
  let authorizedCount    = 0;
  let authorizedTPVCents = 0;

  for (const charge of allCharges) {
    createdTPVCents += charge.amount ?? 0;
    // "Cobranças autorizadas" = paid + canceled (canceled = autorizado pelo banco mas depois estornado)
    if (charge.status === 'paid' || charge.status === 'canceled') {
      authorizedCount++;
      authorizedTPVCents += charge.amount ?? 0;
    }
  }

  const createdTPV    = createdTPVCents / 100;
  const authorizedTPV = authorizedTPVCents / 100;
  const averageTicket = authorizedCount > 0
    ? Math.round(authorizedTPV / authorizedCount * 100) / 100
    : 0;

  return {
    createdCount,
    createdTPV:    Math.round(createdTPV    * 100) / 100,
    authorizedCount,
    authorizedTPV: Math.round(authorizedTPV * 100) / 100,
    averageTicket,
  };
}

export async function getActiveSubscriptionStats(
  secretKey: string,
): Promise<SubscriptionStats> {
  const client = makeClient(secretKey);

  // Conta o total real via paging.total (1 chamada de API)
  const totalCount = await getTotalCount(client, { status: 'active' });
  if (totalCount === 0) return { count: 0, averageMonthlyValue: 0 };

  // Amostra até 300 assinaturas para calcular ARPU representativo
  const sample = await fetchSample(client, { status: 'active' }, 300);

  const monthlyValues = sample.map(getMonthlyValueBRL).filter((v) => v > 0);
  const avg =
    monthlyValues.length > 0
      ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
      : 0;

  return { count: totalCount, averageMonthlyValue: avg };
}
