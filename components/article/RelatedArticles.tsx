import type { Article } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'

interface RelatedArticlesProps {
  articles: Article[]
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <section className="mt-14 pt-10 border-t border-[var(--color-border)]">
      <SectionTitle>También te puede interesar</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article) => (
          <ArticleCard key={article.id} article={article} variant="principal" />
        ))}
      </div>
    </section>
  )
}
