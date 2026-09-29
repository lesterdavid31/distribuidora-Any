import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, isResponse, jsonError } from '@/lib/api-helpers'
import { createListSchema } from '@/lib/validations'
import type { Prisma } from '@/generated/prisma/client'

const listInclude = {
  creator: { select: { id: true, name: true } },
  buyer: { select: { id: true, name: true } },
  items: true,
} satisfies Prisma.PurchaseListInclude

/** GET /api/lists?filter=todas|asignadas|creadas|compartidas */
export async function GET(request: Request) {
  const user = await requireUser()
  if (isResponse(user)) return user

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') ?? 'todas'

  let where: Prisma.PurchaseListWhereInput
  if (filter === 'asignadas') where = { buyerId: user.id }
  else if (filter === 'creadas') where = { creatorId: user.id }
  else if (filter === 'compartidas') where = { shares: { some: { sharedWithId: user.id } }, NOT: { creatorId: user.id } }
  else {
    where = {
      OR: [
        { creatorId: user.id },
        { buyerId: user.id },
        { shares: { some: { sharedWithId: user.id } } },
      ],
    }
  }

  const lists = await prisma.purchaseList.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: listInclude,
  })

  return NextResponse.json({ lists })
}

/** POST /api/lists — crea una lista con productos del catálogo */
export async function POST(request: Request) {
  const user = await requireUser()
  if (isResponse(user)) return user

  const body = await request.json().catch(() => null)
  const parsed = createListSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')
  }
  const { title, buyerId, items } = parsed.data

  // Validar que los productos existan y estén visibles
  const productIds = [...new Set(items.map((i) => i.productId))]
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, visible: true } })
  if (products.length !== productIds.length) {
    return jsonError('Uno o más productos no están disponibles en el catálogo')
  }

  // Validar comprador asignado
  if (buyerId) {
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } })
    if (!buyer || !buyer.active) return jsonError('El comprador asignado no es válido')
  }

  const list = await prisma.purchaseList.create({
    data: {
      title,
      creatorId: user.id,
      buyerId: buyerId ?? null,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity ?? null,
          unit: i.unit || null,
        })),
      },
    },
    include: listInclude,
  })

  return NextResponse.json({ list }, { status: 201 })
}
