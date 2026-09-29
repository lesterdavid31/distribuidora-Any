import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, isResponse, jsonError, type AuthUser } from '@/lib/api-helpers'
import { updateListSchema } from '@/lib/validations'
import type { Prisma } from '@/generated/prisma/client'

const detailInclude = {
  creator: { select: { id: true, name: true } },
  buyer: { select: { id: true, name: true } },
  items: {
    orderBy: [{ product: { category: { order: 'asc' } } }, { product: { order: 'asc' } }],
    include: { product: { include: { category: true } } },
  },
  shares: { include: { sharedWith: { select: { id: true, name: true } } } },
} satisfies Prisma.PurchaseListInclude

type ListWithRelations = Prisma.PurchaseListGetPayload<{ include: typeof detailInclude }>

function canView(list: ListWithRelations, user: AuthUser) {
  return (
    user.roles.includes('ADMIN') ||
    list.creatorId === user.id ||
    list.buyerId === user.id ||
    list.shares.some((s) => s.sharedWithId === user.id)
  )
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (isResponse(user)) return user
  const { id } = await params

  const list = await prisma.purchaseList.findUnique({ where: { id }, include: detailInclude })
  if (!list) return jsonError('Lista no encontrada', 404)
  if (!canView(list, user)) return jsonError('No tienes acceso a esta lista', 403)

  return NextResponse.json({ list })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (isResponse(user)) return user
  const { id } = await params

  const list = await prisma.purchaseList.findUnique({ where: { id } })
  if (!list) return jsonError('Lista no encontrada', 404)
  const isAdmin = user.roles.includes('ADMIN')
  if (list.creatorId !== user.id && !isAdmin) {
    return jsonError('Solo el creador puede editar la lista', 403)
  }

  const body = await request.json().catch(() => null)
  const parsed = updateListSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const { title, buyerId, purchaseDate } = parsed.data

  if (buyerId) {
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } })
    if (!buyer || !buyer.active) return jsonError('El comprador asignado no es válido')
  }

  const updated = await prisma.purchaseList.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(buyerId !== undefined && { buyerId: buyerId || null }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
    },
    include: detailInclude,
  })

  return NextResponse.json({ list: updated })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (isResponse(user)) return user
  const { id } = await params

  const list = await prisma.purchaseList.findUnique({ where: { id } })
  if (!list) return jsonError('Lista no encontrada', 404)
  if (list.creatorId !== user.id && !user.roles.includes('ADMIN')) {
    return jsonError('Solo el creador puede eliminar la lista', 403)
  }

  await prisma.purchaseList.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
