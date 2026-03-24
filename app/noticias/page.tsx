import type { Metadata } from 'next'
import { getNews } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import Pagination from '@/components/ui/Pagination'
import { Eye } from 'lucide-react'

export const revalidate = 300

interface Props {
  searchParams: { page?: string }
}

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Últimas noticias médicas y de salud de República Dominicana.',
}

export default async function NoticiasPage({ searchParams }: Props) {
  const page = Number(searchParams.page) || 1
  const { data: articles, meta } = await getNews(page)

  const [hero, ...rest] = articles

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <div className="flex items-baseline gap-3 mb-2">
        <h1 className="font-display font-bold text-4xl text-[var(--color-text-primary)]">
          Noticias
        </h1>
        <span className="text-sm text-[var(--color-text-muted)]">{meta.total} publicadas</span>
      </div>
      <p className="text-[var(--color-text-secondary)] mb-8 flex items-center gap-1.5">
        Últimas noticias médicas y de salud de República Dominicana
        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-full px-2 py-0.5">
          <Eye size={11} strokeWidth={1.5} /> más vistas primero
        </span>
      </p>

      {articles.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-16">
          No hay noticias publicadas aún.
        </p>
      ) : (
        <>
          {/* Primera noticia — lead destacado */}
          {hero && (
            <div className="mb-8">
              <ArticleCard article={hero} variant="lead" />
            </div>
          )}

          {/* Resto en grid */}
          {rest.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
                Más noticias
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="principal" />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        basePath="/noticias"
      />
    </div>
  )
}
