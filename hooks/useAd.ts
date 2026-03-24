'use client'

import { useState, useEffect } from 'react'
import { ActiveAd } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface UseAdResult {
  ad: ActiveAd | null
  loading: boolean
}

/**
 * Obtiene el anuncio activo para un slot (el backend elige aleatoriamente).
 * Devuelve null si no hay anuncios o si ocurre un error.
 */
export function useAd(slotName: string): UseAdResult {
  const [ad, setAd] = useState<ActiveAd | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slotName) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchAd() {
      try {
        const res = await fetch(
          `${API_URL}/ads/slot?name=${encodeURIComponent(slotName)}`,
          { cache: 'no-store' },
        )
        if (!cancelled && res.ok) {
          const data: ActiveAd[] = await res.json()
          // El backend ahora devuelve { displayMode, ads }
        const ads = Array.isArray(data) ? data : (data as any)?.ads ?? []
        if (ads.length > 0) {
            setAd(ads[0] && typeof ads[0].imageUrl === 'string' ? ads[0] : null)
          } else {
            setAd(null)
          }
        }
      } catch {
        if (!cancelled) setAd(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAd()
    return () => { cancelled = true }
  }, [slotName])

  return { ad, loading }
}
