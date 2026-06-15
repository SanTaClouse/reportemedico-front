import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Proxy autenticado de subida de foto del médico (multipart → NestJS). */
export const POST = auth0.withApiAuthRequired(async function POST(req: Request) {
  const { accessToken } = await auth0.getAccessToken()
  const formData = await req.formData()
  const res = await fetch(`${API_URL}/media/upload/mi-foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }, // fetch fija el Content-Type multipart con su boundary
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
})
