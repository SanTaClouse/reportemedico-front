'use client'

import { useState, type ReactNode } from 'react'
import { List, Map } from 'lucide-react'

/**
 * Resultados (05 §5): mobile = toggle Lista ⇄ Mapa; desktop = split 60/40.
 * La lista llega como RSC ya renderizada (SSR); solo el toggle es cliente.
 */
export default function ResultsToggle({ list, map }: { list: ReactNode; map: ReactNode }) {
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div>
      {/* Toggle solo en mobile */}
      <div className="lg:hidden flex gap-1 mb-4 bg-[var(--color-surface-2)] rounded-xl p-1 w-fit">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            view === 'list'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)]'
          }`}
        >
          <List size={14} /> Lista
        </button>
        <button
          onClick={() => setView('map')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            view === 'map'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)]'
          }`}
        >
          <Map size={14} /> Mapa
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-5 lg:gap-5">
        <div className={`lg:col-span-3 ${view === 'map' ? 'hidden lg:block' : ''}`}>{list}</div>
        <div className={`lg:col-span-2 ${view === 'list' ? 'hidden lg:block' : ''}`}>
          <div className="lg:sticky lg:top-24">{map}</div>
        </div>
      </div>
    </div>
  )
}
