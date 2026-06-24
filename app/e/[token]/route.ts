import { NextRequest, NextResponse } from 'next/server'

// Redirección tokenizada de los links de email (08 §2): registra el clic
// (EmailClick), deja una cookie para atribuir la sesión que el médico abra
// después, y redirige al destino real.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token
  const toParam = req.nextUrl.searchParams.get('to') || '/'
  // Anti open-redirect: solo rutas internas (descarta // protocol-relative)
  const to = toParam.startsWith('/') && !toParam.startsWith('//') ? toParam : '/'

  // Registrar el clic (best-effort: nunca bloquea la redirección)
  try {
    await fetch(`${API_URL}/engagement/email-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(2500),
    })
  } catch {
    // se ignora a propósito
  }

  const res = NextResponse.redirect(new URL(to, SITE_URL))
  res.cookies.set('rm_et', token, {
    maxAge: 7 * 24 * 60 * 60, // 7 días para atribuir una sesión posterior
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return res
}
