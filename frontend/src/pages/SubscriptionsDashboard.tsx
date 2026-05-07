import { useState } from 'react';
import PeriodSelector, { buildPeriod } from '../components/subscriptions/PeriodSelector';
import MetricCards from '../components/subscriptions/MetricCards';
import ChargesCards from '../components/subscriptions/ChargesCards';
import SubscriptionsChart from '../components/subscriptions/SubscriptionsChart';
import SubscriptionsTable from '../components/subscriptions/SubscriptionsTable';
import type { SubscriptionPeriod } from '../types/subscriptions';

export default function SubscriptionsDashboard() {
  const [period, setPeriod] = useState<SubscriptionPeriod>(() => buildPeriod('30d'));

  return (
    <div className="space-y-6">

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            onDownload={() => {}}
          />
        </div>

        {/* Legenda das fontes */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Supabase
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            API Pagar.me
          </span>
        </div>
      </div>

      {/* ── Cards de KPI ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <MetricCards period={period} />
      </div>

      {/* ── Cards de Cobranças (TPV) ──────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Volume de Cobranças · Pagar.me
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ChargesCards period={period} />
        </div>
      </div>

      {/* ── Gráfico histórico anual ───────────────────────────────── */}
      <SubscriptionsChart />

      {/* ── Tabela detalhada ─────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Detalhamento Pagar.me
        </p>
        <SubscriptionsTable />
      </div>

    </div>
  );
}
