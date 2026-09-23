'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  /** Retraso en ms para escalonar varios bloques de una misma fila */
  delay?: number
  /** Porción del bloque que tiene que verse para disparar la entrada */
  amount?: number
}

/**
 * Entrada suave al entrar en pantalla (docs/v2/11). El estilo vive en
 * globals.css (.ev-reveal): acá solo se marca data-visible una vez.
 *
 * El contenido lo renderiza el server y se pasa como children, así que la
 * página sigue siendo RSC y esto no agrega peso más allá del observador.
 * Sin JS quedaría oculto, por eso la página incluye un <noscript> que lo
 * muestra; con prefers-reduced-motion el CSS lo deja visible y quieto.
 */
export default function Reveal({ children, className = '', delay = 0, amount = 0.15 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: amount, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [amount])

  return (
    <div
      ref={ref}
      data-visible={visible ? 'true' : undefined}
      className={`ev-reveal ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
