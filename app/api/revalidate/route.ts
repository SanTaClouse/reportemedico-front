import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Paths públicos que se invalidan cuando un admin hace un cambio
const PUBLIC_PATHS = ['/', '/noticias', '/articulos', '/ediciones']

export async function POST(request: NextRequest) {
  // Revalidar paths extra si vienen en el body
  let extraPaths: string[] = []
  try {
    const body = await request.json()
    if (Array.isArray(body.paths)) extraPaths = body.paths
  } catch {
    // body vacío está bien
  }

  const paths = [...PUBLIC_PATHS, ...extraPaths]
  paths.forEach((p) => revalidatePath(p))

  return NextResponse.json({ revalidated: true, paths })
}
