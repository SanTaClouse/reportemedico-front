'use client'

import { useEffect } from 'react'
import { trackBioView } from '@/lib/api-bio'

/**
 * Registra una vista de /bio al montar (fire-and-forget). Envía el referrer del
 * documento (de dónde llegó el visitante, ej. Instagram) — sin datos personales.
 * No renderiza nada.
 */
export default function BioView() {
  useEffect(() => {
    trackBioView(typeof document !== 'undefined' ? document.referrer || undefined : undefined)
  }, [])
  return null
}
