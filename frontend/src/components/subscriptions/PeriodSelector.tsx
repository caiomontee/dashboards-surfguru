import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Download } from 'lucide-react';

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
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
  onShare?: () => void;
  isDownloading?: boolean;
  isSharing?: boolean;
}

export default function PeriodSelector({ period, onPeriodChange, onDownload, onShare, isDownloading, isSharing }: Props) {
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
        {isDownloading ? 'Gerando…' : 'Baixar relatório'}
      </button>

      {/* WhatsApp share */}
      {onShare && (
        <button
          onClick={onShare}
          disabled={isSharing}
          className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-surface px-4 py-2 text-sm font-medium text-ink-secondary shadow-sm transition hover:border-[#25D366] hover:text-[#25D366] disabled:opacity-50"
        >
          <WhatsAppIcon size={15} />
          {isSharing ? 'Abrindo…' : 'Compartilhar'}
        </button>
      )}
    </div>
  );
}
