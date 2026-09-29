import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, isResponse, jsonError } from '@/lib/api-helpers'
import { adminUpdateUserSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'

/** PATCH /api/admin/users/[id] — editar nombre, roles, activo, resetear contraseña */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (isResponse(admin)) return admin
  const { id } = await params

  const target = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  })
  if (!target) return jsonError('Usuario no encontrado', 404)

  const body = await request.json().catch(() => null)
  const parsed = adminUpdateUserSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const { name, roles, active, password } = parsed.data

  // Protección: un admin no puede quitarse a sí mismo el rol ADMIN ni desactivarse
  if (target.id === admin.id) {
    if (active === false) return jsonError('No puedes desactivar tu propia cuenta')
    if (roles && !roles.includes('ADMIN')) return jsonError('No puedes quitarte el rol de administrador')
  }

  if (roles) {
    const roleRecords = await prisma.role.findMany({ where: { name: { in: roles } } })
    await prisma.userRole.deleteMany({ where: { userId: id } })
    await prisma.userRole.createMany({
      data: roleRecords.map((r) => ({ userId: id, roleId: r.id })),
    })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(active !== undefined && { active }),
      ...(password && { passwordHash: await hashPassword(password) }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  })

  return NextResponse.json({ user: { ...updated, roles: updated.roles.map((r) => r.role.name) } })
}
