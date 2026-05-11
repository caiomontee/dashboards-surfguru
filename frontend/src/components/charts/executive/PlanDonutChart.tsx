import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { fetchPlanSplit } from '../../../api/subscriptionsApi';
import SourceBadge from '../../subscriptions/SourceBadge';

const COLORS = ['#003F8A', '#FF6600'];

export default function PlanDonutChart() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['subscriptions', 'plan-split'],
    queryFn:  fetchPlanSplit,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const total = (data?.monthly ?? 0) + (data?.annual ?? 0);

  const chartData = [
    { name: 'Mensal',          value: data?.monthly ?? 0 },
    { name: 'Anual/Semestral', value: data?.annual  ?? 0 },
  ];

  const pct = (v: number) =>
    total > 0 ? `${((v / total) * 100).toFixed(1)}%` : '—';

  return (
    <div className="glass-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <PieIcon size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-ink-primary">Distribuição de Planos</h3>
        <span className="ml-auto">
          <SourceBadge source="pagarme" />
        </span>
      </div>

      {isPending ? (
        <div className="flex h-[260px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-panel-border border-t-primary" />
        </div>
      ) : isError ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-negative">
          Erro ao carregar dados
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${Number(v).toLocaleString('pt-BR')} assinantes`, '']}
                contentStyle={{ fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 flex justify-around border-t border-panel-border pt-3 text-center">
            <div>
              <p className="text-[11px] text-ink-muted">Mensal</p>
              <p className="text-xl font-bold text-primary">{pct(data?.monthly ?? 0)}</p>
              <p className="text-[11px] text-ink-secondary">{(data?.monthly ?? 0).toLocaleString('pt-BR')} assin.</p>
            </div>
            <div className="w-px bg-panel-border" />
            <div>
              <p className="text-[11px] text-ink-muted">Anual/Semestral</p>
              <p className="text-xl font-bold text-accent">{pct(data?.annual ?? 0)}</p>
              <p className="text-[11px] text-ink-secondary">{(data?.annual ?? 0).toLocaleString('pt-BR')} assin.</p>
            </div>
          </div>

          <p className="mt-3 border-t border-panel-border pt-2.5 text-[11px] text-ink-muted">
            Mais anuais = maior previsibilidade de caixa e segurança financeira
          </p>
        </>
      )}
    </div>
  );
}