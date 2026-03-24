import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SearchResults } from '@/components/search/SearchResults'

interface Props {
  searchParams: { q?: string; page?: string }
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q
  return {
    title: q ? `"${q}" — Búsqueda | Reporte Médico` : 'Búsqueda | Reporte Médico',
    robots: { index: false },
  }
}

function SearchSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 rounded-lg"
          style={{ background: 'var(--color-surface-2)' }}
        >
          <div
            className="w-24 h-16 rounded flex-shrink-0"
            style={{ background: 'var(--color-border)' }}
          />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded" style={{ background: 'var(--color-border)' }} />
            <div className="h-4 w-full rounded" style={{ background: 'var(--color-border)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() ?? ''
  const page = Number(searchParams.page ?? 1)

  return (
    <main className="max-w-site mx-auto px-4 md:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">
        {query ? `Resultados para "${query}"` : 'Búsqueda'}
      </h1>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults query={query} page={page} />
      </Suspense>
    </main>
  )
}
