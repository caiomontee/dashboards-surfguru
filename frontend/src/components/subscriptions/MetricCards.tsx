import { Users, TrendingUp, UserPlus, Activity, UserMinus, Calendar, CalendarCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSheetTotal, fetchPagarmeSummary, fetchPlanSplit } from '../../api/subscriptionsApi';
import SourceBadge from './SourceBadge';
import type { SubscriptionPeriod } from '../../types/subscriptions';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  });
}

function Skeleton() {
  return <div className="h-8 w-3/4 animate-pulse rounded-md bg-panel-raised" />;
}

interface CardProps {
  label:   string;
  value:   string;
  icon:    React.ReactNode;
  iconBg:  string;
  source:  'sheet' | 'pagarme';
  loading: boolean;
  error:   boolean;
  note?:   string;
}

function Card({ label, value, icon, iconBg, source, loading, error, note }: CardProps) {
  return (
    <div className="glass-card px-5 py-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted leading-tight">{label}</span>
        <span className={`rounded-lg p-1.5 ${iconBg}`}>{icon}</span>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <span className="text-sm font-medium text-negative">Erro ao carregar</span>
      ) : (
        <span className="text-2xl font-bold text-ink-primary tracking-tight">{value}</span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <SourceBadge source={source} />
        {note && !error && (
          <span className="text-[10px] text-ink-muted">{note}</span>
        )}
      </div>
    </div>
  );
}

interface Props { period: SubscriptionPeriod; }

export default function MetricCards({ period }: Props) {
  const sheetQ = useQuery({
    queryKey: ['subscriptions', 'total'],
    queryFn:  fetchSheetTotal,
    staleTime: 60 * 60 * 1000, // 1h — planilha é semanal
    retry: 2,
  });

  const pagarmeQ = useQuery({
    queryKey: ['subscriptions', 'pagarme-summary', period.from.toISOString(), period.to.toISOString()],
    queryFn:  () => fetchPagarmeSummary(period.from, period.to),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const planSplitQ = useQuery({
    queryKey: ['subscriptions', 'plan-split'],
    queryFn:  fetchPlanSplit,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const sheet     = sheetQ.data;
  const pagarme   = pagarmeQ.data;
  const planSplit = planSplitQ.data;

  const growthStr = sheet?.growth == null
    ? '—'
    : sheet.growth >= 0
      ? `+${sheet.growth.toLocaleString('pt-BR')}`
      : sheet.growth.toLocaleString('pt-BR');

  return (
    <>
      <Card
        label="Total Geral de Assinantes"
        value={(sheet?.total ?? 0).toLocaleString('pt-BR')}
        icon={<Users size={16} />}
        iconBg="bg-blue-50 text-primary"
        source="sheet"
        loading={sheetQ.isPending}
        error={sheetQ.isError}
        note={sheet ? `Semana ${sheet.weekNum} · ${sheet.date}` : undefined}
      />

      <Card
        label="MRR (Receita Mensal)"
        value={formatBRL(pagarme?.mrr ?? 0)}
        icon={<TrendingUp size={16} />}
        iconBg="bg-emerald-50 text-positive"
        source="pagarme"
        loading={pagarmeQ.isPending}
        error={pagarmeQ.isError}
        note={pagarme ? `${pagarme.activeCount.toLocaleString('pt-BR')} ativos` : undefined}
      />

      <Card
        label="Novas Assinaturas no Período"
        value={`+${(pagarme?.newInPeriod ?? 0).toLocaleString('pt-BR')}`}
        icon={<UserPlus size={16} />}
        iconBg="bg-orange-50 text-accent"
        source="pagarme"
        loading={pagarmeQ.isPending}
        error={pagarmeQ.isError}
        note={`${period.from.toLocaleDateString('pt-BR')} – ${period.to.toLocaleDateString('pt-BR')}`}
      />

      <Card
        label="Crescimento Semanal"
        value={sheetQ.isPending ? '' : growthStr}
        icon={<Activity size={16} />}
        iconBg="bg-violet-50 text-violet-600"
        source="sheet"
        loading={sheetQ.isPending}
        error={sheetQ.isError}
        note="vs. semana anterior"
      />

      <Card
        label="Churn Rate"
        value={pagarmeQ.isPending ? '' : `${(pagarme?.churnRate ?? 0).toFixed(2)}%`}
        icon={<UserMinus size={16} />}
        iconBg="bg-red-50 text-negative"
        source="pagarme"
        loading={pagarmeQ.isPending}
        error={pagarmeQ.isError}
        note={pagarme
          ? `${pagarme.canceledInPeriod} cancelamentos · % da base ativa`
          : undefined}
      />

      <Card
        label="Assinantes Mensais"
        value={(planSplit?.monthly ?? 0).toLocaleString('pt-BR')}
        icon={<Calendar size={16} />}
        iconBg="bg-sky-50 text-sky-600"
        source="pagarme"
        loading={planSplitQ.isPending}
        error={planSplitQ.isError}
        note="plano mensal · ativos"
      />

      <Card
        label="Assinantes Anuais"
        value={(planSplit?.annual ?? 0).toLocaleString('pt-BR')}
        icon={<CalendarCheck size={16} />}
        iconBg="bg-amber-50 text-amber-600"
        source="pagarme"
        loading={planSplitQ.isPending}
        error={planSplitQ.isError}
        note="plano anual · ativos"
      />
    </>
  );
}
