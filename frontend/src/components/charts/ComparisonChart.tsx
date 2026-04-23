import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { BarChart2, RefreshCw } from 'lucide-react';
import type { DateRange } from '../../types';
import { fetchComparison, type ComparisonPoint } from '../../api/metricsApi';
import { diffDays } from '../../utils/dateUtils';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ minWidth: 160 }} className="rounded-lg border border-panel-border bg-panel-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-ink-secondary">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name === 'current' ? 'Atual' : 'Anterior'}
          </span>
          <span className="font-bold tabular-nums" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface Props { dateRange: DateRange }

export default function ComparisonChart({ dateRange }: Props) {
  const [data, setData]       = useState<ComparisonPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const days = diffDays(dateRange.from, dateRange.to);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchComparison(dateRange.from, dateRange.to));
    } catch {
      setError('Erro ao carregar comparação');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => { load(); }, [load]);

  const prevFrom = new Date(dateRange.from.getTime() - days * 86_400_000);

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-ink-primary">Comparação de Períodos</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">
            vs. {prevFrom.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}–{dateRange.from.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}
          </span>
          <button onClick={load} disabled={loading} className="btn-ghost px-2 py-1">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-negative">{error}</p>}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-ink-muted" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D1DCE8" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,63,138,.04)' }} />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#475569' }}
              formatter={(v) => v === 'current' ? 'Período atual' : 'Período anterior'}
            />
            <Bar dataKey="previous" name="previous" fill="#CBD5E1" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="current"  name="current"  fill="#003F8A" radius={[4,4,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
