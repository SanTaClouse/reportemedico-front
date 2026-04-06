import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticlesByTag, getTags } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import Pagination from '@/components/ui/Pagination'

export const revalidate = 60

interface Props {
  params: { slug: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tags = await getTags().catch(() => [])
  const tag = tags.find((t) => t.slug === params.slug)
  const name = tag?.name || params.slug
  const title = name
  const description =
    tag?.description ||
    `Artículos y noticias sobre ${name} en Reporte Médico — la plataforma de salud líder en República Dominicana.`
  const url = `/tag/${params.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} | Reporte Médico`,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Reporte Médico`,
      description,
    },
  }
}

export async function generateStaticParams() {
  const tags = await getTags().catch(() => [])
  return tags.map((t) => ({ slug: t.slug }))
}

export default async function TagPage({ params, searchParams }: Props) {
  const page = Number(searchParams.page) || 1
  let result
  try {
    result = await getArticlesByTag(params.slug, page)
  } catch {
    notFound()
  }

  const { data: articles, meta } = result

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-1">
          Tag
        </p>
        <h1 className="font-display font-bold text-4xl text-[var(--color-text-primary)] capitalize">
          {params.slug.replace(/-/g, ' ')}
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          {meta.total} {meta.total === 1 ? 'artículo' : 'artículos'}
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-16">
          No hay contenido con este tag.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="principal" />
          ))}
        </div>
      )}

      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        basePath={`/tag/${params.slug}`}
      />
    </div>
  )
}
