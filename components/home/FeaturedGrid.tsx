import type { Article } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'

interface FeaturedGridProps {
  lead: Article | null
  bigFeatured: Article[]
  smallFeatured: Article[]
}

export default function FeaturedGrid({ lead, bigFeatured, smallFeatured }: FeaturedGridProps) {
  const [big1, big2] = bigFeatured

  return (
    <section>
      <SectionTitle>Noticias Destacadas</SectionTitle>

      {/* Lead izquierda (2 filas) + Big Destacadas derechas */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        {lead && (
          <div className="md:row-span-2 h-full">
            <ArticleCard article={lead} variant="lead" />
          </div>
        )}
        {big1 && <ArticleCard article={big1} variant="principal" />}
        {big2 && <ArticleCard article={big2} variant="principal" />}
      </div>

      {/* Small Destacadas — compactas debajo (máx 8, grilla de 4 columnas) */}
      {smallFeatured.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {smallFeatured.map((article) => (
            <ArticleCard key={article.id} article={article} variant="compacta" />
          ))}
        </div>
      )}
    </section>
  )
}
