import type { Metadata } from 'next'
import { getMedicalArticles } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import Pagination from '@/components/ui/Pagination'
import Link from 'next/link'

export const revalidate = 300

interface Props {
  searchParams: { page?: string }
}

export const metadata: Metadata = {
  title: 'Artículos Médicos',
  description: 'Artículos científicos y clínicos escritos por profesionales de la salud.',
}

export default async function ArticulosPage({ searchParams }: Props) {
  const page = Number(searchParams.page) || 1
  const { data: articles, meta } = await getMedicalArticles(page)

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-4xl text-[var(--color-text-primary)] mb-2">
            Artículos Médicos
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Contenido científico y clínico del sector salud
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          <p className="text-xs text-[var(--color-text-muted)] font-medium">
            ¿Eres médico? Publica tu artículo aquí
          </p>
          <Link
            href="/articulos/nuevo"
            className="inline-flex items-center gap-2 bg-[var(--brand-gold)] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Publicar artículo
          </Link>
        </div>
      </div>

      {/* CTA móvil */}
      <div className="sm:hidden flex items-center justify-between bg-[var(--color-primary-pale)] rounded-xl px-4 py-3 mb-6">
        <p className="text-sm text-[var(--color-text-primary)] font-medium">
          ¿Eres médico? Publica tu artículo
        </p>
        <Link
          href="/articulos/nuevo"
          className="inline-flex items-center gap-1 bg-[var(--color-primary)] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Publicar
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-16">
          No hay artículos publicados aún.
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
        basePath="/articulos"
      />
    </div>
  )
}
