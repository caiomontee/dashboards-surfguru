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

// Retorna "YYYY-MM-DD" da segunda-feira mais recente (local), sem depender de UTC
function getMostRecentMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  const daysBack = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDays(isoDate: string, n: number): string {
  const [y, mo, d] = isoDate.split('-').map(Number);
  const date = new Date(y, mo - 1, d + n);
  const yr = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yr}-${mm}-${dd}`;
}

// Total da segunda-feira da janela [from, to): primeiro dia disponível,
// desempate pelo id mais alto (snapshot mais recente do mesmo dia)
async function getMondayTotalInWindow(from: string, to: string): Promise<number | null> {
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_HISTORY_TABLE)
    .select('"Total"')
    .gte('Data', from)
    .lt('Data', to)
    .not('Total', 'is', null)
    .order('Data', { ascending: true })
    .order('id',   { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Pick<SubscriptionsHistoryRow, 'Total'> | null)?.Total ?? null;
}

// Crescimento semanal = total da segunda atual − total da segunda anterior
async function calcWeeklyGrowth(): Promise<number | null> {
  const thisMonday = getMostRecentMonday();
  const prevMonday = shiftDays(thisMonday, -7);
  const nextMonday = shiftDays(thisMonday,  7);

  const [thisWeek, prevWeek] = await Promise.all([
    getMondayTotalInWindow(thisMonday, nextMonday),
    getMondayTotalInWindow(prevMonday, thisMonday),
  ]);

  if (thisWeek === null || prevWeek === null) return null;
  return thisWeek - prevWeek;
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
  const [rowResult, growth] = await Promise.all([
    supabase
      .from(SUBSCRIPTIONS_HISTORY_TABLE)
      .select('id, "Data", "Total"')
      .not('Total', 'is', null)
      .order('Data', { ascending: false })
      .order('id',   { ascending: false })
      .limit(1)
      .maybeSingle(),
    calcWeeklyGrowth(),
  ]);

  if (rowResult.error) throw rowResult.error;
  if (!rowResult.data) throw new Error('Nenhum dado de Total encontrado no Supabase');

  const row = rowResult.data as Pick<SubscriptionsHistoryRow, 'id' | 'Data' | 'Total'>;

  const [y, m, d] = row.Data.split('-');
  const dateBR = `${d}/${m}/${y}`;

  return {
    total:   row.Total,
    date:    dateBR,
    weekNum: row.id,
    growth,
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
