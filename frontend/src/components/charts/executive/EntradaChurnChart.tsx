import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { generateEntradaChurnData } from '../../../utils/mockData';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; color: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const labels: Record<string, string> = {
    entradas: 'Entradas',
    churn:    'Cancelamentos',
    liquido:  'Crescimento Líquido',
  };
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-medium text-ink-secondary">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {labels[p.name] ?? p.name}:{' '}
          {p.name === 'liquido' && p.value > 0 ? '+' : ''}
          {p.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  );
};

export default function EntradaChurnChart() {
  const data = useMemo(() => generateEntradaChurnData(), []);

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp size={16} className="text-positive" />
        <h3 className="text-sm font-semibold text-ink-primary">Entradas vs. Churn</h3>
        <span className="ml-auto rounded-full border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs text-caution">
          dados ilustrativos
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D1DCE8" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#475569' }}
            formatter={(v) => v === 'entradas' ? 'Entradas' : v === 'churn' ? 'Cancelamentos' : 'Crescimento Líquido'}
          />
          <Bar dataKey="entradas" name="entradas" fill="#059669" opacity={0.8}  radius={[4,4,0,0]} maxBarSize={18} />
          <Bar dataKey="churn"    name="churn"    fill="#DC2626" opacity={0.7}  radius={[4,4,0,0]} maxBarSize={18} />
          <Line
            type="monotone"
            dataKey="liquido"
            name="liquido"
            stroke="#003F8A"
            strokeWidth={2.5}
            dot={{ fill: '#003F8A', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <p className="mt-3 border-t border-panel-border pt-2.5 text-[11px] text-ink-muted">
        Saúde da base — a linha azul mostra o crescimento líquido mês a mês
      </p>
    </div>
  );
}