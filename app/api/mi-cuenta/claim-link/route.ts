import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Reclamar un perfil con el token del link de invitación (B1). */
export const POST = auth0.withApiAuthRequired(async function POST(req: Request) {
  const { accessToken } = await auth0.getAccessToken()
  const body = await req.text()
  const res = await fetch(`${API_URL}/doctors/me/claim-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body,
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
})
