import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import type { DateRange } from '../../types';
import { fetchEvolution, type EvolutionPoint } from '../../api/metricsApi';
import { diffDays } from '../../utils/dateUtils';

type Granularity = 'day' | 'week' | 'month';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-ink-secondary mb-1">{label}</p>
      <p className="font-semibold text-primary">{payload[0].value} novos assinantes</p>
    </div>
  );
};

interface Props { dateRange: DateRange }

export default function EvolutionChart({ dateRange }: Props) {
  const days = diffDays(dateRange.from, dateRange.to);
  const defaultGran: Granularity = days <= 14 ? 'day' : days <= 90 ? 'week' : 'month';

  const [granularity, setGranularity] = useState<Granularity>(defaultGran);
  const [data, setData]               = useState<EvolutionPoint[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchEvolution(dateRange.from, dateRange.to, granularity));
    } catch {
      setError('Erro ao carregar dados do Pagar.me');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, granularity]);

  useEffect(() => { load(); }, [load]);

  const GRAN: Array<{ key: Granularity; label: string }> = [
    { key: 'day',   label: 'Diário' },
    { key: 'week',  label: 'Semanal' },
    { key: 'month', label: 'Mensal' },
  ];

  const total = data.reduce((s, p) => s + p.subscribers, 0);

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-ink-primary">Evolução de Novas Assinaturas</h3>
          {!loading && total > 0 && (
            <span className="text-xs text-ink-muted">— {total} no período</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {GRAN.map((g) => (
              <button
                key={g.key}
                onClick={() => setGranularity(g.key)}
                className={`btn-ghost text-xs px-2.5 py-1 ${granularity === g.key ? 'border-accent/60 bg-accent/10 text-accent font-semibold' : ''}`}
              >
                {g.label}
              </button>
            ))}
          </div>
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
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D1DCE8" />
            <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#475569' }} formatter={() => 'Novos assinantes'} />
            <Line type="monotone" dataKey="subscribers" stroke="#003F8A" strokeWidth={2.5} dot={data.length <= 30} activeDot={{ r: 4, fill: '#003F8A' }} name="subscribers" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
