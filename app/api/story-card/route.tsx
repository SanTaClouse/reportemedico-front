import { NextRequest, NextResponse } from 'next/server'
import { getArticleBySlug } from '@/lib/api'
import { renderStoryCard } from '@/lib/og-image'

export const runtime = 'nodejs'

/**
 * GET /api/story-card?slug=<slug>
 *
 * Genera una imagen vertical 1080×1920 (formato Stories) con la portada del
 * artículo y la marca Reporte Médico. La consume el botón "Compartir en
 * historia" del componente ArticleShare, que la descarga como File y la pasa a
 * navigator.share({ files }).
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug requerido' }, { status: 400 })
  }

  try {
    const article = await getArticleBySlug(slug)
    return renderStoryCard({ article })
  } catch {
    return NextResponse.json({ error: 'artículo no encontrado' }, { status: 404 })
  }
}
