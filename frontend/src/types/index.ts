export interface DateRange {
  from: Date;
  to: Date;
}

export interface AcquisitionData {
  hoje: number;
  semana: number;
  quinzena: number;
  mes: number;
  ano: number;
  updatedAt: string;
}

export interface FinancialData {
  cac: number | null;
  ltv: number;
  ltvCacRatio: number | null;
  arpu: number;
  activeSubscribers: number;
  lifetimeMonthsUsed: number;
  retentionMonths: number;
  totalCost: number;
  newSubscribers: number;
  parsedFrom: string;
  warning?: string;
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

export interface LTVCACPoint {
  month: string;
  cac: number;
  ltv: number;
  ratio: number;
}
