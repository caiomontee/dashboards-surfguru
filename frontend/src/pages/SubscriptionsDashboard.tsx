import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PeriodSelector, { buildPeriod } from '../components/subscriptions/PeriodSelector';
import MetricCards from '../components/subscriptions/MetricCards';
import ChargesCards from '../components/subscriptions/ChargesCards';
import SubscriptionsChart from '../components/subscriptions/SubscriptionsChart';
import SubscriptionsTable from '../components/subscriptions/SubscriptionsTable';
import ConversionCard from '../components/ConversionCard';
import ConversionFunnelChart from '../components/ConversionFunnelChart';
import PlanDonutChart from '../components/charts/executive/PlanDonutChart';
import type { SubscriptionPeriod } from '../types/subscriptions';
import type { SheetTotal, PagarmeSummary, ChargesSummary, PlanSplit } from '../api/subscriptionsApi';
import { fetchSheetTotal, fetchPagarmeSummary, fetchChargesSummary, fetchPlanSplit } from '../api/subscriptionsApi';
import { generateReport, buildWhatsAppText, type ReportData } from '../utils/generateReport';

export default function SubscriptionsDashboard() {
  const [period, setPeriod]             = useState<SubscriptionPeriod>(() => buildPeriod('30d'));
  const [isDownloading, setDownloading] = useState(false);
  const [isSharing, setSharing]         = useState(false);
  const qc = useQueryClient();

  // Lê do cache do React Query (já carregado pelos componentes filhos),
  // fazendo fetch apenas do que ainda não estiver disponível.
  async function getMetrics(): Promise<ReportData> {
    const fromISO = period.from.toISOString();
    const toISO   = period.to.toISOString();

    const [sheet, pagarme, charges, plans] = await Promise.all([
      qc.getQueryData<SheetTotal>(['subscriptions', 'total'])
        ?? qc.fetchQuery({ queryKey: ['subscriptions', 'total'], queryFn: fetchSheetTotal }),
      qc.getQueryData<PagarmeSummary>(['subscriptions', 'pagarme-summary', fromISO, toISO])
        ?? qc.fetchQuery({ queryKey: ['subscriptions', 'pagarme-summary', fromISO, toISO], queryFn: () => fetchPagarmeSummary(period.from, period.to) }),
      qc.getQueryData<ChargesSummary>(['subscriptions', 'charges-summary', fromISO, toISO])
        ?? qc.fetchQuery({ queryKey: ['subscriptions', 'charges-summary', fromISO, toISO], queryFn: () => fetchChargesSummary(period.from, period.to) }),
      qc.getQueryData<PlanSplit>(['subscriptions', 'plan-split'])
        ?? qc.fetchQuery({ queryKey: ['subscriptions', 'plan-split'], queryFn: fetchPlanSplit }),
    ]);

    return { sheet: sheet!, pagarme: pagarme!, charges: charges!, plans: plans!, period };
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await generateReport(await getMetrics());
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    // Abre janela imediatamente (gesto do usuário) para evitar bloqueio de popup
    const win = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const text    = buildWhatsAppText(await getMetrics());
      const encoded = encodeURIComponent(text);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const url = isMobile
        ? `whatsapp://send?text=${encoded}`
        : `https://web.whatsapp.com/send?text=${encoded}`;
      if (win) win.location.href = url; else window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      win?.close();
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            onDownload={handleDownload}
            onShare={handleShare}
            isDownloading={isDownloading}
            isSharing={isSharing}
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

      {/* ── Taxa de Conversão /planos ─────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Taxa de Conversão · /planos
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ConversionCard />
        </div>
        <div className="mt-4">
          <ConversionFunnelChart />
        </div>
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

      {/* ── Gráfico histórico + Distribuição de Planos ───────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <SubscriptionsChart />
        <PlanDonutChart />
      </div>

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
