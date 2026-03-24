import { NextRequest, NextResponse } from 'next/server'

/**
 * Obtiene el thumbnail de una publicación de Issuu via oEmbed (API oficial).
 * GET /api/issuu-thumbnail?u=medicalreport.do&d=ed-13
 */
export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get('u')
  const d = request.nextUrl.searchParams.get('d')

  if (!u || !d) {
    return NextResponse.json({ error: 'Faltan parámetros u y d' }, { status: 400 })
  }

  const docUrl = `https://issuu.com/${u}/docs/${d}`
  const oembedUrl = `https://issuu.com/oembed?url=${encodeURIComponent(docUrl)}&format=json`

  try {
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Issuu oEmbed respondió con ${res.status}` },
        { status: res.status },
      )
    }

    const data = await res.json()

    // oEmbed devuelve _thumb_medium — intentamos _thumb_large para mejor calidad
    let thumbnail: string | null = data.thumbnail_url ?? null
    if (thumbnail?.includes('_thumb_medium')) {
      const large = thumbnail.replace('_thumb_medium', '_thumb_large')
      try {
        const probe = await fetch(large, { method: 'HEAD' })
        if (probe.ok) thumbnail = large
      } catch {
        // si falla, quedamos con medium
      }
    }

    return NextResponse.json({
      thumbnail,
      title: data.title ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Error al contactar Issuu' }, { status: 502 })
  }
}
