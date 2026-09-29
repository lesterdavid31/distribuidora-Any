import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, isResponse, jsonError } from '@/lib/api-helpers'
import { shareListSchema } from '@/lib/validations'

/** POST /api/lists/[id]/share — comparte la lista con otro usuario interno */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (isResponse(user)) return user
  const { id } = await params

  const list = await prisma.purchaseList.findUnique({ where: { id } })
  if (!list) return jsonError('Lista no encontrada', 404)
  if (list.creatorId !== user.id && !user.roles.includes('ADMIN')) {
    return jsonError('Solo el creador puede compartir la lista', 403)
  }

  const body = await request.json().catch(() => null)
  const parsed = shareListSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const { userId } = parsed.data
  if (userId === list.creatorId) return jsonError('La lista ya es del creador')
  if (userId === list.buyerId) return jsonError('El comprador asignado ya tiene acceso')

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || !target.active) return jsonError('Usuario no válido')

  const share = await prisma.listShare.upsert({
    where: { listId_sharedWithId: { listId: id, sharedWithId: userId } },
    update: {},
    create: { listId: id, sharedWithId: userId },
    include: { sharedWith: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ share }, { status: 201 })
}

/** DELETE /api/lists/[id]/share?userId=... — quita el acceso compartido */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (isResponse(user)) return user
  const { id } = await params

  const list = await prisma.purchaseList.findUnique({ where: { id } })
  if (!list) return jsonError('Lista no encontrada', 404)
  if (list.creatorId !== user.id && !user.roles.includes('ADMIN')) {
    return jsonError('Solo el creador puede quitar el acceso', 403)
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return jsonError('Falta userId')

  await prisma.listShare.deleteMany({ where: { listId: id, sharedWithId: userId } })
  return NextResponse.json({ ok: true })
}
