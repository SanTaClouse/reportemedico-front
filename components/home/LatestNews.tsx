import Link from 'next/link'
import type { Article } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'

interface LatestNewsProps {
  articles: Article[]
}

export default function LatestNews({ articles }: LatestNewsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <SectionTitle className="flex-1 mr-4">Últimas Noticias</SectionTitle>
        <Link
          href="/noticias"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap"
        >
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="compacta" />
        ))}
      </div>
    </section>
  )
}
