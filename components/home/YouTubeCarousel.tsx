'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'
import type { YouTubeVideo } from '@/lib/youtube'

interface YouTubeCarouselProps {
  videos: YouTubeVideo[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'hoy'
  if (days < 7) return `hace ${days}d`
  if (days < 30) return `hace ${Math.floor(days / 7)}sem`
  if (days < 365) return `hace ${Math.floor(days / 30)}m`
  return `hace ${Math.floor(days / 365)}a`
}

export default function YouTubeCarousel({ videos }: YouTubeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (videos.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 700 : -700, behavior: 'smooth' })
  }

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Más videos del canal
        </p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)] transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)] transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <a
            href="https://www.youtube.com/@reportemedico1504"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            Ver canal ↗
          </a>
        </div>
      </div>

      {/* Carrusel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-shrink-0 w-52 flex flex-col"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--brand-navy)] mb-2 shadow-sm">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="208px"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors" />
              {/* Play */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-[var(--brand-gold)] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Play size={15} className="text-[var(--brand-navy)] ml-0.5" fill="currentColor" strokeWidth={0} />
                </div>
              </div>
              {/* Fecha */}
              <span className="absolute bottom-1.5 right-2 text-[10px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                {timeAgo(video.publishedAt)}
              </span>
            </div>

            {/* Título */}
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
              {video.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
