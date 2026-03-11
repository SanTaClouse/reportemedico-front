import Link from 'next/link'
import type { Article } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'

interface MedicalArticlesSectionProps {
  articles: Article[]
}

export default function MedicalArticlesSection({ articles }: MedicalArticlesSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <SectionTitle className="flex-1 mr-4">Artículos Médicos</SectionTitle>
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

      <div className="mt-8 text-center">
        <Link
          href="/articulos/nuevo"
          className="inline-flex items-center gap-2 border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-primary hover:text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          ¿Eres médico? Publica tu artículo →
        </Link>
      </div>
    </section>
  )
}
