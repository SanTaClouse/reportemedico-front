import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Proxy autenticado: el navegador no tiene el access token (vive en la sesión
 * del server), así que el wizard llama a esta ruta y acá le agregamos el Bearer
 * para reenviar a NestJS. withApiAuthRequired devuelve 401 si no hay sesión.
 */
export const PUT = auth0.withApiAuthRequired(async function PUT(req: Request) {
  const { accessToken } = await auth0.getAccessToken()
  const body = await req.text()
  const res = await fetch(`${API_URL}/doctors/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body,
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
})
