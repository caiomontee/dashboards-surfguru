import { useState } from 'react';
import type { DateRange, FinancialData } from './types';
import { subDays } from './utils/dateUtils';

import DateRangePicker from './components/DateRangePicker';
import OverloadImport from './components/OverloadImport';
import FinancialKPIs from './components/FinancialKPIs';
import SubscriptionsDashboard from './pages/SubscriptionsDashboard';

type Tab = 'ltvcac' | 'assinaturas';

const TABS: { id: Tab; label: string }[] = [
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'ltvcac',      label: 'LTV e CAC' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('assinaturas');
  const [dateRange, setDateRange]   = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [calculating, setCalculating]     = useState(false);

  return (
    <div className="min-h-screen bg-panel-base">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-accent shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="SurfGuru" className="h-16 w-auto rounded-lg" />
            <div className="h-6 w-px bg-white/30" />
            <span className="rounded-md bg-primary px-2.5 py-0.5 text-sm font-bold text-white tracking-wide">
              Dashboard Pro
            </span>
          </div>
          <span className="hidden text-xs text-white/80 sm:block">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        {/* barra azul navy */}
        <div className="h-1.5 bg-primary" />
      </header>

      {/* ── Tab navigation ──────────────────────────────────────────── */}
      <div className="border-b border-panel-border bg-panel-surface">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-0" aria-label="Abas do dashboard">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative px-5 py-3.5 text-sm font-semibold transition-colors ${
                  tab === id
                    ? 'text-primary'
                    : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                {label}
                {tab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === 'assinaturas' ? (
          <SubscriptionsDashboard />
        ) : (
          <div className="space-y-6">
            <DateRangePicker value={dateRange} onChange={setDateRange} />

            {/* 1. Importação Overload — primeira coisa visível */}
            <OverloadImport
              dateRange={dateRange}
              onResult={setFinancialData}
              onLoading={setCalculating}
            />

            {/* 2. Cards LTV / CAC / Ratio */}
            <FinancialKPIs data={financialData} loading={calculating} />

          </div>
        )}
      </main>

      <footer className="mt-8 border-t border-panel-border py-4 text-center text-xs text-ink-muted">
        SurfGuru Dashboard — uso interno
      </footer>
    </div>
  );
}
