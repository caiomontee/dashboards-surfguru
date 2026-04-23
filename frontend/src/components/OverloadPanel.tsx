import { useState } from 'react';
import MetricCard from './MetricCard';
import { calculateMetrics, type CalculateResult } from '../api/metricsApi';

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatRatio(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)}x`;
}

export default function OverloadPanel() {
  const [report, setReport] = useState('');
  const [lifetimeMonths, setLifetimeMonths] = useState(12);
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    if (!report.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await calculateMetrics(report, lifetimeMonths, periodDays));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao calcular métricas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const ratio = result?.financial.ltvCacRatio ?? null;
  const ratioColor: 'green' | 'amber' | 'rose' =
    ratio === null ? 'amber' : ratio >= 3 ? 'green' : ratio >= 1 ? 'amber' : 'rose';

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-slate-100">
        Saúde Financeira — CAC &amp; LTV
      </h2>
      <p className="mb-4 text-sm text-slate-400">
        Cole o relatório da Overload abaixo. O backend extrai o custo total e cruza com os
        assinantes do período para calcular CAC, LTV e o ratio.
      </p>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        {/* Textarea */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <textarea
            rows={9}
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Cole aqui o relatório de texto da Overload (custos de marketing, ads, etc.)…"
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
          />
        </div>

        {/* Config + botão */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Período de análise (dias)
            </label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-ocean-500 focus:outline-none"
            >
              <option value={1}>Hoje (24h)</option>
              <option value={7}>Semana (7d)</option>
              <option value={15}>Quinzena (15d)</option>
              <option value={30}>Mês (30d)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Lifetime estimado (meses) para LTV
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={lifetimeMonths}
              onChange={(e) => setLifetimeMonths(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-ocean-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-600">
              LTV = ARPU × {lifetimeMonths} meses
            </p>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading || !report.trim()}
            className="mt-auto rounded-xl bg-ocean-600 px-4 py-3 font-semibold text-white transition hover:bg-ocean-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Calculando…' : 'Calcular Métricas'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-700 bg-rose-900/30 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.costs.warning && (
            <div className="mb-4 rounded-lg border border-amber-700 bg-amber-900/20 p-3 text-sm text-amber-300">
              ⚠ {result.costs.warning}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard
              label="Custo Total (período)"
              value={formatBRL(result.costs.total)}
              sub={`Extraído de: "${result.costs.parsedFrom}"`}
              color="amber"
            />
            <MetricCard
              label="CAC"
              value={formatBRL(result.financial.cac)}
              sub={`${result.acquisition.newSubscribers} novos assinantes`}
              color="rose"
            />
            <MetricCard
              label="LTV"
              value={formatBRL(result.financial.ltv)}
              sub={`ARPU ${formatBRL(result.financial.arpu)} × ${result.financial.lifetimeMonthsUsed}m`}
              color="green"
            />
            <MetricCard
              label="Ratio LTV:CAC"
              value={formatRatio(result.financial.ltvCacRatio)}
              sub={
                result.financial.ltvCacRatio !== null
                  ? result.financial.ltvCacRatio >= 3
                    ? '✓ Saudável (≥ 3x)'
                    : result.financial.ltvCacRatio >= 1
                    ? '⚠ Atenção (1–3x)'
                    : '✗ Crítico (< 1x)'
                  : 'CAC não calculável'
              }
              color={ratioColor}
              highlight
            />
          </div>

          <p className="mt-3 text-xs text-slate-600">
            Período: {new Date(result.period.from).toLocaleDateString('pt-BR')} →{' '}
            {new Date(result.period.to).toLocaleDateString('pt-BR')} |{' '}
            {result.financial.activeSubscribers} assinantes ativos considerados para ARPU
          </p>
        </>
      )}
    </section>
  );
}
