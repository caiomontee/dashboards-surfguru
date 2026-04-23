interface Props {
  label: string;
  value: string | number | null;
  sub?: string;
  highlight?: boolean;
  loading?: boolean;
  color?: 'blue' | 'green' | 'amber' | 'rose';
}

const colorMap = {
  blue: 'border-ocean-600 bg-ocean-900/30',
  green: 'border-emerald-600 bg-emerald-900/30',
  amber: 'border-amber-500 bg-amber-900/30',
  rose: 'border-rose-500 bg-rose-900/30',
};

const valueColorMap = {
  blue: 'text-ocean-400',
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
};

export default function MetricCard({
  label,
  value,
  sub,
  highlight = false,
  loading = false,
  color = 'blue',
}: Props) {
  return (
    <div
      className={`rounded-xl border p-5 ${colorMap[color]} ${
        highlight ? 'ring-1 ring-offset-1 ring-offset-slate-950 ring-ocean-500' : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-slate-700" />
      ) : (
        <p className={`mt-1 text-3xl font-bold tabular-nums ${valueColorMap[color]}`}>
          {value ?? '—'}
        </p>
      )}
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
