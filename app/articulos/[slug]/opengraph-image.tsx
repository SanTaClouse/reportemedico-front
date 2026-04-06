import { getArticleBySlug } from '@/lib/api'
import { renderArticleOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image'

export const runtime = 'nodejs'
export const alt = 'Artículo médico de Reporte Médico'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  return renderArticleOgImage({ article, kind: 'Artículo médico' })
}
