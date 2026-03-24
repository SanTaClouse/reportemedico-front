import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getArticleBySlug, getNews, getRelatedByTag } from '@/lib/api'
import { formatDate, readingTime } from '@/lib/utils'
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
    const description = article.seoMetadata?.metaDescription || article.excerpt
    const image = article.seoMetadata?.ogImage || article.featuredImage
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

    return {
      title,
      description,
      openGraph: {
        title,
        description: description || '',
        images: image ? [{ url: image, width: 1200, height: 630 }] : [],
        type: 'article',
        publishedTime: article.publishedAt || undefined,
        authors: [article.authorName],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: description || '',
        images: image ? [image] : [],
      },
      alternates: {
        canonical: `${siteUrl}/noticias/${params.slug}`,
      },
    }
  } catch {
    return { title: 'Noticia no encontrada' }
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.featuredImage ? [article.featuredImage] : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    author: {
      '@type': 'Person',
      name: article.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Reporte Médico',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    inLanguage: 'es',
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

        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] mb-8 pb-6 border-b border-[var(--color-border)]">
          <span>Por <strong className="text-[var(--color-text-secondary)]">{article.authorName}</strong></span>
          <span>·</span>
          <span>{formatDate(article.publishedAt || article.createdAt)}</span>
          <span>·</span>
          <span>{minutes} min de lectura</span>
        </div>
      </div>

      {/* Featured image */}
      {article.featuredImage && (
        <div className="max-w-3xl mx-auto mb-8 rounded-xl overflow-hidden">
          <Image
            src={article.featuredImage}
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
