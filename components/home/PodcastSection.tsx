'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { PodcastEpisode } from '@/lib/api'
import type { YouTubeVideo } from '@/lib/youtube'
import SectionTitle from '@/components/ui/SectionTitle'
import LazyYouTube from './LazyYouTube'
import YouTubeCarousel from './YouTubeCarousel'

interface PodcastSectionProps {
  episodes: PodcastEpisode[]
  channelVideos?: YouTubeVideo[]
}

export default function PodcastSection({ episodes, channelVideos = [] }: PodcastSectionProps) {
  const [featuredId, setFeaturedId] = useState(episodes[0]?.id ?? null)

  const featured = episodes.find((ep) => ep.id === featuredId) ?? episodes[0]
  // Up to 3 thumbnails (the rest, excluding featured)
  const thumbnails = episodes.filter((ep) => ep.id !== featured?.id).slice(0, 3)
  const hasMore = episodes.length > 4

  return (
    <section className="bg-[var(--color-surface-2)] py-14">
      <div className="max-w-site mx-auto px-4 md:px-6">
        <div className="flex items-center mb-6">
          <SectionTitle className="mb-0 flex-1 mr-4">Nuestro Podcast</SectionTitle>
          <Link
            href="/podcast"
            className="shrink-0 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {featured && (
          <>
            {/* Featured player */}
            <div className="relative aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-md mb-3">
              <LazyYouTube
                key={featured.youtubeId}
                youtubeId={featured.youtubeId}
                title={featured.title}
                thumbnailUrl={featured.thumbnailUrl}
              />
            </div>
            <p className="text-center text-sm text-[var(--color-text-secondary)] mb-5">
              {featured.title}
            </p>

            {/* Thumbnail row: up to 3 episodes, 2 on mobile / 3 on sm+ */}
            {thumbnails.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-4">
                {thumbnails.map((ep, i) => {
                  const thumb =
                    ep.thumbnailUrl ||
                    `https://img.youtube.com/vi/${ep.youtubeId}/mqdefault.jpg`
                  return (
                    <button
                      key={ep.id}
                      onClick={() => setFeaturedId(ep.id)}
                      className={`group relative rounded-lg overflow-hidden aspect-video shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${i === 2 ? 'hidden sm:block' : ''}`}
                      title={ep.title}
                    >
                      <Image
                        src={thumb}
                        alt={ep.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors" />
                      {/* Play dot */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-4 h-4 text-[var(--brand-navy)] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {/* Title on hover */}
                      <p className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-[10px] font-medium text-white leading-tight line-clamp-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        {ep.title}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Separator + notice */}
            <div className="max-w-3xl mx-auto mt-2 mb-6">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {hasMore
                    ? <>Esta sección muestra los <strong className="text-[var(--color-text-secondary)]">4 episodios destacados</strong>. Los demás están disponibles en orden en la sección exclusiva.</>
                    : <>Estos son todos los episodios disponibles actualmente.</>
                  }
                </p>
                <Link
                  href="/podcast"
                  className="shrink-0 text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap"
                >
                  Ver todos →
                </Link>
              </div>
            </div>
          </>
        )}

        <YouTubeCarousel videos={channelVideos} />
      </div>
    </section>
  )
}
