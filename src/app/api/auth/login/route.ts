import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'
import { loginSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { roles: { include: { role: true } } },
  })
  if (!user || !user.active) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const roles = user.roles.map((r) => r.role.name)
  const token = await createSessionToken({ sub: user.id, name: user.name, email: user.email, roles })
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, roles } })
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
  return res
}
