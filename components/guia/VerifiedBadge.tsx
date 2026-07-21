'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BadgeCheck } from 'lucide-react'

interface Props {
  size?: number
  /** Sobre fondo oscuro (hero pago): pastilla blanca detrás del ícono */
  onPhoto?: boolean
  className?: string
}

const EXPLANATION =
  'Médico verificado: Reporte Médico comprobó que su número de exequátur (matrícula) es válido y está vigente.'

const TIP_W = 232
const GAP = 8

/**
 * Sello ✓ de exequátur, al lado del nombre (estilo Instagram).
 *
 * El tooltip se renderiza en un PORTAL con posición fixed, no como absolute
 * dentro del badge: las cards tienen `overflow-hidden` (lo necesitan para la
 * foto redondeada) y recortaban el globo a la mitad. Además se clampea al
 * viewport y se da vuelta hacia arriba si no entra abajo.
 */
export default function VerifiedBadge({ size = 14, onPhoto = false, className = '' }: Props) {
  const [coords, setCoords] = useState<{ top: number; left: number; flip: boolean } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const place = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const flip = r.bottom + 96 > window.innerHeight
    const left = Math.max(
      GAP,
      Math.min(r.left + r.width / 2 - TIP_W / 2, window.innerWidth - TIP_W - GAP),
    )
    setCoords({ top: flip ? r.top - GAP : r.bottom + GAP, left, flip })
  }, [])

  const close = useCallback(() => setCoords(null), [])

  // Las coordenadas fixed quedan viejas si se scrollea o se rota el device
  useEffect(() => {
    if (!coords) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onEsc)
    }
  }, [coords, close])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Médico verificado — ver qué significa"
        aria-expanded={coords !== null}
        onClick={(e) => {
          // Vive dentro de <Link> en varias cards: no navegar al abrir el globo
          e.preventDefault()
          e.stopPropagation()
          coords ? close() : place()
        }}
        onMouseEnter={place}
        onMouseLeave={close}
        onFocus={place}
        onBlur={close}
        className={`inline-flex shrink-0 items-center justify-center rounded-full align-middle transition-transform hover:scale-110 ${
          onPhoto ? 'bg-white/95 p-1 shadow-sm' : ''
        } ${className}`}
      >
        <BadgeCheck
          size={size}
          strokeWidth={2}
          className="text-[var(--color-primary,#001450)]"
          aria-hidden="true"
        />
      </button>

      {coords !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: TIP_W,
              transform: coords.flip ? 'translateY(-100%)' : undefined,
            }}
            className="z-[100] rounded-lg bg-[var(--color-primary,#001450)] px-3 py-2 text-[11px] font-normal leading-snug text-white shadow-xl pointer-events-none"
          >
            {EXPLANATION}
          </span>,
          document.body,
        )}
    </>
  )
}
