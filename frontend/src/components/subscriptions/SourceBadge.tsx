interface Props {
  source: 'sheet' | 'pagarme' | 'ga4';
}

const CONFIG = {
  sheet:   { label: 'Supabase',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  pagarme: { label: 'API Pagar.me', cls: 'bg-blue-50   text-blue-700   border-blue-200',    dot: 'bg-blue-500'    },
  ga4:     { label: 'Google GA4',   cls: 'bg-orange-50  text-orange-700 border-orange-200',  dot: 'bg-orange-500'  },
} as const;

export default function SourceBadge({ source }: Props) {
  const { label, cls, dot } = CONFIG[source];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
