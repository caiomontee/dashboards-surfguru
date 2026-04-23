import { Calendar } from 'lucide-react';
import type { DateRange } from '../types';
import { subDays, startOfMonth, startOfYear, toInputValue, fromInputValue, formatDateBR } from '../utils/dateUtils';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const SHORTCUTS: Array<{ label: string; get: () => DateRange }> = [
  { label: 'Hoje',        get: () => ({ from: subDays(new Date(), 1),  to: new Date() }) },
  { label: 'Últimos 7d', get: () => ({ from: subDays(new Date(), 7),  to: new Date() }) },
  { label: 'Últimos 30d',get: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este Mês',   get: () => ({ from: startOfMonth(),           to: new Date() }) },
  { label: 'Este Ano',   get: () => ({ from: startOfYear(),            to: new Date() }) },
];

export default function DateRangePicker({ value, onChange }: Props) {
  function isActive(s: (typeof SHORTCUTS)[number]): boolean {
    const r = s.get();
    return (
      toInputValue(r.from) === toInputValue(value.from) &&
      toInputValue(r.to)   === toInputValue(value.to)
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-ink-secondary">
          <Calendar size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">Período</span>
        </div>

        <div className="hidden h-4 w-px bg-panel-border sm:block" />

        <div className="flex flex-wrap gap-1.5">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              onClick={() => onChange(s.get())}
              className={`btn-ghost text-xs px-2.5 py-1 ${
                isActive(s) ? 'border-accent/60 bg-accent/10 text-accent font-semibold' : ''
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="hidden h-4 w-px bg-panel-border sm:block" />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={toInputValue(value.from)}
            max={toInputValue(value.to)}
            onChange={(e) => onChange({ ...value, from: fromInputValue(e.target.value) })}
            className="input-base w-36 text-xs [color-scheme:dark]"
          />
          <span className="text-ink-muted text-xs">→</span>
          <input
            type="date"
            value={toInputValue(value.to)}
            min={toInputValue(value.from)}
            max={toInputValue(new Date())}
            onChange={(e) => onChange({ ...value, to: fromInputValue(e.target.value) })}
            className="input-base w-36 text-xs [color-scheme:dark]"
          />
        </div>

        <span className="ml-auto hidden text-xs text-ink-muted lg:block">
          {formatDateBR(value.from)} — {formatDateBR(value.to)}
        </span>
      </div>
    </div>
  );
}
