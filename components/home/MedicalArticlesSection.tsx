import type { Article } from '@/lib/api'
import Link from 'next/link'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'
import MedicalArticlesBanner from '@/components/home/MedicalArticlesBanner'

interface MedicalArticlesSectionProps {
  articles: Article[]
}

export default function MedicalArticlesSection({ articles }: MedicalArticlesSectionProps) {
  return (
    <section>
      <SectionTitle className="mb-6">Artículos Médicos</SectionTitle>

      <div className="mb-8">
        <MedicalArticlesBanner />
      </div>

      {/* Artículos */}
      {articles.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Últimos artículos publicados</p>
            <Link
              href="/articulos"
              className="text-sm font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap"
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="principal" />
            ))}
          </div>
        </>
      )}
    </section>
  )
}