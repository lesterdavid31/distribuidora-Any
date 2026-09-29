import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, isResponse, jsonError } from '@/lib/api-helpers'
import { patchItemSchema } from '@/lib/validations'
import type { Prisma } from '@/generated/prisma/client'

/**
 * PATCH /api/lists/[id]/items/[itemId]
 * Marca/desmarca el producto y registra precios.
 * Regla de negocio: precio de compra OBLIGATORIO al marcar; precio de venta opcional.
 * Solo el creador de la lista o el comprador asignado pueden editar.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await requireUser()
  if (isResponse(user)) return user
  const { id: listId, itemId } = await params

  const list = await prisma.purchaseList.findUnique({ where: { id: listId } })
  if (!list) return jsonError('Lista no encontrada', 404)

  const isAdmin = user.roles.includes('ADMIN')
  if (list.creatorId !== user.id && list.buyerId !== user.id && !isAdmin) {
    return jsonError('Solo el creador o el comprador asignado pueden registrar compras', 403)
  }

  const item = await prisma.listItem.findUnique({ where: { id: itemId } })
  if (!item || item.listId !== listId) return jsonError('Producto no encontrado en la lista', 404)

  const body = await request.json().catch(() => null)
  const parsed = patchItemSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')
  }
  const { checked, purchasePrice, salePrice, quantity, unit } = parsed.data

  const updatedItem = await prisma.listItem.update({
    where: { id: itemId },
    data: {
      checked,
      // Si se desmarca, limpiar precios
      purchasePrice: checked ? (purchasePrice ?? null) : null,
      salePrice: checked ? (salePrice ?? null) : null,
      ...(quantity !== undefined && { quantity: quantity ?? null }),
      ...(unit !== undefined && { unit: unit || null }),
    },
    include: { product: { include: { category: true } } },
  })

  // Recalcular estado de la lista y fecha de compra
  const allItems = await prisma.listItem.findMany({ where: { listId }, select: { checked: true } })
  const checkedCount = allItems.filter((i) => i.checked).length
  const status =
    checkedCount === 0 ? 'PENDIENTE' : checkedCount === allItems.length ? 'COMPLETADA' : 'EN_COMPRA'

  const listUpdate: Prisma.PurchaseListUpdateInput = { status }
  if (checkedCount > 0 && !list.purchaseDate) {
    listUpdate.purchaseDate = new Date() // fecha de compra automática al marcar el primer producto
  }
  const updatedList = await prisma.purchaseList.update({ where: { id: listId }, data: listUpdate })

  return NextResponse.json({
    item: updatedItem,
    listStatus: updatedList.status,
    purchaseDate: updatedList.purchaseDate,
  })
}
