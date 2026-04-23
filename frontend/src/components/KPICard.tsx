import type { ReactNode } from 'react';

type Variant = 'default' | 'positive' | 'caution' | 'negative' | 'accent';

const variantStyles: Record<Variant, { border: string; value: string; bg: string }> = {
  default:  { border: 'border-panel-border',  value: 'text-primary',   bg: '' },
  positive: { border: 'border-positive/40',   value: 'text-positive',  bg: 'bg-positive/8' },
  caution:  { border: 'border-caution/40',    value: 'text-caution',   bg: 'bg-caution/8' },
  negative: { border: 'border-negative/40',   value: 'text-negative',  bg: 'bg-negative/8' },
  accent:   { border: 'border-accent/40',     value: 'text-accent',    bg: 'bg-accent/8' },
};

interface Props {
  label: string;
  value: string | number | null;
  sub?: string;
  icon?: ReactNode;
  loading?: boolean;
  variant?: Variant;
  badge?: { text: string; variant: Variant };
}

export default function KPICard({ label, value, sub, icon, loading = false, variant = 'default', badge }: Props) {
  const s = variantStyles[variant];

  return (
    <div className={`glass-card p-5 ${s.border} ${s.bg} flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">
          {label}
        </p>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>

      {loading ? (
        <div className="h-8 w-28 animate-pulse rounded-md bg-panel-raised" />
      ) : (
        <p className={`text-3xl font-bold tabular-nums tracking-tight ${s.value}`}>
          {value ?? '—'}
        </p>
      )}

      <div className="flex items-center justify-between">
        {sub && <p className="text-xs text-ink-muted leading-snug">{sub}</p>}
        {badge && (
          <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs font-bold
            ${variantStyles[badge.variant].value} ${variantStyles[badge.variant].border}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
