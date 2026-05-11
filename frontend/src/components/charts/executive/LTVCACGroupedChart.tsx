import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { generateLTVCACData } from '../../../utils/mockData';

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const ltv = payload.find((p) => p.dataKey === 'ltv')?.value ?? 0;
  const cac = payload.find((p) => p.dataKey === 'cac')?.value ?? 0;
  const ratio = cac > 0 ? (ltv / cac).toFixed(1) : '—';
  const ratioNum = parseFloat(ratio);
  const badge =
    ratioNum >= 3 ? 'bg-positive/10 text-positive border-positive/30' :
    ratioNum >= 1 ? 'bg-caution/10 text-caution border-caution/30' :
                   'bg-negative/10 text-negative border-negative/30';
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface px-3 py-2 text-xs shadow-lg space-y-1.5">
      <p className="font-semibold text-ink-secondary">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'ltv' ? 'LTV' : 'CAC'}: {brl(p.value)}
        </p>
      ))}
      <p className={`mt-1 rounded border px-1.5 py-0.5 font-bold ${badge}`}>
        Ratio: {ratio}×
      </p>
    </div>
  );
};

export default function LTVCACGroupedChart() {
  const data = useMemo(() => generateLTVCACData(), []);

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <BarChart2 size={16} className="text-positive" />
        <h3 className="text-sm font-semibold text-ink-primary">LTV vs. CAC</h3>
        <span className="ml-auto rounded-full border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs text-caution">
          dados ilustrativos
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D1DCE8" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#475569' }}
            formatter={(v) => v === 'ltv' ? 'LTV' : 'CAC'}
          />
          <Bar dataKey="ltv" name="ltv" fill="#059669" opacity={0.85} radius={[4,4,0,0]} maxBarSize={24} />
          <Bar dataKey="cac" name="cac" fill="#DC2626" opacity={0.75} radius={[4,4,0,0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-3 border-t border-panel-border pt-2.5 text-[11px] text-ink-muted">
        <span className="font-semibold text-positive">Meta:</span> LTV ≥ 3× CAC — eficiência do investimento em marketing
      </p>
    </div>
  );
}