import { getArticleBySlug } from '@/lib/api'
import { renderArticleOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image'

export const runtime = 'nodejs'
// Cachea la OG image generada (ISR). Evita re-renderizar Satori en cada crawl
// de WhatsApp/Facebook, que con el backend dormido en Render expira y deja la
// preview sin imagen. Se auto-revalida cada 24 h.
export const revalidate = 86400
export const alt = 'Noticia de Reporte Médico'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  return renderArticleOgImage({ article, kind: 'Noticia' })
}
