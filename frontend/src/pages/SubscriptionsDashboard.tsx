import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import PeriodSelector, { buildPeriod } from '../components/subscriptions/PeriodSelector';
import MetricCards from '../components/subscriptions/MetricCards';
import ChargesCards from '../components/subscriptions/ChargesCards';
import SubscriptionsChart from '../components/subscriptions/SubscriptionsChart';
import SubscriptionsTable from '../components/subscriptions/SubscriptionsTable';
import { refreshSheetCache } from '../api/subscriptionsApi';
import type { SubscriptionPeriod } from '../types/subscriptions';

export default function SubscriptionsDashboard() {
  const [period, setPeriod]       = useState<SubscriptionPeriod>(() => buildPeriod('30d'));
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  async function handleRefresh() {
    setRefreshing(true);
    try {
      // Invalida cache no backend e depois invalida queries no frontend
      await refreshSheetCache();
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'total'] });
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'historical'] });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Filtros + Atualizar ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            onDownload={() => {}}
          />

          {/* Botão de refresh da planilha */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Busca os dados mais recentes da planilha agora (ignora o cache)"
            className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-surface px-4 py-2 text-sm font-medium text-ink-secondary shadow-sm transition hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar planilha'}
          </button>
        </div>

        {/* Legenda das fontes */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Planilha Geral
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
