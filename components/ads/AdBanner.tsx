'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useAd } from '@/hooks/useAd'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AdBannerProps {
  position: string
  className?: string
}

function trackClick(adId: string) {
  fetch(`${API_URL}/ads/${adId}/click`, { method: 'PATCH', keepalive: true }).catch(() => {})
}

export default function AdBanner({ position, className = '' }: AdBannerProps) {
  const { ad, loading } = useAd(position)

  useEffect(() => {
    if (!ad) return
    fetch(`${API_URL}/ads/${ad.id}/impression`, { method: 'PATCH', keepalive: true }).catch(() => {})
  }, [ad?.id])

  if (loading) return <div className={`w-full aspect-[40/3] ${className}`} />
  if (!ad) return null

  return (
    <div
      className={`w-full relative overflow-hidden ${className}`}
      aria-label="Publicidad"
    >
      <a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => trackClick(ad.id)}
        title={ad.title}
        className="block w-full"
      >
        {/* Contenedor con la misma proporción que la imagen recomendada (40:3),
            sin borde ni fondo: la card calza exacta y no hay franjas blancas. */}
        <div className="relative w-full aspect-[40/3]">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
            className="object-contain"
            priority={false}
          />
        </div>
      </a>

      <span className="absolute top-1 right-2 text-[9px] text-[var(--color-text-muted)] select-none pointer-events-none">
        Publicidad
      </span>
    </div>
  )
}
