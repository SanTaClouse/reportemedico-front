import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { getNews } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'

export default async function NotFound() {
  const recent = await getNews(1, 3).catch(() => ({ data: [] }))
  const articles = recent.data ?? []

  return (
    <main className="min-h-[60vh] px-4 py-16 max-w-site mx-auto">
      <div className="text-center max-w-md mx-auto">
        <p
          className="text-[12rem] font-display font-bold leading-none select-none"
          style={{ color: 'var(--color-primary)', opacity: 0.08 }}
        >
          404
        </p>

        <h1
          className="font-display text-2xl font-bold -mt-8 mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Página no encontrada
        </h1>

        <p className="font-body mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          El artículo o página que buscas no existe o fue movido.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Ir al inicio
          </Link>

          <Link
            href="/noticias"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--color-surface-2)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <Search size={16} strokeWidth={1.5} />
            Ver noticias
          </Link>
        </div>
      </div>

      {articles.length > 0 && (
        <div className="mt-16 max-w-4xl mx-auto">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-6">
            Noticias recientes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="compacta" />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
