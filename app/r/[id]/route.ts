import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Redirección de enlaces del bio: /r/:id
 * 1) registra el clic en el backend (reenvía UA + referrer del visitante, sin PII)
 * 2) hace 302 al destino real
 * Si el backend falla o el enlace no existe, vuelve a /bio para no dejar al usuario colgado.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const fallback = new URL('/bio', req.nextUrl.origin)
  let destination: string = fallback.toString()

  try {
    const res = await fetch(`${API_URL}/bio/links/${params.id}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': req.headers.get('user-agent') ?? '',
      },
      body: JSON.stringify({ referrer: req.headers.get('referer') ?? undefined }),
    })
    if (res.ok) {
      const data = (await res.json()) as { url?: string }
      if (data?.url) destination = data.url
    }
  } catch {
    // best-effort: nunca rompe la navegación del visitante
  }

  return NextResponse.redirect(destination, { status: 302 })
}
