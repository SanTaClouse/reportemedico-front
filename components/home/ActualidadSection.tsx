import Link from 'next/link'
import type { Article } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'

interface ActualidadSectionProps {
  articles: Article[]
}

export default function ActualidadSection({ articles }: ActualidadSectionProps) {
  if (articles.length === 0) return null

  // Dividir en grupos de 3 (máx 4 grupos = 12 artículos)
  const groups: Article[][] = []
  for (let i = 0; i < articles.length; i += 3) {
    groups.push(articles.slice(i, i + 3))
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <SectionTitle className="flex-1 mr-4">Actualidad</SectionTitle>
        <Link
          href="/noticias"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap"
        >
          Ver todas →
        </Link>
      </div>

      <div className="space-y-8">
        {groups.map((group, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.map((article) => (
              <ArticleCard key={article.id} article={article} variant="compacta" />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
