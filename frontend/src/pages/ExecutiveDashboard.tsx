import LTVCACGroupedChart  from '../components/charts/executive/LTVCACGroupedChart';
import EntradaChurnChart   from '../components/charts/executive/EntradaChurnChart';
import TrialFunnelChart    from '../components/charts/executive/TrialFunnelChart';
import MRRActiveChart      from '../components/charts/executive/MRRActiveChart';
import PlanDonutChart      from '../components/charts/executive/PlanDonutChart';

export default function ExecutiveDashboard() {
  return (
    <div className="space-y-6">

      {/* Aviso geral sobre dados mock */}
      <div className="rounded-lg border border-caution/30 bg-caution/5 px-4 py-3 text-sm text-caution">
        <span className="font-semibold">Atenção:</span> os gráficos marcados com{' '}
        <span className="rounded-full border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs font-medium">
          dados ilustrativos
        </span>{' '}
        usam valores simulados. Eles estão prontos para receber dados reais assim que as
        integrações forem conectadas.
      </div>

      {/* Linha 1: LTV vs CAC | Entradas vs Churn */}
      <div className="grid gap-5 lg:grid-cols-2">
        <LTVCACGroupedChart />
        <EntradaChurnChart />
      </div>

      {/* Linha 2: MRR e Base Ativa — largura total */}
      <MRRActiveChart />

      {/* Linha 3: Funil de Trial | Distribuição de Planos */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TrialFunnelChart />
        <PlanDonutChart />
      </div>

    </div>
  );
}