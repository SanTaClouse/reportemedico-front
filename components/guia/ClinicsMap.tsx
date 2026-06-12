'use client'

import dynamic from 'next/dynamic'

export interface MapPin {
  latitude: number
  longitude: number
  label: string
  sublabel?: string
}

// react-leaflet no se hidrata en servidor (03 §9): carga lazy, nunca bloquea LCP
const InnerMap = dynamic(() => import('./ClinicsMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-xl bg-[var(--color-surface-2)] animate-pulse flex items-center justify-center text-sm text-[var(--color-text-muted)]">
      Cargando mapa…
    </div>
  ),
})

export default function ClinicsMap({ pins }: { pins: MapPin[] }) {
  if (!pins.length) return null
  return <InnerMap pins={pins} />
}
