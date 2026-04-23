import axios from 'axios';

const api = axios.create({ baseURL: '/api/metrics' });

export interface AcquisitionData {
  hoje: number;
  semana: number;
  quinzena: number;
  mes: number;
  ano: number;
  updatedAt: string;
}

export interface CalculateResult {
  period: { days: number; from: string; to: string };
  acquisition: { newSubscribers: number };
  costs: {
    total: number;
    currency: string;
    parsedFrom: string;
    warning?: string;
  };
  financial: {
    cac: number | null;
    ltv: number;
    ltvCacRatio: number | null;
    arpu: number;
    activeSubscribers: number;
    lifetimeMonthsUsed: number;
    retentionMonths: number;
  };
}

export interface EvolutionPoint {
  date: string;
  subscribers: number;
}

export interface ComparisonPoint {
  label: string;
  current: number;
  previous: number;
}

export async function fetchAcquisition(): Promise<AcquisitionData> {
  const { data } = await api.get<AcquisitionData>('/acquisition');
  return data;
}

export async function fetchEvolution(
  from: Date,
  to: Date,
  granularity: 'day' | 'week' | 'month',
): Promise<EvolutionPoint[]> {
  const { data } = await api.get<EvolutionPoint[]>('/evolution', {
    params: { from: from.toISOString(), to: to.toISOString(), granularity },
  });
  return data;
}

export async function fetchComparison(
  from: Date,
  to: Date,
): Promise<ComparisonPoint[]> {
  const { data } = await api.get<ComparisonPoint[]>('/comparison', {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return data;
}

export async function calculateMetrics(
  overloadReport: string,
  lifetimeMonths: number,
  periodDays: number,
): Promise<CalculateResult> {
  const { data } = await api.post<CalculateResult>('/calculate', {
    overloadReport,
    lifetimeMonths,
    periodDays,
  });
  return data;
}
