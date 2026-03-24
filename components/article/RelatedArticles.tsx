import Link from 'next/link'
import type { Article } from '@/lib/api'
import ArticleCard from '@/components/article/ArticleCard'
import SectionTitle from '@/components/ui/SectionTitle'
import { PenLine } from 'lucide-react'

interface RelatedArticlesProps {
  articles: Article[]
  showDoctorCta?: boolean
}

export default function RelatedArticles({ articles, showDoctorCta = false }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <section className="mt-14 pt-10 border-t border-[var(--color-border)]">
      <SectionTitle>También te puede interesar</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article) => (
          <ArticleCard key={article.id} article={article} variant="principal" />
        ))}
      </div>

      {showDoctorCta && (
        <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 py-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary-pale)] flex items-center justify-center">
            <PenLine size={22} strokeWidth={1.5} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-1">
              ¿Sos médico o profesional de la salud?
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Tu experiencia clínica vale. Publicá tu artículo en Reporte Médico de forma gratuita —
              lo revisamos y lo publicamos en menos de 24 horas para que llegue a miles de lectores en República Dominicana.
            </p>
          </div>
          <Link
            href="/articulos/nuevo"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-light)] text-[var(--brand-navy)] text-sm font-body font-bold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Publicar mi artículo →
          </Link>
        </div>
      )}
    </section>
  )
}
