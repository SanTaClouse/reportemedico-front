'use client'

import { RefreshCw } from 'lucide-react'

interface Props {
  reset: () => void
  message?: string
}

export function SectionError({ reset, message }: Props) {
  return (
    <div className="py-16 text-center">
      <p className="text-[var(--text-muted)] mb-4 font-body">
        {message ?? 'No se pudo cargar esta sección.'}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 text-sm underline underline-offset-2"
        style={{ color: 'var(--color-primary)' }}
      >
        <RefreshCw size={14} strokeWidth={1.5} />
        Reintentar
      </button>
    </div>
  )
}
