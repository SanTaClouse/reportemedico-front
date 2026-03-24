'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface LazyYouTubeProps {
  youtubeId: string
  title: string
  thumbnailUrl?: string
}

export default function LazyYouTube({ youtubeId, title, thumbnailUrl }: LazyYouTubeProps) {
  const [playing, setPlaying] = useState(false)
  const thumb = thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    )
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full h-full group cursor-pointer"
      aria-label={`Reproducir: ${title}`}
    >
      <Image
        src={thumb}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 768px"
      />
      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors flex items-center justify-center">
        <div className="w-16 h-16 bg-[var(--brand-gold)] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
          <Play size={28} className="text-[var(--brand-navy)] ml-1" fill="currentColor" strokeWidth={0} />
        </div>
      </div>
    </button>
  )
}
