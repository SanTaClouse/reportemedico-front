'use client'

import { useEffect, useState } from 'react'

interface Props {
  startsAt: string // inicio del evento (ISO)
  endsAt: string // fin del evento (ISO): después muestra el cierre
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Cuenta regresiva grande de la página del evento. Arranca vacía y se llena al
 * montar: calcularla en el server daría un desfase de hidratación cada segundo.
 */
export default function Countdown({ startsAt, endsAt }: Props) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()

  if (now !== null && now >= end) {
    return (
      <p className="text-center font-display text-2xl sm:text-3xl font-bold text-white">
        Gracias por acompañarnos en el Foro 5.0
      </p>
    )
  }
  if (now !== null && now >= start) {
    return (
      <p className="text-center font-display text-3xl sm:text-4xl font-bold text-white">
        ¡Estamos en vivo! <span className="text-brand-gold">Hoy es el Foro 5.0</span>
      </p>
    )
  }

  const t = now === null ? null : parts(start - now)
  const units = [
    { label: 'días', value: t ? String(t.days) : '--' },
    { label: 'horas', value: t ? pad(t.hours) : '--' },
    { label: 'minutos', value: t ? pad(t.minutes) : '--' },
    { label: 'segundos', value: t ? pad(t.seconds) : '--' },
  ]

  return (
    <div role="timer" aria-label="Tiempo que falta para el evento">
      <p className="text-center text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-brand-cyan mb-3">
        Faltan
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur px-1 py-3 sm:py-5 text-center"
          >
            {/* key por valor: al cambiar, el número se remonta y vuelve a entrar deslizando */}
            <span
              key={u.value}
              className="ev-digit block font-display font-bold text-4xl sm:text-6xl text-white tabular-nums leading-none"
            >
              {u.value}
            </span>
            <span className="block mt-2 text-[10px] sm:text-xs uppercase tracking-widest text-white/60">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
