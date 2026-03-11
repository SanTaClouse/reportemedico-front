import type { Article } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'

interface FeaturedGridProps {
  articles: Article[]
}

export default function FeaturedGrid({ articles }: FeaturedGridProps) {
  const [first, second, ...rest] = articles

  return (
    <section>
      <SectionTitle>Destacadas</SectionTitle>

      {/* Relevancia 2: cards grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {first && <ArticleCard article={first} variant="principal" />}
        {second && <ArticleCard article={second} variant="principal" />}
      </div>

      {/* Relevancia 3: cards compactas */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.slice(0, 4).map((article) => (
            <ArticleCard key={article.id} article={article} variant="compacta" />
          ))}
        </div>
      )}
    </section>
  )
}
