import { CreditCard, CheckCircle, Hash, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchChargesSummary } from '../../api/subscriptionsApi';
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
  loading: boolean;
  error:   boolean;
  note?:   string;
}

function Card({ label, value, icon, iconBg, loading, error, note }: CardProps) {
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
        <SourceBadge source="pagarme" />
        {note && !error && (
          <span className="text-[10px] text-ink-muted">{note}</span>
        )}
      </div>
    </div>
  );
}

interface Props { period: SubscriptionPeriod; }

export default function ChargesCards({ period }: Props) {
  const chargesQ = useQuery({
    queryKey: ['subscriptions', 'charges-summary', period.from.toISOString(), period.to.toISOString()],
    queryFn:  () => fetchChargesSummary(period.from, period.to),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const d = chargesQ.data;
  const periodNote = `${period.from.toLocaleDateString('pt-BR')} – ${period.to.toLocaleDateString('pt-BR')}`;

  return (
    <>
      <Card
        label="Cobranças Criadas (TPV)"
        value={formatBRL(d?.createdTPV ?? 0)}
        icon={<CreditCard size={16} />}
        iconBg="bg-sky-50 text-sky-600"
        loading={chargesQ.isPending}
        error={chargesQ.isError}
        note={d ? `${d.createdCount.toLocaleString('pt-BR')} cobranças · ${periodNote}` : periodNote}
      />

      <Card
        label="Cobranças Autorizadas (TPV)"
        value={formatBRL(d?.authorizedTPV ?? 0)}
        icon={<CheckCircle size={16} />}
        iconBg="bg-emerald-50 text-positive"
        loading={chargesQ.isPending}
        error={chargesQ.isError}
        note={d ? `${d.authorizedCount.toLocaleString('pt-BR')} pagas · ${periodNote}` : periodNote}
      />

      <Card
        label="Número de Cobranças"
        value={(d?.createdCount ?? 0).toLocaleString('pt-BR')}
        icon={<Hash size={16} />}
        iconBg="bg-violet-50 text-violet-600"
        loading={chargesQ.isPending}
        error={chargesQ.isError}
        note={d ? `${d.authorizedCount.toLocaleString('pt-BR')} autorizadas` : undefined}
      />

      <Card
        label="Ticket Médio"
        value={formatBRL(d?.averageTicket ?? 0)}
        icon={<Receipt size={16} />}
        iconBg="bg-orange-50 text-accent"
        loading={chargesQ.isPending}
        error={chargesQ.isError}
        note="por cobrança autorizada"
      />
    </>
  );
}
