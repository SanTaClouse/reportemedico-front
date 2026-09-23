'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cuenta de 0 al número final cuando el bloque entra en pantalla.
 *
 * Renderiza el valor final en el server (importa para SEO y para quien no
 * tenga JS) y solo arranca desde 0 si al montar el número todavía está debajo
 * del pliegue: así nadie ve un parpadeo de 50 a 0.
 */
export default function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(to)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (quieto || typeof IntersectionObserver === 'undefined') return

    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.9) return // ya se está viendo: sin animación

    setValue(0)
    let frame = 0
    const animar = () => {
      const inicio = performance.now()
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / duration)
        const suave = 1 - Math.pow(1 - t, 3) // ease-out cúbico
        setValue(Math.round(to * suave))
        if (t < 1) frame = requestAnimationFrame(paso)
      }
      frame = requestAnimationFrame(paso)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          animar()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [to, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  )
}
