import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchHistoricalChart } from '../../api/subscriptionsApi';
import SourceBadge from './SourceBadge';

// ── Tooltip customizado ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm shadow-card-hover">
      <p className="text-xs text-ink-muted mb-0.5">Semana de {label}</p>
      <p className="font-bold text-ink-primary">
        {(payload[0].value as number).toLocaleString('pt-BR')} assinantes
      </p>
    </div>
  );
}

export default function SubscriptionsChart() {
  const { data, isPending, isError } = useQuery({
    queryKey:  ['subscriptions', 'historical'],
    queryFn:   fetchHistoricalChart,
    staleTime: 60 * 60 * 1000, // 1h
    retry: 2,
  });

  // Identifica as datas de migração para a anotação no gráfico
  const migrationPoints = (data ?? []).filter((p) => p.isMigration);
  const migStart = migrationPoints[0]?.date;
  const migEnd   = migrationPoints[migrationPoints.length - 1]?.date ?? migStart;

  // Linha de referência no ponto de alta pré-migração (antes da queda)
  const preMigPoint = data
    ? [...data].reverse().find((p) => !p.isMigration && p.total !== null && p.total > 0)
    : undefined;

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-1">
            Gráfico de assinantes
          </p>
          <p className="text-sm font-semibold text-ink-primary">
            Evolução Anual do Total Geral
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            Dados semanais · último ano · lacunas = ausência real de dado
          </p>
        </div>
        <SourceBadge source="sheet" />
      </div>

      {isPending ? (
        <div className="h-72 w-full animate-pulse rounded-lg bg-panel-raised" />
      ) : isError ? (
        <div className="flex h-72 items-center justify-center rounded-lg bg-panel-raised">
          <p className="text-sm text-negative text-center px-6">
            Erro ao carregar dados da planilha.<br />
            Verifique a conexão e tente novamente.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#003F8A" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#003F8A" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              // Eixo Y não começa do zero — mostra a variação de crescimento com clareza
              domain={[
                (min: number) => Math.floor(min * 0.97),
                (max: number) => Math.ceil(max * 1.01),
              ]}
              tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#003F8A', strokeWidth: 1, strokeDasharray: '4 4' }} />

            {/* Anotação visual do período de migração Pagar.me 1.0 → 2.0 */}
            {migStart && (
              <ReferenceArea
                x1={migStart}
                x2={migEnd}
                fill="#FF6600"
                fillOpacity={0.07}
                strokeOpacity={0}
              />
            )}
            {migStart && (
              <ReferenceLine
                x={migStart}
                stroke="#FF6600"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: 'Migração Pagar.me 2.0',
                  position: 'insideTopLeft',
                  fontSize: 10,
                  fill: '#FF6600',
                  fontWeight: 600,
                }}
              />
            )}

            {/* Linha de tendência pré-migração (opcional — mostra onde estava antes) */}
            {preMigPoint?.total && (
              <ReferenceLine
                y={preMigPoint.total}
                stroke="#94A3B8"
                strokeDasharray="2 4"
                strokeWidth={1}
              />
            )}

            <Area
              type="monotone"
              dataKey="total"
              stroke="#003F8A"
              strokeWidth={2.5}
              fill="url(#gradTotal)"
              connectNulls={false}         // gaps reais = linha quebrada, sem interpolação
              dot={{ r: 3, fill: '#003F8A', strokeWidth: 0 }}
              activeDot={{ r: 5.5, fill: '#003F8A', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
