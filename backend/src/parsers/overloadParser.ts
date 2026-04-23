/**
 * Parser do relatório de texto da Overload.
 *
 * Estratégia de extração (em ordem de prioridade):
 * 1. Busca uma linha de "Total" explícita com valor monetário
 * 2. Busca keywords de custo (Investimento, Gasto, Verba, etc.)
 * 3. Soma todos os valores monetários encontrados (fallback)
 *
 * Suporta formatos brasileiros: R$ 1.234,56 e 1234.56
 */

export interface ParseResult {
  totalCost: number;       // valor em reais
  currency: string;        // 'BRL'
  matchedLabel: string;    // label da linha que gerou o valor
  rawMatches: string[];    // todos os valores encontrados no relatório
  warning?: string;        // aviso se a extração foi ambígua
}

// Converte string numérica (BR ou EN) para float
function parseBrazilianNumber(raw: string): number {
  const cleaned = raw.trim();

  // Formato BR: 1.234,56
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }

  // Formato BR sem centavos: 1.234
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, ''));
  }

  // Formato EN: 1,234.56
  if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/,/g, ''));
  }

  // Número simples
  return parseFloat(cleaned.replace(',', '.'));
}

// Extrai todos os valores monetários de uma linha
function extractValuesFromLine(line: string): number[] {
  // Captura valores precedidos opcionalmente por R$
  const pattern = /R?\$?\s*([\d.,]+)/gi;
  const results: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    const val = parseBrazilianNumber(match[1]);
    if (!isNaN(val) && val > 0) results.push(val);
  }

  return results;
}

// Keywords de prioridade alta → indica custo total do período
const HIGH_PRIORITY_LABELS = [
  'total gasto',
  'total investido',
  'total de custos',
  'custo total',
  'gasto total',
  'investimento total',
  'total',
];

// Keywords de prioridade média → indica um custo relevante
const MEDIUM_PRIORITY_LABELS = [
  'investimento',
  'gasto',
  'custo',
  'verba',
  'budget',
  'despesa',
  'marketing',
  'mídia paga',
  'tráfego pago',
  'ads',
  'meta ads',
  'google ads',
];

export function parseOverloadReport(text: string): ParseResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rawMatches: string[] = [];

  // Tenta prioridade alta primeiro
  for (const line of lines) {
    const lower = line.toLowerCase();
    const isHighPriority = HIGH_PRIORITY_LABELS.some((label) =>
      lower.includes(label),
    );

    if (isHighPriority) {
      const values = extractValuesFromLine(line);
      if (values.length > 0) {
        const cost = values[values.length - 1]; // pega o último valor da linha
        rawMatches.push(line);
        return {
          totalCost: cost,
          currency: 'BRL',
          matchedLabel: line,
          rawMatches,
        };
      }
    }
  }

  // Prioridade média: soma todos os custos encontrados
  const mediumMatches: Array<{ label: string; value: number }> = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const isMediumPriority = MEDIUM_PRIORITY_LABELS.some((label) =>
      lower.includes(label),
    );

    if (isMediumPriority) {
      const values = extractValuesFromLine(line);
      if (values.length > 0) {
        rawMatches.push(line);
        mediumMatches.push({ label: line, value: values[values.length - 1] });
      }
    }
  }

  if (mediumMatches.length > 0) {
    const totalCost = mediumMatches.reduce((sum, m) => sum + m.value, 0);
    const isSingleSource = mediumMatches.length === 1;
    return {
      totalCost,
      currency: 'BRL',
      matchedLabel: isSingleSource
        ? mediumMatches[0].label
        : `${mediumMatches.length} linhas somadas`,
      rawMatches,
      warning: isSingleSource
        ? undefined
        : `Nenhum "Total" encontrado. Somados ${mediumMatches.length} valores de custo encontrados.`,
    };
  }

  // Fallback: soma de TODOS os valores monetários do relatório
  let allValues: number[] = [];
  for (const line of lines) {
    const values = extractValuesFromLine(line);
    allValues = allValues.concat(values);
    if (values.length > 0) rawMatches.push(line);
  }

  if (allValues.length > 0) {
    const totalCost = allValues.reduce((a, b) => a + b, 0);
    return {
      totalCost,
      currency: 'BRL',
      matchedLabel: 'soma de todos os valores (fallback)',
      rawMatches,
      warning:
        'Não foram encontradas keywords de custo. Todos os valores monetários do relatório foram somados — verifique se o resultado faz sentido.',
    };
  }

  return {
    totalCost: 0,
    currency: 'BRL',
    matchedLabel: 'nenhum valor encontrado',
    rawMatches: [],
    warning: 'Nenhum valor monetário foi encontrado no relatório colado.',
  };
}
