import type { EvolutionPoint, ComparisonPoint, LTVCACPoint } from '../types';
import { subDays } from './dateUtils';

// Gerador determinístico baseado em seed para evitar flickering entre renders
function seededValue(seed: string, min: number, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const normalized = (Math.abs(h) % 10000) / 10000;
  return Math.round(min + normalized * (max - min));
}

export function generateEvolutionData(from: Date, to: Date): EvolutionPoint[] {
  const data: EvolutionPoint[] = [];
  const cur = new Date(from);
  let idx = 0;

  while (cur <= to) {
    const dateStr = cur.toISOString().split('T')[0];
    const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;
    const base = 18 + idx * 0.05; // leve crescimento ao longo do tempo
    const noise = seededValue(dateStr, -4, 8);
    const weekendMod = isWeekend ? 0.6 : 1;

    data.push({
      date: dateStr,
      subscribers: Math.max(1, Math.round(base * weekendMod + noise)),
    });

    cur.setDate(cur.getDate() + 1);
    idx++;
  }

  return data;
}

export function generateComparisonData(from: Date, to: Date): ComparisonPoint[] {
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  const weeks = Math.min(Math.ceil(days / 7), 8);
  const result: ComparisonPoint[] = [];

  for (let i = 0; i < weeks; i++) {
    const weekLabel = `Sem ${i + 1}`;
    result.push({
      label: weekLabel,
      current:  seededValue(`cur_${weekLabel}`, 70, 160),
      previous: seededValue(`prv_${weekLabel}`, 50, 130),
    });
  }

  return result;
}

export function generateLTVCACData(): LTVCACPoint[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();

  return months.slice(0, currentMonth + 1).map((month, i) => {
    const cac = seededValue(`cac_${month}`, 65, 115) + i * 1.5;
    const ltv = seededValue(`ltv_${month}`, 310, 430) + i * 6;
    return {
      month,
      cac: Math.round(cac),
      ltv: Math.round(ltv),
      ratio: parseFloat((ltv / cac).toFixed(1)),
    };
  });
}

// Dados de aquisição mockados para quando o backend não está disponível
export function generateAcquisitionMock() {
  const now = new Date();
  return {
    hoje:     seededValue(now.toISOString().split('T')[0], 8, 25),
    semana:   seededValue('semana_' + now.toISOString().slice(0, 7), 60, 150),
    quinzena: seededValue('qnz_' + now.toISOString().slice(0, 7), 130, 290),
    mes:      seededValue('mes_' + now.toISOString().slice(0, 7), 280, 520),
    ano:      seededValue('ano_' + now.getFullYear(), 2800, 4200),
    updatedAt: now.toISOString(),
  };
}

export { subDays };
