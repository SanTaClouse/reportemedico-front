import Link from 'next/link'
import type { Tag } from '@/lib/api'

interface TagBadgeProps {
  tag: Tag
  asLink?: boolean
}

export default function TagBadge({ tag, asLink = true }: TagBadgeProps) {
  const className =
    'inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-body font-semibold uppercase tracking-widest bg-[var(--color-surface-3)] text-[var(--brand-navy)] border border-[var(--color-border)] transition-colors hover:bg-[var(--brand-navy)] hover:text-[var(--brand-gold)] hover:border-[var(--brand-navy)]'

  if (asLink) {
    return (
      <Link href={`/tag/${tag.slug}`} className={className}>
        {tag.name}
      </Link>
    )
  }

  return <span className={className}>{tag.name}</span>
}
