import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, isResponse, jsonError } from '@/lib/api-helpers'
import { adminUpdateProductSchema } from '@/lib/validations'

/** PATCH /api/admin/products/[id] — editar producto (incluye mostrar/ocultar) */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (isResponse(user)) return user
  const { id } = await params

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return jsonError('Producto no encontrado', 404)

  const body = await request.json().catch(() => null)
  const parsed = adminUpdateProductSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const { name, icon, categoryId, visible, order } = parsed.data
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) return jsonError('Categoría no válida')
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(categoryId !== undefined && { categoryId }),
      ...(visible !== undefined && { visible }),
      ...(order !== undefined && { order }),
    },
    include: { category: true, _count: { select: { items: true } } },
  })
  return NextResponse.json({ product: updated })
}

/** DELETE /api/admin/products/[id] — solo si no está usado en listas */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (isResponse(user)) return user
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  })
  if (!product) return jsonError('Producto no encontrado', 404)
  if (product._count.items > 0) {
    return jsonError('No se puede eliminar: el producto ya está en listas. Mejor ocúltalo del catálogo.', 409)
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
