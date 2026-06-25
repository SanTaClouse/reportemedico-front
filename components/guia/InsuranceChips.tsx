'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  insurances: { slug: string; name: string }[]
  /** Cuántos mostrar antes del "ver todos" */
  initial?: number
}

const chipClass =
  'shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors'

/**
 * Chips de seguros (ARS) clickeables. Colapsado ocupa UNA sola línea en mobile:
 * muestra unos pocos (si los nombres son largos, scrollean en horizontal en vez
 * de partirse) y el resto detrás de "ver todos". Expandido sí hace wrap.
 */
export default function InsuranceChips({ insurances, initial = 3 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const hidden = insurances.length - initial

  // Expandido (o cuando no sobra ninguno): se muestran todos, con wrap.
  if (expanded || hidden <= 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {insurances.map((i) => (
          <Link key={i.slug} href={`/guia-medica?seguro=${i.slug}`} className={chipClass}>
            {i.name}
          </Link>
        ))}
        {expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ver menos
          </button>
        )}
      </div>
    )
  }

  // Colapsado: una sola línea. Los chips scrollean; "ver todos" queda fijo al lado.
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {insurances.slice(0, initial).map((i) => (
          <Link key={i.slug} href={`/guia-medica?seguro=${i.slug}`} className={chipClass}>
            {i.name}
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors whitespace-nowrap"
      >
        +{hidden} · ver todos
      </button>
    </div>
  )
}
