import type { Metadata } from 'next'
import { getNews } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import Pagination from '@/components/ui/Pagination'

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

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-[var(--color-text-primary)] mb-2">
        Noticias
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Últimas noticias médicas y de salud
      </p>

      {articles.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-16">
          No hay noticias publicadas aún.
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
        basePath="/noticias"
      />
    </div>
  )
}
