import { NextResponse } from 'next/server'
import { getCurrentUser } from './auth'

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Devuelve el usuario autenticado o null (el caller responde 401) */
export async function requireUser(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser()
  if (!user) return jsonError('No autenticado', 401)
  return user
}

export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser()
  if (!user) return jsonError('No autenticado', 401)
  if (!user.roles.includes('ADMIN')) return jsonError('Solo administradores', 403)
  return user
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}
