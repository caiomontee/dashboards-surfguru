import { useState } from 'react';
import { FileText, Zap, AlertTriangle } from 'lucide-react';
import { calculateMetrics } from '../api/metricsApi';
import type { DateRange, FinancialData } from '../types';
import { diffDays } from '../utils/dateUtils';

interface Props {
  dateRange: DateRange;
  onResult: (data: FinancialData) => void;
  onLoading: (v: boolean) => void;
}

export default function OverloadImport({ dateRange, onResult, onLoading }: Props) {
  const [report, setReport]               = useState('');
  const [lifetimeMonths, setLifetimeMonths] = useState(12);
  const [processing, setProcessing]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [lastParsed, setLastParsed]       = useState<string | null>(null);

  async function handleProcess() {
    if (!report.trim()) return;
    setProcessing(true);
    onLoading(true);
    setError(null);

    try {
      const periodDays = diffDays(dateRange.from, dateRange.to);
      const result = await calculateMetrics(report, lifetimeMonths, periodDays);
      setLastParsed(result.costs.parsedFrom);
      onResult({
        cac:               result.financial.cac,
        ltv:               result.financial.ltv,
        ltvCacRatio:       result.financial.ltvCacRatio,
        arpu:              result.financial.arpu,
        activeSubscribers: result.financial.activeSubscribers,
        lifetimeMonthsUsed: result.financial.lifetimeMonthsUsed,
        retentionMonths:   result.financial.retentionMonths,
        totalCost:         result.costs.total,
        newSubscribers:    result.acquisition.newSubscribers,
        parsedFrom:        result.costs.parsedFrom,
        warning:           result.costs.warning,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar dados');
    } finally {
      setProcessing(false);
      onLoading(false);
    }
  }

  return (
    <section className="glass-card overflow-hidden border-l-4 border-l-accent p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText size={18} className="text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">
          Importação de Custos — Overload
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <textarea
            rows={7}
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Cole o texto do relatório de custos da Overload aqui...&#10;&#10;O sistema extrai automaticamente os valores de investimento,&#10;custos de mídia paga e total de campanha."
            className="input-base w-full resize-y text-sm leading-relaxed"
          />
          {lastParsed && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-muted">
              <span className="text-positive">✓</span>
              Extraído de: <em>"{lastParsed}"</em>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
              Lifetime estimado (meses)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={lifetimeMonths}
              onChange={(e) => setLifetimeMonths(Number(e.target.value))}
              className="input-base w-full"
            />
            <p className="mt-1 text-xs text-ink-muted">LTV = ARPU × {lifetimeMonths} meses</p>
          </div>

          <div className="rounded-lg border border-panel-border bg-panel-base p-3 text-xs text-ink-muted space-y-1">
            <p className="font-medium text-ink-secondary">Período selecionado</p>
            <p>{dateRange.from.toLocaleDateString('pt-BR')} → {dateRange.to.toLocaleDateString('pt-BR')}</p>
            <p>({diffDays(dateRange.from, dateRange.to)} dias)</p>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing || !report.trim()}
            className="btn-primary mt-auto flex items-center justify-center gap-2 py-3"
          >
            <Zap size={14} />
            {processing ? 'Processando…' : 'Processar Dados'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </section>
  );
}
