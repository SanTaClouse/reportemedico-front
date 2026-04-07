import Link from 'next/link'
import Image from 'next/image'
import type { Article } from '@/lib/api'
import { formatDateShort, readingTime } from '@/lib/utils'
import { cldUrl } from '@/lib/cloudinary'
import TagBadge from '@/components/ui/TagBadge'

interface ArticleCardProps {
  article: Article
  variant?: 'hero' | 'lead' | 'principal' | 'compacta' | 'minima'
}

export default function ArticleCard({ article, variant = 'principal' }: ArticleCardProps) {
  const href = article.type === 'NEWS' ? `/noticias/${article.slug}` : `/articulos/${article.slug}`
  const firstTag = article.tags?.[0]?.tag
  const dateStr = article.publishedAt || article.createdAt
  const plainContent = (article.content ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const isRecent = article.publishedAt
    ? Date.now() - new Date(article.publishedAt).getTime() < 2 * 60 * 60 * 1000
    : false

  if (variant === 'compacta') {
    return (
      <Link href={href} className="flex gap-4 group card-hover">
        {article.featuredImage && (
          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden img-hover">
            <Image
              src={cldUrl(article.featuredImage, { w: 160, h: 160 })}
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

  // variant: 'lead' — card jerárquica, imagen flexible, excerpt visible
  if (variant === 'lead') {
    return (
      <Link
        href={href}
        className="flex flex-col h-full group card-hover rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        {article.featuredImage && (
          <div className="relative flex-1 min-h-[220px] img-hover overflow-hidden">
            <Image
              src={cldUrl(article.featuredImage, { w: 1280, h: 720 })}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 853px"
            />
            {/* Overlay con contenido al hover */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center px-36 py-5 text-center">
              <p className="text-white/92 text-white md:text-lg leading-relaxed line-clamp-4 md:line-clamp-6 font-article italic">
                {plainContent}+'...'
              </p>
              <span className="text-[var(--brand-gold)] text-xs font-semibold mt-4 tracking-wide">Leer nota completa →</span>
            </div>
          </div>
        )}
        <div className="p-5 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            {firstTag && <TagBadge tag={firstTag} asLink={false} />}
            {isRecent && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-breaking)]" />
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-[var(--color-text-primary)] text-xl md:text-2xl mt-2 mb-2 leading-snug line-clamp-3 group-hover:text-[var(--brand-navy)] transition-colors">
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

  // variant: 'principal' (default)
  return (
    <Link
      href={href}
      className="block group card-hover rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {article.featuredImage && (
        <div className="relative aspect-video overflow-hidden img-hover">
          <Image
            src={cldUrl(article.featuredImage, { w: 600, h: 338 })}
            alt={article.title}
            width={600}
            height={338}
            className="w-full h-full object-cover"
          />
          {/* Overlay con contenido al hover */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center px-5 py-4 text-center">
            <p className="text-white/92 text-sm md:text-white leading-relaxed line-clamp-3 font-article italic">
              {plainContent}+'...'
            </p>
            <span className="text-[var(--brand-gold)] text-xs font-semibold mt-3 tracking-wide">Leer nota completa →</span>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {firstTag && <TagBadge tag={firstTag} asLink={false} />}
          {isRecent && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-breaking)]" />
            </span>
          )}
        </div>
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
