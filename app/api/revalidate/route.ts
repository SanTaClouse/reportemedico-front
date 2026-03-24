import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Paths públicos que se invalidan cuando un admin hace un cambio
const PUBLIC_PATHS = ['/', '/noticias', '/articulos', '/ediciones', '/sobre-nosotros', '/podcast']

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

function isAuthorized(request: NextRequest): boolean {
  // Opción 1: secret externo (para llamadas desde backend u otros servicios)
  const authHeader = request.headers.get('authorization')
  if (REVALIDATE_SECRET && authHeader === `Bearer ${REVALIDATE_SECRET}`) return true

  // Opción 2: cookie de admin (para llamadas desde el panel — el browser la envía automáticamente)
  const adminCookie = request.cookies.get('rm_token')
  if (adminCookie?.value) return true

  return false
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Revalidar paths extra si vienen en el body
  let extraPaths: string[] = []
  try {
    const body = await request.json()
    if (Array.isArray(body.paths)) {
      // Solo permitir paths que empiecen con /
      extraPaths = body.paths.filter((p: unknown) => typeof p === 'string' && p.startsWith('/'))
    }
  } catch {
    // body vacío está bien
  }

  const paths = [...PUBLIC_PATHS, ...extraPaths]
  paths.forEach((p) => revalidatePath(p))
  revalidateTag('council-members')
  revalidateTag('podcast-episodes')

  return NextResponse.json({ revalidated: true, paths })
}
