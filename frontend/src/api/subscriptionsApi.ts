import axios from 'axios';
import type { SubscriptionListResult } from '../types/subscriptions';

// Camada de serviço frontend → backend → Pagar.me/Planilha.
// Nenhuma lógica de cálculo aqui — apenas transporte de dados.
const api = axios.create({ baseURL: '/api/subscriptions' });

// ── Tipos espelhados do backend ───────────────────────────────────────────────

export interface SheetTotal {
  total:    number;   // soma de todas as plataformas (última linha não-vazia)
  date:     string;   // "DD/MM/YYYY" da planilha
  weekNum:  number;
  growth:   number | null;  // delta vs. semana anterior (pode ser negativo)
}

export interface HistoricalPoint {
  date:        string;        // "DD/MM" — eixo X do gráfico
  total:       number | null; // null = dado ausente, sem interpolação
  isMigration: boolean;
}

export interface PagarmeSummary {
  mrr:              number;  // activeCount × ARPU  (em R$)
  activeCount:      number;  // status=active na Pagar.me
  newInPeriod:      number;  // active + future criadas no período
  canceledInPeriod: number;  // criadas no período e em status=canceled (aproximação)
  churnRate:        number;  // canceledInPeriod / activeCount × 100 (%)
}

export interface PlanSplit {
  monthly: number;
  annual:  number;
}

export interface ChargesSummary {
  createdCount:    number; // total de cobranças no período
  createdTPV:      number; // soma de amount (R$)
  authorizedCount: number; // cobranças com status=paid
  authorizedTPV:   number; // soma de paid_amount (R$)
  averageTicket:   number; // authorizedTPV / authorizedCount (R$)
}

// ── Chamadas de API ───────────────────────────────────────────────────────────

/** Invalida o cache da planilha no backend e retorna o dado atualizado imediatamente. */
export async function refreshSheetCache(): Promise<SheetTotal> {
  const { data } = await api.post<SheetTotal & { ok: boolean }>('/refresh');
  return data;
}

/** Total global de assinantes — Fonte: Planilha Geral */
export async function fetchSheetTotal(): Promise<SheetTotal> {
  const { data } = await api.get<SheetTotal>('/total');
  return data;
}

/** Série histórica semanal (último ano) — Fonte: Planilha Geral */
export async function fetchHistoricalChart(): Promise<HistoricalPoint[]> {
  const { data } = await api.get<HistoricalPoint[]>('/historical');
  return data;
}

/** MRR + novas assinaturas no período — Fonte: API Pagar.me */
export async function fetchPagarmeSummary(from: Date, to: Date): Promise<PagarmeSummary> {
  const { data } = await api.get<PagarmeSummary>('/pagarme-summary', {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return data;
}

/** TPV de cobranças no período — Fonte: API Pagar.me */
export async function fetchChargesSummary(from: Date, to: Date): Promise<ChargesSummary> {
  const { data } = await api.get<ChargesSummary>('/charges-summary', {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return data;
}

/** Contagem de assinaturas ativas por tipo de plano (mensal/anual) — Fonte: API Pagar.me */
export async function fetchPlanSplit(): Promise<PlanSplit> {
  const { data } = await api.get<PlanSplit>('/plan-split');
  return data;
}

/** Listagem paginada de assinaturas individuais — Fonte: API Pagar.me */
export async function fetchSubscriptionList(
  page: number,
  size: number,
  status?: string,
): Promise<SubscriptionListResult> {
  const { data } = await api.get<SubscriptionListResult>('/list', {
    params: { page, size, ...(status ? { status } : {}) },
  });
  return data;
}

/** Exporta a listagem atual para CSV (execução client-side) */
export function exportSubscriptionsCSV(subs: SubscriptionListResult['data']): void {
  const headers = ['ID', 'Cliente', 'Email', 'Status', 'Início', 'Último Pagamento', 'Valor/mês', 'Plano'];
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');
  const rows = subs.map((s) => [
    s.id, s.customerName, s.customerEmail, s.status,
    fmt(s.startDate), fmt(s.lastPaymentDate),
    s.monthlyValue.toFixed(2).replace('.', ','),
    s.planName,
  ]);
  const csv  = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `assinaturas-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}
