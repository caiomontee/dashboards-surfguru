export type SubscriptionStatus = 'active' | 'canceled' | 'paused' | 'unpaid' | 'trial' | 'ended';

export type PeriodPreset = 'today' | 'yesterday' | '7d' | '15d' | '30d' | 'custom';

export interface SubscriptionPeriod {
  preset: PeriodPreset;
  from: Date;
  to: Date;
}

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

export interface ChartPoint {
  date: string;
  value: number;
}

export type ChartMetric = 'subscribers' | 'mrr' | 'cancellations';

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
