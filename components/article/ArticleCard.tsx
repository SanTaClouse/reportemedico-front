import Link from 'next/link'
import Image from 'next/image'
import type { Article } from '@/lib/api'
import { formatDateShort, readingTime } from '@/lib/utils'
import TagBadge from '@/components/ui/TagBadge'

interface ArticleCardProps {
  article: Article
  variant?: 'hero' | 'principal' | 'compacta' | 'minima'
}

export default function ArticleCard({ article, variant = 'principal' }: ArticleCardProps) {
  const href = article.type === 'NEWS' ? `/noticias/${article.slug}` : `/articulos/${article.slug}`
  const firstTag = article.tags?.[0]?.tag
  const dateStr = article.publishedAt || article.createdAt

  if (variant === 'compacta') {
    return (
      <Link href={href} className="flex gap-4 group card-hover">
        {article.featuredImage && (
          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden img-hover">
            <Image
              src={article.featuredImage}
              alt={article.title}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {firstTag && (
            <span className="text-[10px] font-body font-semibold uppercase tracking-wide text-[var(--brand-electric)] mb-1 block">
              {firstTag.name}
            </span>
          )}
          <h3 className="font-body font-medium text-[var(--color-text-primary)] text-sm leading-snug line-clamp-2 group-hover:text-[var(--brand-navy)] transition-colors">
            {article.title}
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{formatDateShort(dateStr)}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'minima') {
    return (
      <Link href={href} className="flex gap-3 group">
        {/* Número en gold — se puede pasar vía prop en el futuro */}
        <div className="flex-1 min-w-0">
          {firstTag && (
            <span className="text-[10px] font-body font-semibold uppercase tracking-wide text-[var(--brand-electric)] mb-0.5 block">
              {firstTag.name}
            </span>
          )}
          <h3 className="font-body font-medium text-sm text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--brand-navy)] transition-colors">
            {article.title}
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{formatDateShort(dateStr)}</p>
        </div>
      </Link>
    )
  }

  // variant: 'principal' (default)
  return (
    <Link
      href={href}
      className="block group card-hover rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {article.featuredImage && (
        <div className="aspect-video overflow-hidden img-hover">
          <Image
            src={article.featuredImage}
            alt={article.title}
            width={600}
            height={338}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        {firstTag && <TagBadge tag={firstTag} asLink={false} />}
        <h3 className="font-display font-semibold text-[var(--color-text-primary)] text-lg mt-2 mb-1 leading-snug line-clamp-2 group-hover:text-[var(--brand-navy)] transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>{article.authorName}</span>
          <span>·</span>
          <span>{formatDateShort(dateStr)}</span>
          <span>·</span>
          <span>{readingTime(article.content)} min</span>
        </div>
      </div>
    </Link>
  )
}
