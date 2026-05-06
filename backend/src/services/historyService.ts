import { supabase } from '../lib/supabase';
import { SUBSCRIPTIONS_HISTORY_TABLE, type SubscriptionsHistoryRow } from '../types/subscriptions';

const WEEKS_WINDOW = 52;

// Semanas de migração conhecidas — marcadas no gráfico com anotação visual
const MIGRATION_DATES = new Set(['2026-02-16', '2026-02-23']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDDMM(isoDate: string): string {
  // "YYYY-MM-DD" → "DD/MM"
  const [, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}`;
}

function cutoffDate(): string {
  return new Date(Date.now() - WEEKS_WINDOW * 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
}

// ── Tipos públicos (mesma interface que sheetsService exportava) ───────────────

export interface SheetTotal {
  total:   number;
  date:    string;        // "DD/MM/YYYY"
  weekNum: number;        // id da linha no Supabase
  growth:  number | null;
}

export interface HistoricalPoint {
  date:        string;        // "DD/MM" para o eixo X do gráfico
  total:       number | null; // null preserva gap visual no gráfico
  isMigration: boolean;
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Última linha com Total preenchido — equivale a sheetsService.getLatestTotal().
 */
export async function getLatestTotal(): Promise<SheetTotal> {
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_HISTORY_TABLE)
    .select('id, "Data", "Total", "Crescimento"')
    .not('Total', 'is', null)
    .order('Data', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Nenhum dado de Total encontrado no Supabase');

  const row = data as Pick<SubscriptionsHistoryRow, 'id' | 'Data' | 'Total' | 'Crescimento'>;

  // Formata "YYYY-MM-DD" → "DD/MM/YYYY" para compatibilidade com o frontend
  const [y, m, d] = row.Data.split('-');
  const dateBR = `${d}/${m}/${y}`;

  return {
    total:   row.Total,
    date:    dateBR,
    weekNum: row.id,
    growth:  row.Crescimento,
  };
}

/**
 * Últimas 52 semanas para o gráfico histórico — equivale a sheetsService.getHistoricalChart().
 * Lacunas (Total null) NÃO são interpoladas.
 * Semanas de migração (fev/2026) retornam isMigration: true.
 */
export async function getHistoricalChart(): Promise<HistoricalPoint[]> {
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_HISTORY_TABLE)
    .select('"Data", "Total"')
    .gte('Data', cutoffDate())
    .order('Data', { ascending: true })
    .limit(WEEKS_WINDOW);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as Pick<SubscriptionsHistoryRow, 'Data' | 'Total'>;
    return {
      date:        toDDMM(r.Data),
      total:       r.Total ?? null,
      isMigration: MIGRATION_DATES.has(r.Data),
    };
  });
}

/**
 * Histórico completo como linhas brutas — usado internamente se necessário.
 */
export async function getHistoricalSubscriptions(): Promise<SubscriptionsHistoryRow[]> {
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_HISTORY_TABLE)
    .select('*')
    .gte('Data', cutoffDate())
    .order('Data', { ascending: true })
    .limit(WEEKS_WINDOW);

  if (error) throw error;
  return (data ?? []) as SubscriptionsHistoryRow[];
}

/** Sem-op — mantido para não quebrar chamadas existentes (não há cache no Supabase). */
export function clearCache(): void {}
