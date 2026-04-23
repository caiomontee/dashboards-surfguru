import { useEffect, useState, useCallback } from 'react';
import MetricCard from './MetricCard';
import { fetchAcquisition, type AcquisitionData } from '../api/metricsApi';

export default function AcquisitionSection() {
  const [data, setData] = useState<AcquisitionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAcquisition());
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao buscar dados do Pagar.me';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleString('pt-BR')
    : null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Aquisição — Novos Assinantes Pro
          </h2>
          {updatedAt && (
            <p className="text-xs text-slate-500">Atualizado em {updatedAt}</p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-ocean-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-ocean-600 disabled:opacity-50"
        >
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-700 bg-rose-900/30 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Hoje (24h)" value={data?.hoje ?? null} loading={loading} color="blue" />
        <MetricCard label="Semana (7d)" value={data?.semana ?? null} loading={loading} color="blue" />
        <MetricCard label="Quinzena (15d)" value={data?.quinzena ?? null} loading={loading} color="blue" />
        <MetricCard label="Mês (30d)" value={data?.mes ?? null} loading={loading} color="blue" highlight />
        <MetricCard label="Ano (YTD)" value={data?.ano ?? null} loading={loading} color="blue" />
      </div>
    </section>
  );
}
