import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Reclamar el perfil sin dueño que coincide con mi email verificado (B2). */
export const POST = auth0.withApiAuthRequired(async function POST() {
  const { accessToken } = await auth0.getAccessToken()
  const res = await fetch(`${API_URL}/doctors/me/claim-email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
})
