import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getArticleBySlug, getNews, getRelatedByTag } from '@/lib/api'
import { formatDate, readingTime } from '@/lib/utils'
import { cldUrl } from '@/lib/cloudinary'
import ArticleBody from '@/components/article/ArticleBody'
import ArticleShare from '@/components/article/ArticleShare'
import ArticleSources from '@/components/article/ArticleSources'
import RelatedArticles from '@/components/article/RelatedArticles'
import TagBadge from '@/components/ui/TagBadge'
import ViewsCounter from '@/components/article/ViewsCounter'

export const revalidate = 600

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const article = await getArticleBySlug(params.slug)
    const title = article.seoMetadata?.metaTitle || article.title
    const description =
      article.seoMetadata?.metaDescription ||
      article.excerpt ||
      `${article.title} — Noticia de Reporte Médico.`
    const url = `/noticias/${params.slug}`
    const tagNames = article.tags?.map(({ tag }) => tag.name) ?? []
    const section = tagNames[0] || 'Salud'
    const authorDisplayName = article.authorName?.trim() || 'Redacción Reporte Médico'

    return {
      title,
      description,
      // Nota: NO seteamos openGraph.images aquí — Next.js inyecta automáticamente
      // la imagen generada por app/noticias/[slug]/opengraph-image.tsx
      openGraph: {
        title,
        description,
        url,
        type: 'article',
        publishedTime: article.publishedAt || article.createdAt,
        modifiedTime: article.updatedAt,
        authors: [authorDisplayName],
        section,
        tags: tagNames,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      authors: [{ name: authorDisplayName }],
      keywords: tagNames.length > 0 ? tagNames : undefined,
      alternates: {
        canonical: url,
      },
    }
  } catch {
    return {
      title: 'Noticia no encontrada',
      robots: { index: false, follow: false },
    }
  }
}

export async function generateStaticParams() {
  try {
    const { data } = await getNews(1, 50)
    return data.map((a) => ({ slug: a.slug }))
  } catch {
    return []
  }
}

export default async function NoticiaPage({ params }: Props) {
  let article
  try {
    article = await getArticleBySlug(params.slug)
  } catch {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'
  const articleUrl = `${siteUrl}/noticias/${article.slug}`
  const minutes = readingTime(article.content)

  // Relacionadas por tag (más vistas) → fallback a últimas noticias
  const tagSlugs = article.tags?.map(({ tag }: any) => tag.slug) ?? []
  let relatedArticles: any[] = []
  if (tagSlugs.length > 0) {
    const res = await getRelatedByTag(tagSlugs[0]).catch(() => ({ data: [] as any[] }))
    relatedArticles = res.data.filter((a) => a.slug !== article.slug).slice(0, 3)
  }
  if (relatedArticles.length === 0) {
    const res = await getNews(1, 4).catch(() => ({ data: [] as any[] }))
    relatedArticles = res.data.filter((a) => a.slug !== article.slug).slice(0, 3)
  }

  const tagNames = article.tags?.map(({ tag }) => tag.name) ?? []
  const plainText = article.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = plainText ? plainText.split(' ').length : undefined
  const authorDisplayName = article.authorName?.trim() || 'Redacción Reporte Médico'
  const publishedIso = article.publishedAt || article.createdAt
  const modifiedIso = article.updatedAt || publishedIso
  const wasUpdated = Boolean(article.updatedAt) && article.updatedAt !== publishedIso

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title.slice(0, 110),
    description: article.excerpt || undefined,
    image: article.featuredImage
      ? [
          {
            '@type': 'ImageObject',
            url: article.featuredImage,
            width: 1200,
            height: 630,
          },
        ]
      : undefined,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: {
      '@type': 'Person',
      name: authorDisplayName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Reporte Médico',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: tagNames[0] || 'Salud',
    keywords: tagNames.length > 0 ? tagNames.join(', ') : undefined,
    wordCount,
    timeRequired: `PT${minutes}M`,
    inLanguage: 'es',
    isAccessibleForFree: true,
  }

  return (
    <article className="max-w-site mx-auto px-4 md:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="text-xs text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-primary)]">Inicio</Link>
        <span>/</span>
        <Link href="/noticias" className="hover:text-[var(--color-primary)]">Noticias</Link>
        {article.tags?.[0]?.tag && (
          <>
            <span>/</span>
            <Link href={`/tag/${article.tags[0].tag.slug}`} className="hover:text-[var(--color-primary)]">
              {article.tags[0].tag.name}
            </Link>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="max-w-article mx-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags?.map(({ tag }) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>

        <h1 className="font-display font-bold text-4xl md:text-5xl text-[var(--color-text-primary)] leading-tight mb-4">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-5">
            {article.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-muted)] mb-8 pb-6 border-b border-[var(--color-border)]">
          <span>Por <strong className="text-[var(--color-text-secondary)]">{authorDisplayName}</strong></span>
          <span>·</span>
          <time dateTime={publishedIso}>Publicado: {formatDate(publishedIso)}</time>
          {wasUpdated && (
            <>
              <span>·</span>
              <time dateTime={modifiedIso}>Actualizado: {formatDate(modifiedIso)}</time>
            </>
          )}
          <span>·</span>
          <span>{minutes} min de lectura</span>
        </div>
      </div>

      {/* Featured image */}
      {article.featuredImage && (
        <div className="max-w-3xl mx-auto mb-8 rounded-xl overflow-hidden">
          <Image
            src={cldUrl(article.featuredImage, { w: 1800, h: 1012 })}
            alt={article.title}
            width={900}
            height={506}
            className="w-full object-cover"
            priority
          />
        </div>
      )}

      {/* Share + body */}
      <div className="relative max-w-article mx-auto">
        <ArticleShare title={article.title} url={articleUrl} />

        <ArticleBody html={article.content} />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[var(--color-border)]">
            {article.tags.map(({ tag }) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* Sources */}
        {article.sources && article.sources.length > 0 && (
          <ArticleSources sources={article.sources} />
        )}
      </div>

      {/* View counter (client side) */}
      <ViewsCounter slug={article.slug} />

      {relatedArticles.length > 0 && <RelatedArticles articles={relatedArticles} />}
    </article>
  )
}
