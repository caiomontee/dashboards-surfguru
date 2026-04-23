import { useEffect, useState, useCallback } from 'react';
import { Users, RefreshCw, AlertTriangle } from 'lucide-react';
import KPICard from './KPICard';
import { fetchAcquisition } from '../api/metricsApi';
import type { AcquisitionData } from '../types';

export default function AcquisitionKPIs() {
  const [data, setData]     = useState<AcquisitionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAcquisition());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados da Pagar.me');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">
            Aquisição — Novos Assinantes Pro
          </h2>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost flex items-center gap-1.5">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Carregando' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
          <AlertTriangle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard label="Hoje (24h)"     value={data?.hoje     ?? null} loading={loading} />
        <KPICard label="Semana (7d)"    value={data?.semana   ?? null} loading={loading} />
        <KPICard label="Quinzena (15d)" value={data?.quinzena ?? null} loading={loading} />
        <KPICard
          label="Mês (30d)"
          value={data?.mes ?? null}
          loading={loading}
          variant="accent"
          sub="período principal"
        />
        <KPICard label="Ano (YTD)"      value={data?.ano      ?? null} loading={loading} />
      </div>
    </section>
  );
}
