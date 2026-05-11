import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { DollarSign } from 'lucide-react';
import { generateMRRData } from '../../../utils/mockData';

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; color: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-medium text-ink-secondary">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'mrr' ? 'MRR' : 'Base Ativa'}:{' '}
          {p.name === 'mrr' ? brl(p.value) : p.value.toLocaleString('pt-BR') + ' usuários'}
        </p>
      ))}
    </div>
  );
};

export default function MRRActiveChart() {
  const data = useMemo(() => generateMRRData(), []);

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <DollarSign size={16} className="text-positive" />
        <h3 className="text-sm font-semibold text-ink-primary">MRR e Base Ativa</h3>
        <span className="ml-auto rounded-full border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs text-caution">
          dados ilustrativos
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 44, left: -4, bottom: 0 }}>
          <defs>
            <linearGradient id="execMrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#059669" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="execAtivosGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#FF6600" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#FF6600" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D1DCE8" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="mrr"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            yAxisId="ativos"
            orientation="right"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#475569' }}
            formatter={(v) => v === 'mrr' ? 'MRR' : 'Base Ativa'}
          />
          <Area
            yAxisId="mrr"
            type="monotone"
            dataKey="mrr"
            name="mrr"
            stroke="#059669"
            strokeWidth={2.5}
            fill="url(#execMrrGrad)"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            yAxisId="ativos"
            type="monotone"
            dataKey="ativos"
            name="ativos"
            stroke="#FF6600"
            strokeWidth={2.5}
            fill="url(#execAtivosGrad)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <p className="mt-3 border-t border-panel-border pt-2.5 text-[11px] text-ink-muted">
        <span className="font-medium text-positive">Verde</span> = receita recorrente (eixo esq.) ·{' '}
        <span className="font-medium text-accent">Laranja</span> = usuários ativos (eixo dir.)
      </p>
    </div>
  );
}