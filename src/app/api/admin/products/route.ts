import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, isResponse, jsonError } from '@/lib/api-helpers'
import { adminProductSchema } from '@/lib/validations'

/** GET /api/admin/products — todos los productos (visibles y ocultos) con categorías */
export async function GET() {
  const user = await requireAdmin()
  if (isResponse(user)) return user

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.product.findMany({
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }, { name: 'asc' }],
      include: { category: true, _count: { select: { items: true } } },
    }),
  ])
  return NextResponse.json({ categories, products })
}

/** POST /api/admin/products — crear producto */
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (isResponse(user)) return user

  const body = await request.json().catch(() => null)
  const parsed = adminProductSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const { name, icon, categoryId, visible, order } = parsed.data
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) return jsonError('Categoría no válida')

  const existing = await prisma.product.findUnique({
    where: { name_categoryId: { name, categoryId } },
  })
  if (existing) return jsonError('Ya existe un producto con ese nombre en la categoría')

  const product = await prisma.product.create({
    data: { name, icon, categoryId, visible: visible ?? true, order: order ?? 0 },
    include: { category: true, _count: { select: { items: true } } },
  })
  return NextResponse.json({ product }, { status: 201 })
}
