import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Download } from 'lucide-react';
import type { PeriodPreset, SubscriptionPeriod } from '../../types/subscriptions';

interface Option { value: PeriodPreset; label: string; }

const OPTIONS: Option[] = [
  { value: 'today',     label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d',        label: 'Últimos 7 dias' },
  { value: '15d',       label: 'Últimos 15 dias' },
  { value: '30d',       label: 'Último mês' },
  { value: 'custom',    label: 'Personalizado' },
];

export function buildPeriod(preset: PeriodPreset, customFrom?: Date, customTo?: Date): SubscriptionPeriod {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { preset, from: today, to: now };
    case 'yesterday': {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return { preset, from: y, to: today };
    }
    case '7d': {
      const f = new Date(today); f.setDate(f.getDate() - 7);
      return { preset, from: f, to: now };
    }
    case '15d': {
      const f = new Date(today); f.setDate(f.getDate() - 15);
      return { preset, from: f, to: now };
    }
    case 'custom':
      return { preset, from: customFrom ?? new Date(today.getTime() - 30 * 86400000), to: customTo ?? now };
    default: {
      const f = new Date(today); f.setDate(f.getDate() - 30);
      return { preset: '30d', from: f, to: now };
    }
  }
}

function labelFor(p: SubscriptionPeriod): string {
  const lbl = OPTIONS.find((o) => o.value === p.preset)?.label;
  if (p.preset === 'custom') {
    return `${p.from.toLocaleDateString('pt-BR')} – ${p.to.toLocaleDateString('pt-BR')}`;
  }
  return lbl ?? 'Período';
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Props {
  period: SubscriptionPeriod;
  onPeriodChange: (p: SubscriptionPeriod) => void;
  onDownload: () => void;
  isDownloading?: boolean;
}

export default function PeriodSelector({ period, onPeriodChange, onDownload, isDownloading }: Props) {
  const [open, setOpen]         = useState(false);
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(Date.now() - 30 * 86400000)));
  const [customTo,   setCustomTo]   = useState(toInputDate(new Date()));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectPreset(preset: PeriodPreset) {
    if (preset === 'custom') return; // custom handled by apply button
    onPeriodChange(buildPeriod(preset));
    setOpen(false);
  }

  function applyCustom() {
    onPeriodChange(buildPeriod('custom', new Date(customFrom), new Date(customTo + 'T23:59:59')));
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Period dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-surface px-4 py-2 text-sm font-medium text-ink-primary shadow-sm transition hover:border-primary hover:text-primary"
        >
          <Calendar size={15} className="text-ink-muted" />
          <span>Período: {labelFor(period)}</span>
          <ChevronDown size={14} className={`transition-transform text-ink-muted ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-panel-border bg-panel-surface shadow-card-hover">
            <ul className="py-1">
              {OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => selectPreset(opt.value)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-panel-raised ${
                      period.preset === opt.value
                        ? 'font-semibold text-primary bg-blue-50'
                        : 'text-ink-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Custom range */}
            <div className="border-t border-panel-border px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Personalizado</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-ink-muted">De</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="input-base mt-0.5 text-xs py-1.5"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-ink-muted">Até</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="input-base mt-0.5 text-xs py-1.5"
                  />
                </div>
              </div>
              <button onClick={applyCustom} className="btn-primary w-full py-1.5 text-xs">
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Download report */}
      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-surface px-4 py-2 text-sm font-medium text-ink-secondary shadow-sm transition hover:border-primary hover:text-primary disabled:opacity-50"
      >
        <Download size={15} />
        Baixar relatório
      </button>
    </div>
  );
}
