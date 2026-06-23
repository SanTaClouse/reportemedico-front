'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { optOutDoctorDigest } from '@/lib/api'

type State = { status: 'loading' | 'ok' | 'error'; message?: string }

export default function BajaMedicoClient({ d, t }: { d: string; t: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // evita doble ejecución en StrictMode
    ran.current = true
    if (!d || !t) {
      setState({ status: 'error', message: 'El enlace está incompleto.' })
      return
    }
    optOutDoctorDigest(d, t)
      .then(() => setState({ status: 'ok' }))
      .catch((err) => setState({ status: 'error', message: (err as Error).message }))
  }, [d, t])

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
        {state.status === 'loading' && (
          <>
            <Loader2 size={32} className="mx-auto text-[var(--color-text-muted)] animate-spin mb-4" />
            <p className="text-sm text-[var(--color-text-muted)]">Procesando…</p>
          </>
        )}

        {state.status === 'ok' && (
          <>
            <CheckCircle2 size={36} className="mx-auto text-green-600 mb-4" strokeWidth={1.6} />
            <h1 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-2">
              Listo, no recibirás más novedades
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Dejaste de recibir el digest de noticias por especialidad. Tu perfil en la Guía Médica sigue activo y
              los avisos importantes de tu cuenta no se ven afectados. Puedes reactivarlo desde tu cuenta cuando
              quieras.
            </p>
          </>
        )}

        {state.status === 'error' && (
          <>
            <AlertTriangle size={36} className="mx-auto text-amber-500 mb-4" strokeWidth={1.6} />
            <h1 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-2">
              No pudimos procesar tu solicitud
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.message || 'El enlace no es válido o ya expiró.'} Si el problema sigue, escríbenos y lo
              resolvemos a mano.
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
