import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { fetchConversion } from '../api/metricsApi';
import SourceBadge from './subscriptions/SourceBadge';

const COLORS = ['#003F8A', '#FF6600'];

function Spinner() {
  return (
    <div className="flex h-[180px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-panel-border border-t-primary" />
    </div>
  );
}

export default function ConversionFunnelChart() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['metrics', 'conversion'],
    queryFn:  fetchConversion,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });

  const acessos     = data?.acessos     ?? 0;
  const assinaturas = data?.assinaturas ?? 0;
  const taxa        = data?.taxaConversao ?? 0;
  const dropPct     = acessos > 0 ? (100 - taxa).toFixed(1) : '—';

  const chartData = [
    { stage: 'Acessos /planos',   value: acessos },
    { stage: 'Novas assinaturas', value: assinaturas },
  ];

  return (
    <div className="glass-card p-5">

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-ink-primary">Funil de Conversão · /planos</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <SourceBadge source="ga4" />
          <SourceBadge source="pagarme" />
        </div>
      </div>

      {isPending ? <Spinner /> : isError ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-negative">
          Erro ao carregar dados
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
              barSize={36}
            >
              <XAxis type="number" hide domain={[0, acessos]} />
              <YAxis
                type="category"
                dataKey="stage"
                width={130}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                formatter={(v) => [Number(v).toLocaleString('pt-BR'), 'total']}
                contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={4}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  style={{ fontSize: 13, fontWeight: 700, fill: '#0f172a' }}
                  formatter={(v) => Number(v).toLocaleString('pt-BR')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="my-1 flex items-center gap-2 px-1">
            <div className="h-px flex-1 border-t border-dashed border-panel-border" />
            <span className="text-[10px] text-ink-muted">{dropPct}% não converteram</span>
            <div className="h-px flex-1 border-t border-dashed border-panel-border" />
          </div>

          <div className="mt-3 flex items-end justify-between border-t border-panel-border pt-3">
            <div>
              <p className="text-[11px] text-ink-muted">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-accent leading-none mt-0.5">
                {taxa.toFixed(2)}%
              </p>
              <p className="text-[10px] text-ink-muted mt-1">(Assinaturas / Acessos) × 100</p>
            </div>
            <div className="text-right text-[11px] text-ink-muted space-y-0.5">
              <p>{acessos.toLocaleString('pt-BR')} visitas</p>
              <p>{assinaturas.toLocaleString('pt-BR')} converteram</p>
              <p className="text-[10px]">últimos 30 dias</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
