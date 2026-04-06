import type { Metadata } from 'next'
import { getMedicalArticles } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import Pagination from '@/components/ui/Pagination'
import MedicalArticlesBanner from '@/components/home/MedicalArticlesBanner'
import WhatsAppChannelBanner from '@/components/home/WhatsAppChannelBanner'

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
    <>
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <div className="mb-10">
        <MedicalArticlesBanner
          priority
          heading="Artículos escritos por médicos dominicanos"
        />
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
    <WhatsAppChannelBanner />
    </>
  )
}
