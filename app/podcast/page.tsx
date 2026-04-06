import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { getPodcastEpisodes } from '@/lib/api'
import SectionTitle from '@/components/ui/SectionTitle'
import PodcastSearch from './PodcastSearch'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Podcast',
  description: 'Todos los episodios del video podcast de Reporte Médico — salud y medicina en República Dominicana.',
  alternates: { canonical: '/podcast' },
  openGraph: {
    title: 'Podcast | Reporte Médico',
    description: 'Todos los episodios del video podcast de Reporte Médico — salud y medicina en República Dominicana.',
    url: '/podcast',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podcast | Reporte Médico',
    description: 'Todos los episodios del video podcast de Reporte Médico — salud y medicina en República Dominicana.',
  },
}

const PER_PAGE = 12

interface Props {
  searchParams: { page?: string; q?: string }
}

export default async function PodcastPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const q = searchParams.q?.trim() || ''
  const { data: episodes, meta } = await getPodcastEpisodes(page, PER_PAGE, q || undefined)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', String(p))
    return `/podcast?${params.toString()}`
  }

  return (
    <main className="max-w-site mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <SectionTitle className="mb-0">Podcast</SectionTitle>
        <Suspense>
          <PodcastSearch />
        </Suspense>
      </div>

      {/* Resultados */}
      {q && (
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {meta.total === 0
            ? `Sin resultados para "${q}"`
            : `${meta.total} resultado${meta.total !== 1 ? 's' : ''} para "${q}"`}
        </p>
      )}

      {episodes.length === 0 ? (
        <div className="text-center py-24 text-[var(--color-text-muted)]">
          <p className="text-lg font-medium">
            {q ? `No se encontraron episodios para "${q}".` : 'No hay episodios publicados aún.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes.map((ep) => {
            const thumb =
              ep.thumbnailUrl ||
              `https://img.youtube.com/vi/${ep.youtubeId}/mqdefault.jpg`
            return (
              <a
                key={ep.id}
                href={`https://youtu.be/${ep.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video bg-[var(--color-surface-2)]">
                  <Image
                    src={thumb}
                    alt={ep.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--brand-gold)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <Play size={20} className="text-[var(--brand-navy)] ml-0.5" fill="currentColor" strokeWidth={0} />
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-1">
                  <p className="font-semibold text-sm text-[var(--color-text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                    {ep.title}
                  </p>
                  {ep.description && (
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{ep.description}</p>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          {page > 1 ? (
            <Link href={buildUrl(page - 1)} className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-2)] transition-colors">
              <ChevronLeft size={16} /> Anterior
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg opacity-40 cursor-not-allowed">
              <ChevronLeft size={16} /> Anterior
            </span>
          )}

          <span className="text-sm text-[var(--color-text-muted)]">{page} / {meta.totalPages}</span>

          {page < meta.totalPages ? (
            <Link href={buildUrl(page + 1)} className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-2)] transition-colors">
              Siguiente <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg opacity-40 cursor-not-allowed">
              Siguiente <ChevronRight size={16} />
            </span>
          )}
        </div>
      )}
    </main>
  )
}
