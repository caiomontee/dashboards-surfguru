import { MousePointerClick, UserPlus, Percent } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchConversion } from '../api/metricsApi';
import SourceBadge from './subscriptions/SourceBadge';

function Skeleton() {
  return <div className="h-8 w-3/4 animate-pulse rounded-md bg-panel-raised" />;
}

interface CardProps {
  label:   string;
  value:   string;
  note:    string;
  icon:    React.ReactNode;
  iconBg:  string;
  source:  'sheet' | 'pagarme' | 'ga4';
  loading: boolean;
  error:   boolean;
}

function Card({ label, value, note, icon, iconBg, source, loading, error }: CardProps) {
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

export default function ConversionCard() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['metrics', 'conversion'],
    queryFn:  fetchConversion,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });

  return (
    <>
      <Card
        label="Acessos à Página /planos"
        value={(data?.acessos ?? 0).toLocaleString('pt-BR')}
        note="últimos 30 dias"
        icon={<MousePointerClick size={16} />}
        iconBg="bg-violet-50 text-violet-600"
        source="ga4"
        loading={isPending}
        error={isError}
      />
      <Card
        label="Novas Assinaturas Ativas"
        value={(data?.assinaturas ?? 0).toLocaleString('pt-BR')}
        note="últimos 30 dias"
        icon={<UserPlus size={16} />}
        iconBg="bg-emerald-50 text-positive"
        source="pagarme"
        loading={isPending}
        error={isError}
      />
      <Card
        label="Taxa de Conversão"
        value={isPending ? '' : `${(data?.taxaConversao ?? 0).toFixed(2)}%`}
        note="(Assinaturas / Acessos) × 100"
        icon={<Percent size={16} />}
        iconBg="bg-orange-50 text-accent"
        source="pagarme"
        loading={isPending}
        error={isError}
      />
    </>
  );
}
