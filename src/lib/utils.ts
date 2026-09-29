/** Formatea un número/Decimal como Quetzales guatemaltecos */
export function formatQ(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(n)) return '—'
  return `Q ${n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** dd/mm/yyyy */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_COMPRA: 'En compra',
  COMPLETADA: 'Completada',
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COMPRADOR: 'Comprador',
  VENDEDOR: 'Vendedor',
}
