'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { ActiveAd } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface SponsorsStripProps {
  ads: ActiveAd[]
  className?: string
}

function trackClick(adId: string) {
  fetch(`${API_URL}/ads/${adId}/click`, { method: 'PATCH', keepalive: true }).catch(() => {})
}

/**
 * Marquee infinito de logos de sponsors.
 * - Escala de grises por defecto → color completo al hover
 * - Se pausa al hacer hover sobre cualquier punto del strip
 * - Registra impresión una vez al montar (1 por anuncio)
 * - Dimensiones recomendadas para las imágenes: 300 × 150 px, PNG transparente
 */
export default function SponsorsStrip({ ads, className = '' }: SponsorsStripProps) {
  // Impresiones: una vez al montar, por cada anuncio activo
  useEffect(() => {
    ads.forEach((ad) => {
      fetch(`${API_URL}/ads/${ad.id}/impression`, { method: 'PATCH', keepalive: true }).catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // solo al montar

  if (ads.length === 0) return null

  // Duplicar items para el loop sin corte
  const items = [...ads, ...ads]

  return (
    <div
      className={`group w-full relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-white dark:bg-[var(--color-surface)] ${className}`}
      style={{ height: 'clamp(70px, 10vw, 90px)' }}
      aria-label="Patrocinadores"
    >
      {/* Strip con marquee — se pausa al hover sobre el contenedor */}
      <div className="flex h-full items-center animate-marquee group-hover:[animation-play-state:paused]">
        {items.map((ad, i) => (
          <a
            key={`${ad.id}-${i}`}
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackClick(ad.id)}
            title={ad.title}
            className="flex-shrink-0 flex items-center justify-center h-full px-8"
          >
            {/* Logo: gris por defecto → color al hover, con transición suave */}
            <div
              className="relative grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-out"
              style={{ width: '140px', height: '52px' }}
            >
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                sizes="140px"
                className="object-contain"
                priority={false}
              />
            </div>
          </a>
        ))}
      </div>

      {/* Degradados en los bordes para suavizar la entrada/salida */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white dark:from-[var(--color-surface)] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-[var(--color-surface)] to-transparent pointer-events-none z-10" />

      <span className="absolute top-1 right-2 text-[9px] text-[var(--color-text-muted)] select-none pointer-events-none z-20">
        Publicidad
      </span>
    </div>
  )
}
