import { STATUS_LABELS } from '@/lib/utils'

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  PENDIENTE: { pill: 'bg-warn-soft text-warn-ink', dot: 'bg-amber-500' },
  EN_COMPRA: { pill: 'bg-info-soft text-info-ink', dot: 'bg-blue-500' },
  COMPLETADA: { pill: 'bg-brand-soft text-brand-ink', dot: 'bg-brand' },
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { pill: 'bg-paper text-ink-2', dot: 'bg-ink-3' }
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
