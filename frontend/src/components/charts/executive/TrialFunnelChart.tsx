import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Filter } from 'lucide-react';
import { generateTrialData } from '../../../utils/mockData';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const iniciados   = payload.find((p) => p.dataKey === 'iniciados')?.value   ?? 0;
  const convertidos = payload.find((p) => p.dataKey === 'convertidos')?.value ?? 0;
  const taxa = iniciados > 0 ? ((convertidos / iniciados) * 100).toFixed(1) : '—';
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-medium text-ink-secondary">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'iniciados' ? 'Trials Iniciados' : 'Convertidos'}: {p.value.toLocaleString('pt-BR')}
        </p>
      ))}
      <p className="mt-1 font-bold text-primary">Taxa de Conversão: {taxa}%</p>
    </div>
  );
};

export default function TrialFunnelChart() {
  const data = useMemo(() => generateTrialData(), []);

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <Filter size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-ink-primary">Funil de Conversão de Trial</h3>
        <span className="ml-auto rounded-full border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs text-caution">
          dados ilustrativos
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D1DCE8" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#475569' }}
            formatter={(v) => v === 'iniciados' ? 'Trials Iniciados' : 'Convertidos'}
          />
          <Bar dataKey="iniciados"   name="iniciados"   fill="#CBD5E1" radius={[4,4,0,0]} maxBarSize={28} />
          <Bar dataKey="convertidos" name="convertidos" fill="#003F8A" radius={[4,4,0,0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-3 border-t border-panel-border pt-2.5 text-[11px] text-ink-muted">
        Qualidade do onboarding — % de trials que geram a 1ª mensalidade
      </p>
    </div>
  );
}