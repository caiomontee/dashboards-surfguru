import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchSubscriptionList } from '../../api/subscriptionsApi';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:   { label: 'Ativa',        cls: 'bg-emerald-100 text-emerald-700' },
  canceled: { label: 'Cancelada',    cls: 'bg-red-100 text-red-700' },
  paused:   { label: 'Pausada',      cls: 'bg-yellow-100 text-yellow-700' },
  unpaid:   { label: 'Inadimplente', cls: 'bg-orange-100 text-orange-700' },
  trial:    { label: 'Trial',        cls: 'bg-blue-100 text-blue-700' },
  ended:    { label: 'Encerrada',    cls: 'bg-gray-100 text-gray-600' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active',   label: 'Ativas' },
  { value: 'unpaid',   label: 'Inadimplentes' },
  { value: 'canceled', label: 'Canceladas' },
  { value: 'paused',   label: 'Pausadas' },
];

export default function SubscriptionsTable() {
  const [page,   setPage]   = useState(1);
  const [filter, setFilter] = useState('');

  const { data, isPending, isError } = useQuery({
    queryKey: ['subscriptions', 'list', page, PAGE_SIZE, filter],
    queryFn: () => fetchSubscriptionList(page, PAGE_SIZE, filter || undefined),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  function changePage(next: number) {
    setPage(next);
    window.scrollTo({ top: document.getElementById('subs-table')?.offsetTop ?? 0, behavior: 'smooth' });
  }

  function changeFilter(v: string) {
    setFilter(v);
    setPage(1);
  }

  return (
    <div id="subs-table" className="glass-card overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-panel-border flex-wrap">
        <div>
          <h3 className="font-semibold text-ink-primary">Todas as Assinaturas</h3>
          {data && (
            <p className="text-xs text-ink-muted mt-0.5">
              {data.total.toLocaleString('pt-BR')} assinatura{data.total !== 1 ? 's' : ''} encontrada{data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-panel-border bg-panel-raised px-3 py-1.5">
            <Filter size={13} className="text-ink-muted" />
            <select
              value={filter}
              onChange={(e) => changeFilter(e.target.value)}
              className="bg-transparent text-xs text-ink-primary focus:outline-none"
            >
              {FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Search hint */}
          <div className="flex items-center gap-1.5 rounded-lg border border-panel-border bg-panel-raised px-3 py-1.5 text-xs text-ink-muted">
            <Search size={13} />
            <span>Busca em breve</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel-border bg-panel-raised">
              {['Cliente', 'Status', 'Início', 'Último Pagamento', 'Valor/mês', 'Plano'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-panel-border">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-panel-raised" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-negative">
                  Erro ao carregar assinaturas. Verifique a conexão com o backend.
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-muted">
                  Nenhuma assinatura encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              data?.data.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-panel-border transition hover:bg-panel-raised"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-primary leading-tight">{sub.customerName}</p>
                    <p className="text-xs text-ink-muted">{sub.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                  <td className="px-4 py-3 text-ink-secondary tabular-nums">{fmt(sub.startDate)}</td>
                  <td className="px-4 py-3 text-ink-secondary tabular-nums">{fmt(sub.lastPaymentDate)}</td>
                  <td className="px-4 py-3 font-semibold text-ink-primary tabular-nums">
                    {formatBRL(sub.monthlyValue)}
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{sub.planName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-panel-border px-5 py-3">
          <p className="text-xs text-ink-muted">
            Página {data.page} de {data.totalPages} · {data.total.toLocaleString('pt-BR')} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => changePage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-panel-border px-3 py-1.5 text-xs font-medium text-ink-secondary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={13} /> Anterior
            </button>
            <button
              onClick={() => changePage(page + 1)}
              disabled={page >= data.totalPages}
              className="flex items-center gap-1 rounded-lg border border-panel-border px-3 py-1.5 text-xs font-medium text-ink-secondary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
