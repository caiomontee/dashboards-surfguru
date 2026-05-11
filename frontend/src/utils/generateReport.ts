import jsPDF from 'jspdf';
import type { SheetTotal, PagarmeSummary, ChargesSummary, PlanSplit } from '../api/subscriptionsApi';
import type { SubscriptionPeriod } from '../types/subscriptions';

export interface ReportData {
  sheet:   SheetTotal;
  pagarme: PagarmeSummary;
  charges: ChargesSummary;
  plans:   PlanSplit;
  period:  SubscriptionPeriod;
}

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  orange: [234, 88,  12]  as [number,number,number],
  dark:   [30,  41,  59]  as [number,number,number],
  gray:   [100, 116, 139] as [number,number,number],
  light:  [241, 245, 249] as [number,number,number],
  white:  [255, 255, 255] as [number,number,number],
  green:  [22,  163, 74]  as [number,number,number],
  red:    [220, 38,  38]  as [number,number,number],
  blue:   [59,  130, 246] as [number,number,number],
  teal:   [20,  184, 166] as [number,number,number],
};

// ── Formatadores ─────────────────────────────────────────────────────────────
const fmtN   = (n: number)                => n.toLocaleString('pt-BR');
const fmtBRL = (n: number)                => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (n: number)                => `${n.toFixed(2).replace('.', ',')}%`;
const fmtGrowth = (g: number | null)      => g === null ? '—' : g >= 0 ? `+${fmtN(g)}` : fmtN(g);

function periodLabel(period: SubscriptionPeriod): string {
  const map: Record<string, string> = {
    today: 'Hoje', yesterday: 'Ontem', '7d': 'Últimos 7 dias',
    '15d': 'Últimos 15 dias', '30d': 'Último mês',
  };
  if (period.preset === 'custom') {
    return `${period.from.toLocaleDateString('pt-BR')} – ${period.to.toLocaleDateString('pt-BR')}`;
  }
  return map[period.preset] ?? 'Período';
}

// ── Helper: card com label + valor grande + sub ──────────────────────────────
function drawCard(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string, sub: string,
  valueColor: [number,number,number],
) {
  doc.setFillColor(...C.light);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.text(label, x + 4, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...valueColor);
  doc.text(value, x + 4, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray);
  doc.text(sub, x + 4, y + 22);
}

// ── Helper: cabeçalho de seção ───────────────────────────────────────────────
function sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text(title, x, y);
}

// ── Gerador principal ────────────────────────────────────────────────────────

export async function generateReport({ sheet, pagarme, charges, plans, period }: ReportData): Promise<void> {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W     = 210;
  const M     = 16;   // margem lateral
  const cardH = 26;

  // ── Header laranja ────────────────────────────────────────────────────────
  doc.setFillColor(...C.orange);
  doc.rect(0, 0, W, 34, 'F');

  // Logo (imagem, se disponível) ─ tentativa silenciosa
  try {
    const img = new Image();
    img.src = '/logo.png';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
      setTimeout(rej, 1000);
    });
    doc.addImage(img, 'PNG', M, 5, 14, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...C.white);
    doc.text('SurfGuru', M + 17, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Dashboard Pro', M + 17, 20);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...C.white);
    doc.text('SurfGuru', M, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Dashboard Pro', M, 21);
  }

  // Título + período (direita)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text('Relatório de Assinaturas', W - M, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(periodLabel(period), W - M, 19, { align: 'right' });

  doc.setFontSize(7.5);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    W - M, 26, { align: 'right' },
  );

  let y = 46;

  // ── Seção 1: KPIs principais ─────────────────────────────────────────────
  sectionTitle(doc, 'MÉTRICAS PRINCIPAIS', M, y);
  y += 5;

  const colW = (W - M * 2 - 9) / 4;
  const kpis = [
    { label: 'Total de Assinantes', value: fmtN(sheet.total),            sub: `Atualizado ${sheet.date}`,              color: C.dark  },
    { label: 'Crescimento Semanal', value: fmtGrowth(sheet.growth),       sub: 'vs. semana anterior',                   color: (sheet.growth ?? 0) >= 0 ? C.green : C.red },
    { label: 'MRR',                 value: fmtBRL(pagarme.mrr),           sub: `${fmtN(pagarme.activeCount)} ativos`,   color: C.dark  },
    { label: 'Churn Rate',          value: fmtPct(pagarme.churnRate),     sub: `${fmtN(pagarme.canceledInPeriod)} cancelamentos`, color: pagarme.churnRate > 3 ? C.red : C.green },
  ] as const;

  kpis.forEach((k, i) => {
    drawCard(doc, M + i * (colW + 3), y, colW, cardH, k.label, k.value, k.sub, k.color as [number,number,number]);
  });

  y += cardH + 10;

  // ── Seção 2: Detalhamento do período ─────────────────────────────────────
  sectionTitle(doc, 'DETALHAMENTO DO PERÍODO · ' + periodLabel(period).toUpperCase(), M, y);
  y += 5;

  const periodoKpis = [
    { label: 'Novas Assinaturas',  value: `+${fmtN(pagarme.newInPeriod)}`,      sub: 'ativas + trial' },
    { label: 'Cancelamentos',      value: fmtN(pagarme.canceledInPeriod),        sub: 'no período' },
    { label: 'Volume (TPV)',       value: fmtBRL(charges.authorizedTPV),          sub: `${fmtN(charges.authorizedCount)} cobranças pagas` },
    { label: 'Ticket Médio',       value: fmtBRL(charges.averageTicket),          sub: 'por cobrança' },
  ];

  periodoKpis.forEach((k, i) => {
    drawCard(doc, M + i * (colW + 3), y, colW, cardH, k.label, k.value, k.sub, C.dark);
  });

  y += cardH + 10;

  // ── Seção 3: Distribuição de planos ──────────────────────────────────────
  sectionTitle(doc, 'DISTRIBUIÇÃO DE PLANOS (PAGAR.ME ATIVOS)', M, y);
  y += 5;

  const total       = plans.monthly + plans.annual;
  const monthlyPct  = total > 0 ? (plans.monthly / total) * 100 : 0;
  const annualPct   = total > 0 ? (plans.annual  / total) * 100 : 0;
  const halfW       = (W - M * 2 - 6) / 2;

  drawCard(doc, M,             y, halfW, cardH,
    'Plano Mensal', fmtN(plans.monthly), `${monthlyPct.toFixed(1)}% do total`, C.blue);
  drawCard(doc, M + halfW + 6, y, halfW, cardH,
    'Plano Anual',  fmtN(plans.annual),  `${annualPct.toFixed(1)}% do total`,  C.teal);

  y += cardH + 5;

  // Barra de distribuição
  const barW = W - M * 2;
  doc.setFillColor(...C.blue);
  doc.rect(M, y, barW * (monthlyPct / 100), 5, 'F');
  doc.setFillColor(...C.teal);
  doc.rect(M + barW * (monthlyPct / 100), y, barW * (annualPct / 100), 5, 'F');

  // Legenda da barra
  y += 9;
  doc.setFillColor(...C.blue);
  doc.rect(M, y, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.text('Mensal', M + 5, y + 2.5);

  doc.setFillColor(...C.teal);
  doc.rect(M + 28, y, 3, 3, 'F');
  doc.text('Anual', M + 33, y + 2.5);

  // ── Linha divisória ───────────────────────────────────────────────────────
  y += 12;
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);

  // ── Rodapé ────────────────────────────────────────────────────────────────
  const footerY = 285;
  doc.setFillColor(...C.light);
  doc.rect(0, footerY - 2, W, 15, 'F');

  doc.setFillColor(...C.orange);
  doc.rect(0, footerY - 2, 3, 15, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.orange);
  doc.text('SurfGuru Pro Dashboard', M, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gray);
  doc.text('surfguru.com.br', M, footerY + 9.5);

  doc.setFontSize(7);
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    W - M, footerY + 5, { align: 'right' },
  );
  doc.text('Dados: Supabase + API Pagar.me', W - M, footerY + 9.5, { align: 'right' });

  // ── Salvar ────────────────────────────────────────────────────────────────
  const today    = new Date().toISOString().slice(0, 10);
  const filename = `surfguru-relatorio-${today}.pdf`;
  doc.save(filename);
}

// ── Texto para WhatsApp ───────────────────────────────────────────────────────

export function buildWhatsAppText({ sheet, pagarme, charges, period }: Omit<ReportData, 'plans'>): string {
  const periodo = periodLabel(period);
  const growth  = fmtGrowth(sheet.growth);

  return (
    `📊 *Relatório SurfGuru · ${periodo}*\n\n` +
    `👥 Total de Assinantes: *${fmtN(sheet.total)}*\n` +
    `📈 Crescimento Semanal: *${growth}*\n` +
    `💰 MRR: *${fmtBRL(pagarme.mrr)}*\n` +
    `📉 Churn Rate: *${fmtPct(pagarme.churnRate)}*\n\n` +
    `🆕 Novas Assinaturas: *+${fmtN(pagarme.newInPeriod)}*\n` +
    `❌ Cancelamentos: *${fmtN(pagarme.canceledInPeriod)}*\n` +
    `💳 TPV: *${fmtBRL(charges.authorizedTPV)}*\n\n` +
    `🔗 Dashboard: https://dashboard.surfguru.com.br`
  );
}
