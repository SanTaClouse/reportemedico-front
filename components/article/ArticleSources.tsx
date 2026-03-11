import type { ArticleSource } from '@/lib/api'
import { ExternalLink } from 'lucide-react'

interface ArticleSourcesProps {
  sources: ArticleSource[]
}

export default function ArticleSources({ sources }: ArticleSourcesProps) {
  return (
    <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
      <h3 className="font-body font-semibold text-sm uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
        Fuentes
      </h3>
      <ol className="space-y-1.5 list-decimal list-inside">
        {sources.map((source) => (
          <li key={source.id} className="text-sm text-[var(--color-text-secondary)]">
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-primary)] inline-flex items-center gap-1 transition-colors"
              >
                {source.title}
                <ExternalLink size={12} className="shrink-0" />
              </a>
            ) : (
              source.title
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
