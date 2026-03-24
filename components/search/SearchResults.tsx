import { searchArticles } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import Pagination from '@/components/ui/Pagination'

interface Props {
  query: string
  page: number
}

export async function SearchResults({ query, page }: Props) {
  if (!query || query.length < 2) {
    return (
      <p className="text-[var(--color-text-secondary)] text-center py-12">
        Escribe al menos 2 caracteres para buscar.
      </p>
    )
  }

  const results = await searchArticles(query, page)

  if (results.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-secondary)] mb-2">
          No encontramos resultados para <strong>&ldquo;{query}&rdquo;</strong>.
        </p>
        <p className="text-[var(--color-text-muted)] text-sm">
          Intenta con otros términos o navega por{' '}
          <a href="/categorias" className="underline hover:text-[var(--color-primary)] transition-colors">
            categorías
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="text-[var(--color-text-muted)] text-sm mb-6">
        {results.meta.total} resultado{results.meta.total !== 1 ? 's' : ''} encontrado
        {results.meta.total !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {results.data.map((article) => (
          <ArticleCard key={article.id} article={article} variant="compacta" />
        ))}
      </div>

      {results.meta.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={results.meta.totalPages}
            basePath={`/buscar?q=${encodeURIComponent(query)}&page=`}
          />
        </div>
      )}
    </>
  )
}
