import { TrendingUp, Target, Ratio, Clock } from 'lucide-react';
import KPICard from './KPICard';
import type { FinancialData } from '../types';

function brl(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

interface Props {
  data: FinancialData | null;
  loading?: boolean;
}

export default function FinancialKPIs({ data, loading = false }: Props) {
  const ratio = data?.ltvCacRatio ?? null;
  const ratioVariant =
    ratio === null ? 'default' :
    ratio >= 3    ? 'positive' :
    ratio >= 1    ? 'caution'  : 'negative';
  const ratioBadge =
    ratio === null ? undefined :
    ratio >= 3    ? { text: '✓ Saudável', variant: 'positive' as const } :
    ratio >= 1    ? { text: '⚠ Atenção',  variant: 'caution'  as const } :
                    { text: '✗ Crítico',  variant: 'negative' as const };

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">
          Saúde Financeira
        </h2>
        {!data && !loading && (
          <span className="text-xs text-ink-muted">
            — cole o relatório Overload e clique em Processar
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="LTV (Lifetime Value)"
          value={brl(data?.ltv ?? null)}
          sub={data ? `ARPU ${brl(data.arpu)} × ${data.lifetimeMonthsUsed}m` : 'aguardando dados'}
          icon={<TrendingUp size={16} />}
          loading={loading}
          variant="positive"
        />
        <KPICard
          label="CAC (Custo de Aquisição)"
          value={brl(data?.cac ?? null)}
          sub={data?.newSubscribers ? `${data.newSubscribers} novos · custo ${brl(data.totalCost)}` : 'aguardando dados'}
          icon={<Target size={16} />}
          loading={loading}
          variant={data?.cac ? 'caution' : 'default'}
        />
        <KPICard
          label="Ratio LTV : CAC"
          value={ratio !== null ? `${ratio.toFixed(1)}x` : '—'}
          sub={data?.activeSubscribers ? `${data.activeSubscribers} assinantes ativos` : 'aguardando dados'}
          icon={<Ratio size={16} />}
          loading={loading}
          variant={ratioVariant}
          badge={ratioBadge}
        />
        <KPICard
          label="Tempo de Retenção"
          value={data ? `${data.retentionMonths}m` : '—'}
          sub={data ? 'premissa do LTV' : 'aguardando dados'}
          icon={<Clock size={16} />}
          loading={loading}
          variant="default"
        />
      </div>

      {data?.warning && (
        <p className="mt-3 text-xs text-caution">⚠ {data.warning}</p>
      )}
    </section>
  );
}
