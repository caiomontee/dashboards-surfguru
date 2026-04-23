import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { generateLTVCACData } from '../../utils/mockData';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-medium text-ink-secondary">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'ltv' ? 'LTV' : p.name === 'cac' ? 'CAC' : 'Ratio'}:{' '}
          {p.name === 'ratio' ? `${p.value}x` : brl(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function LTVCACChart() {
  const data = useMemo(() => generateLTVCACData(), []);

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <Activity size={16} className="text-positive" />
        <h3 className="text-sm font-semibold text-ink-primary">LTV vs CAC — Evolução Mensal</h3>
        <span className="ml-auto rounded-full border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs text-caution">
          dados ilustrativos
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D1DCE8" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="brl"   tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
          <YAxis yAxisId="ratio" orientation="right" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#475569' }}
            formatter={(v) => v === 'ltv' ? 'LTV' : v === 'cac' ? 'CAC' : 'Ratio LTV:CAC'}
          />
          <Bar yAxisId="brl" dataKey="ltv" name="ltv" fill="#059669" opacity={0.8} radius={[4,4,0,0]} maxBarSize={28} />
          <Bar yAxisId="brl" dataKey="cac" name="cac" fill="#DC2626" opacity={0.7} radius={[4,4,0,0]} maxBarSize={28} />
          <Line yAxisId="ratio" type="monotone" dataKey="ratio" name="ratio" stroke="#FF6600" strokeWidth={2.5} dot={{ fill: '#FF6600', r: 3 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 flex gap-4 border-t border-panel-border pt-3 text-xs text-ink-muted">
        <span><span className="font-bold text-positive">≥ 3x</span> saudável</span>
        <span><span className="font-bold text-caution">1–3x</span> atenção</span>
        <span><span className="font-bold text-negative">&lt; 1x</span> crítico</span>
      </div>
    </div>
  );
}
