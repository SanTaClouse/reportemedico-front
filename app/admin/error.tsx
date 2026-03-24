'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, LayoutDashboard } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[AdminError]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="text-center max-w-sm">
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Error en el panel
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {process.env.NODE_ENV === 'development' ? error.message : 'Ocurrió un error inesperado.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            Reintentar
          </button>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--text-secondary)' }}
          >
            <LayoutDashboard size={14} strokeWidth={1.5} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
