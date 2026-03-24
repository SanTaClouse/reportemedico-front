'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, ArrowLeft } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--color-surface-2)' }}
        >
          <RefreshCw size={28} strokeWidth={1.5} style={{ color: 'var(--color-primary)' }} />
        </div>

        <h1 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Algo salió mal
        </h1>

        <p className="font-body mb-2" style={{ color: 'var(--text-secondary)' }}>
          Ocurrió un error inesperado al cargar esta página.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <p
            className="text-xs font-mono mb-4 p-3 rounded-lg text-left break-all"
            style={{ background: 'var(--color-surface-2)', color: 'var(--text-muted)' }}
          >
            {error.message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <RefreshCw size={16} strokeWidth={1.5} />
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--color-surface-2)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
