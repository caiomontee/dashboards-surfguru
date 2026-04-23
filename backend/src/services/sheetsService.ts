import axios from 'axios';

// ── Configuração ──────────────────────────────────────────────────────────────
// Planilha pública — exportação CSV sem necessidade de autenticação.
const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1JefzvrhqxRFvvjbkNJH7AoM0topxLUPCD4PNdht5ws8/export?format=csv&gid=1321523782';

// Índices das colunas (baseado no cabeçalho verificado em 23/04/2026):
// Semana | Data | Total Pago Pagar.me | Pagar.me (Trial) | Pagseguro | Paypal |
// PIX | Boleto | Assinantes Via ADS | Cancelados | Não Pagos |
// Total | Crescimento | Mês | Receita Prevista | Pagar.me (debito) | ...notas
const COL_WEEK   = 0;
const COL_DATE   = 1;
const COL_TOTAL  = 11;  // coluna "Total" — soma de todas as plataformas
const COL_GROWTH = 12;  // coluna "Crescimento" — delta semana anterior

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface SheetRow {
  weekNum:      number;
  date:         Date;
  rawDate:      string;        // "DD/MM/YYYY" original da planilha
  total:        number | null; // null = célula vazia (não interpolar)
  growth:       number | null;
  isMigration:  boolean;       // linha marcada como semana de migração
}

export interface SheetTotal {
  total:    number;
  date:     string;   // rawDate da última linha não-vazia
  weekNum:  number;
  growth:   number | null;
}

export interface HistoricalPoint {
  date:        string;        // "DD/MM" para o eixo X do gráfico
  total:       number | null; // null mantém o gap visual no gráfico (sem interpolação)
  isMigration: boolean;
}

// ── Helpers de parse ──────────────────────────────────────────────────────────

// Converte número no formato brasileiro: "1.078" → 1078 | "3,5" → 3.5
function parseBRNumber(s: string): number | null {
  const t = (s ?? '').trim();
  if (!t) return null;
  const clean = t.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

// Converte "DD/MM/YYYY" em Date
function parseBRDate(s: string): Date | null {
  const parts = (s ?? '').trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if ([d, m, y].some(isNaN) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return new Date(y, m - 1, d);
}

// ── Cache em memória (TTL = 5min por padrão, invalidável via clearCache()) ──────
let cache: { rows: SheetRow[]; at: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/** Invalida o cache imediatamente — próxima chamada busca dados frescos. */
export function clearCache(): void {
  cache = null;
}

async function fetchAndParse(): Promise<SheetRow[]> {
  const { data } = await axios.get<string>(SHEETS_CSV_URL, {
    responseType: 'text',
    timeout: 15_000,
    headers: { 'Accept-Encoding': 'gzip' },
  });

  const lines = data
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter(Boolean);

  const rows: SheetRow[] = [];

  // i=1 pula o cabeçalho
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');

    const weekNum = parseInt(cols[COL_WEEK] ?? '', 10);
    if (!weekNum || isNaN(weekNum)) continue;

    const date = parseBRDate(cols[COL_DATE] ?? '');
    if (!date) continue;

    const total  = parseBRNumber(cols[COL_TOTAL]  ?? '');
    const growth = parseBRNumber(cols[COL_GROWTH] ?? '');

    // Nota de migração aparece nas colunas além do índice 14
    const isMigration = cols.slice(14).some((c) => c.toUpperCase().includes('MIGRA'));

    rows.push({
      weekNum,
      date,
      rawDate:     (cols[COL_DATE] ?? '').trim(),
      total,
      growth,
      isMigration,
    });
  }

  return rows;
}

export async function getSheetRows(): Promise<SheetRow[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rows;
  const rows = await fetchAndParse();
  cache = { rows, at: Date.now() };
  return rows;
}

// ── API pública do serviço ────────────────────────────────────────────────────

/**
 * Retorna o total de assinantes da última semana com dado preenchido.
 * Fonte: coluna "Total" da planilha (última linha não-nula).
 */
export async function getLatestTotal(): Promise<SheetTotal> {
  const rows = await getSheetRows();
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r.total !== null) {
      return { total: r.total, date: r.rawDate, weekNum: r.weekNum, growth: r.growth };
    }
  }
  throw new Error('Nenhum dado de Total encontrado na planilha');
}

/**
 * Retorna os pontos semanais do último ano para o gráfico histórico.
 * Lacunas (total === null) NÃO são interpoladas — são exibidas como gaps.
 * Semanas de migração são marcadas com isMigration = true.
 */
export async function getHistoricalChart(): Promise<HistoricalPoint[]> {
  const rows   = await getSheetRows();
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  return rows
    .filter((r) => r.date >= cutoff)
    .map((r) => {
      const dd = String(r.date.getDate()).padStart(2, '0');
      const mm = String(r.date.getMonth() + 1).padStart(2, '0');
      return {
        date:        `${dd}/${mm}`,
        total:       r.total,     // null preservado intencionalmente
        isMigration: r.isMigration,
      };
    });
}
