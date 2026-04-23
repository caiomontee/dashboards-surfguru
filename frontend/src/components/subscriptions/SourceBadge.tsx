interface Props {
  source: 'sheet' | 'pagarme';
}

const CONFIG = {
  sheet:   { label: 'Planilha Geral',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pagarme: { label: 'API Pagar.me',    cls: 'bg-blue-50   text-blue-700   border-blue-200' },
} as const;

export default function SourceBadge({ source }: Props) {
  const { label, cls } = CONFIG[source];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${source === 'sheet' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
      {label}
    </span>
  );
}
