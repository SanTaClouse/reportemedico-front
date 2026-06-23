'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { unsubscribeNewsletter } from '@/lib/api'

type State = { status: 'loading' | 'ok' | 'error'; email?: string; message?: string }

export default function BajaClient({ s, t }: { s: string; t: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // evita doble ejecución en StrictMode
    ran.current = true
    if (!s || !t) {
      setState({ status: 'error', message: 'El enlace de baja está incompleto.' })
      return
    }
    unsubscribeNewsletter(s, t)
      .then((res) => setState({ status: 'ok', email: res.email }))
      .catch((err) => setState({ status: 'error', message: (err as Error).message }))
  }, [s, t])

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
        {state.status === 'loading' && (
          <>
            <Loader2 size={32} className="mx-auto text-[var(--color-text-muted)] animate-spin mb-4" />
            <p className="text-sm text-[var(--color-text-muted)]">Procesando tu baja…</p>
          </>
        )}

        {state.status === 'ok' && (
          <>
            <CheckCircle2 size={36} className="mx-auto text-green-600 mb-4" strokeWidth={1.6} />
            <h1 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-2">
              Listo, te diste de baja
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.email && <><strong>{state.email}</strong> </>}
              ya no recibirá más el newsletter de Reporte Médico. Si fue un error, puedes volver a
              suscribirte cuando quieras.
            </p>
          </>
        )}

        {state.status === 'error' && (
          <>
            <AlertTriangle size={36} className="mx-auto text-amber-500 mb-4" strokeWidth={1.6} />
            <h1 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-2">
              No pudimos procesar la baja
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.message || 'El enlace no es válido o ya expiró.'} Si el problema sigue,
              escríbenos y te damos de baja a mano.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-block mt-6 text-sm font-semibold text-[var(--color-primary,#001450)] hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
