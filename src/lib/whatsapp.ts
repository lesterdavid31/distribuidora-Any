import { formatDate, formatQ } from './utils'

type WhatsAppItem = {
  checked: boolean
  quantity: number | string | null
  unit: string | null
  purchasePrice: number | string | null
  salePrice: number | string | null
  product: { name: string; icon: string; category: { name: string; icon: string } }
}

type WhatsAppList = {
  title: string
  purchaseDate: Date | string | null
  createdAt: Date | string
  buyer?: { name: string } | null
  creator?: { name: string } | null
  items: WhatsAppItem[]
}

/** Genera el texto formateado de la lista para copiar/compartir por WhatsApp */
export function buildWhatsAppText(list: WhatsAppList): string {
  const lines: string[] = []
  lines.push(`🛒 *LISTA DE COMPRAS: ${list.title.toUpperCase()}*`)
  lines.push(`📅 Fecha: ${formatDate(list.purchaseDate ?? list.createdAt)}`)
  if (list.buyer) lines.push(`👤 Comprador: ${list.buyer.name}`)
  if (list.creator) lines.push(`📝 Creada por: ${list.creator.name}`)
  lines.push('')

  // Agrupar por categoría
  const byCategory = new Map<string, WhatsAppItem[]>()
  for (const item of list.items) {
    const cat = item.product.category.name
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(item)
  }

  for (const [category, items] of byCategory) {
    lines.push(`*${category.toUpperCase()}*`)
    for (const item of items) {
      const qty = item.quantity ? ` — ${item.quantity}${item.unit ? ' ' + item.unit : ''}` : ''
      if (item.checked) {
        const prices = [`Compra: ${formatQ(item.purchasePrice)}`]
        if (item.salePrice) prices.push(`Venta: ${formatQ(item.salePrice)}`)
        lines.push(`✅ ${item.product.icon} ${item.product.name}${qty} | ${prices.join(' | ')}`)
      } else {
        lines.push(`⬜ ${item.product.icon} ${item.product.name}${qty}`)
      }
    }
    lines.push('')
  }

  // Totales de lo comprado
  const checked = list.items.filter((i) => i.checked)
  if (checked.length > 0) {
    const totalCompra = checked.reduce((s, i) => s + Number(i.purchasePrice ?? 0), 0)
    const totalVenta = checked.reduce((s, i) => s + Number(i.salePrice ?? 0), 0)
    lines.push(`💰 *Total compra:* ${formatQ(totalCompra)}`)
    if (totalVenta > 0) {
      lines.push(`🏷️ *Total venta:* ${formatQ(totalVenta)}`)
      lines.push(`📈 *Margen:* ${formatQ(totalVenta - totalCompra)}`)
    }
    lines.push('')
  }

  lines.push('_Enviado desde MercadoApp_')
  return lines.join('\n')
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
