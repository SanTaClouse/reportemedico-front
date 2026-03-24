'use client'

import { useState, useEffect } from 'react'
import { ActiveAd, AdSlotPublicResponse } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface UseAdSlotResult {
  displayMode: 'SINGLE' | 'STRIP'
  ads: ActiveAd[]
  loading: boolean
}

/**
 * Obtiene el slot público con su modo y anuncios.
 * SINGLE → un anuncio (elegido al azar en el backend).
 * STRIP  → todos los anuncios activos en orden.
 */
export function useAdSlot(slotName: string): UseAdSlotResult {
  const [displayMode, setDisplayMode] = useState<'SINGLE' | 'STRIP'>('SINGLE')
  const [ads, setAds] = useState<ActiveAd[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slotName) { setLoading(false); return }

    let cancelled = false

    async function fetchSlot() {
      try {
        const res = await fetch(
          `${API_URL}/ads/slot?name=${encodeURIComponent(slotName)}`,
          { cache: 'no-store' },
        )
        if (!cancelled && res.ok) {
          const data: AdSlotPublicResponse = await res.json()
          setDisplayMode(data.displayMode ?? 'SINGLE')
          setAds(Array.isArray(data.ads) ? data.ads : [])
        }
      } catch {
        if (!cancelled) setAds([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSlot()
    return () => { cancelled = true }
  }, [slotName])

  return { displayMode, ads, loading }
}
