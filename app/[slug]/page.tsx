import { redirect, notFound } from 'next/navigation'
import { getArticleBySlug } from '@/lib/api'

interface Props {
  params: { slug: string }
}

/**
 * Ruta de compatibilidad con URLs del WordPress anterior.
 * Las URLs viejas eran: /slug-del-articulo/
 * Las URLs nuevas son:  /noticias/slug o /articulos/slug
 *
 * Redirige con 301 (permanente) para preservar el SEO del sitio anterior.
 */
export default async function LegacySlugRedirect({ params }: Props) {
  let article

  try {
    article = await getArticleBySlug(params.slug)
  } catch {
    notFound()
  }

  if (article.type === 'NEWS') {
    redirect(`/noticias/${article.slug}`)
  }

  redirect(`/articulos/${article.slug}`)
}
