import Link from 'next/link'
import Image from 'next/image'
import { Eye } from 'lucide-react'
import type { Article } from '@/lib/api'
import { formatDate, readingTime } from '@/lib/utils'

interface HeroSectionProps {
  article: Article
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

export default function HeroSection({ article }: HeroSectionProps) {
  const href = article.type === 'NEWS' ? `/noticias/${article.slug}` : `/articulos/${article.slug}`
  const firstTag = article.tags?.[0]?.tag
  const minutes = readingTime(article.content)

  return (
    <section className="relative w-full overflow-hidden bg-[var(--brand-navy)]">
      {article.featuredImage ? (
        <div className="relative w-full h-[520px] md:h-[600px] hero-ken-burns overflow-hidden">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001450]/90 via-[#001450]/40 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-[400px] bg-[var(--brand-navy)]" />
      )}

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="max-w-site mx-auto">
          <div className="max-w-3xl">
            {/* Badge + fecha + lectura */}
            <div className="hero-anim hero-anim-1 flex items-center gap-3 mb-4 flex-wrap">
              {firstTag && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-body font-semibold uppercase tracking-widest bg-[var(--brand-gold)] text-[var(--brand-navy)]">
                  {firstTag.name}
                </span>
              )}
              <span className="text-white/60 text-xs font-body">
                {formatDate(article.publishedAt || article.createdAt)}
              </span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/60 text-xs font-body">{minutes} min lectura</span>
            </div>

            {/* Titular */}
            <h1 className="hero-gold-border font-display font-bold text-white text-3xl md:text-5xl leading-tight tracking-tight mb-3">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="hero-anim hero-anim-2 text-white/75 text-base md:text-lg line-clamp-2 mb-5 font-body">
                {article.excerpt}
              </p>
            )}

            {/* Autor + vistas + CTA */}
            <div className="hero-anim hero-anim-3 flex items-center gap-4">
              <span className="text-white/50 text-sm font-body">Por {article.authorName}</span>
              <span className="flex items-center gap-1 text-white/40 text-xs">
                <Eye size={12} strokeWidth={1.5} />
                {formatViews(article.viewsCount)}
              </span>
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-light)] text-[var(--brand-navy)] text-sm font-body font-semibold px-4 py-2 rounded transition-colors"
              >
                Leer nota →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
