'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  insurances: { slug: string; name: string }[]
  /** Cuántos mostrar antes del "ver todos" */
  initial?: number
}

/**
 * Chips de seguros (ARS) clickeables. En mobile la lista puede ser larga y se
 * come la pantalla, así que mostramos unos pocos y el resto detrás de "ver todos".
 */
export default function InsuranceChips({ insurances, initial = 4 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? insurances : insurances.slice(0, initial)
  const hidden = insurances.length - initial

  const chipClass =
    'px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors'

  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((i) => (
        <Link key={i.slug} href={`/guia-medica?seguro=${i.slug}`} className={chipClass}>
          {i.name}
        </Link>
      ))}
      {!expanded && hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors"
        >
          +{hidden} · ver todos
        </button>
      )}
      {expanded && insurances.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          ver menos
        </button>
      )}
    </div>
  )
}
