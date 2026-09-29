import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, isResponse, jsonError } from '@/lib/api-helpers'
import { adminCreateUserSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'

/** GET /api/admin/users — todos los usuarios con sus roles */
export async function GET() {
  const user = await requireAdmin()
  if (isResponse(user)) return user

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
      roles: { select: { role: { select: { name: true } } } },
      _count: { select: { createdLists: true, assignedLists: true } },
    },
  })
  return NextResponse.json({
    users: users.map((u) => ({ ...u, roles: u.roles.map((r) => r.role.name) })),
  })
}

/** POST /api/admin/users — crear usuario con roles */
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (isResponse(user)) return user

  const body = await request.json().catch(() => null)
  const parsed = adminCreateUserSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const { name, email, password, roles } = parsed.data
  const emailNorm = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (existing) return jsonError('Ya existe un usuario con ese correo', 409)

  const roleRecords = await prisma.role.findMany({ where: { name: { in: roles } } })
  const passwordHash = await hashPassword(password)

  const created = await prisma.user.create({
    data: {
      name,
      email: emailNorm,
      passwordHash,
      roles: { create: roleRecords.map((r) => ({ roleId: r.id })) },
    },
    select: { id: true, name: true, email: true },
  })
  return NextResponse.json({ user: created }, { status: 201 })
}
