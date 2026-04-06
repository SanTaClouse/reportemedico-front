'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useAdSlot } from '@/hooks/useAdSlot'
import SponsorsStrip from './SponsorsStrip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AdSlotRendererProps {
  position: string
  className?: string
}

function trackClick(adId: string) {
  fetch(`${API_URL}/ads/${adId}/click`, { method: 'PATCH', keepalive: true }).catch(() => { })
}

/**
 * Renderiza el slot correcto según displayMode:
 * - SINGLE → banner leaderboard (1200 × 90 px)
 * - STRIP  → marquee de logos de sponsors (300 × 150 px, PNG transparente)
 *
 * Reemplaza <AdBanner> en page.tsx.
 */
export default function AdSlotRenderer({ position, className = '' }: AdSlotRendererProps) {
  const { displayMode, ads, loading } = useAdSlot(position)

  const ad = ads[0] ?? null

  // Impresión para modo SINGLE
  useEffect(() => {
    if (displayMode !== 'SINGLE' || !ad) return
    fetch(`${API_URL}/ads/${ad.id}/impression`, { method: 'PATCH', keepalive: true }).catch(() => { })
  }, [ad?.id, displayMode])

  // Placeholder mientras carga (reserva espacio, evita layout shift)
  if (loading) {
    return <div className={`w-full aspect-[40/3] ${className}`} />
  }

  if (ads.length === 0) return null

  // ── STRIP ──────────────────────────────────────────
  if (displayMode === 'STRIP') {
    return <SponsorsStrip ads={ads} className={className} />
  }

  // ── SINGLE (banner leaderboard) ─────────────────
  // Sin borde ni fondo: el contenedor usa la misma proporción que la imagen
  // recomendada (40:3) para que la card calce exacta y no queden franjas blancas.
  return (
    <div
      className={`w-full relative overflow-hidden ${className}`}
      aria-label="Publicidad"
    >
      <a
        href={ad!.link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => trackClick(ad!.id)}
        title={ad!.title}
        className="block w-full"
      >
        <div className="relative w-full aspect-[40/3]">
          <Image
            src={ad!.imageUrl}
            alt={ad!.title}
            fill
            sizes="(max-width: 768px) 100vw, 1280px"
            className="object-contain"
            priority={false}
          />
        </div>
      </a>
      {/* <span className="absolute top-1 right-2 text-[9px] text-[var(--color-text-muted)] select-none pointer-events-none">
        Publicidad
      </span> */}
    </div>
  )
}
