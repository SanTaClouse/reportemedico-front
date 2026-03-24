'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt: string
  priority?: boolean
  className?: string
  /** Intensidad del efecto en px (default 60) */
  strength?: number
}

/**
 * Imagen con efecto parallax vertical al scroll.
 * La imagen es un 30% más grande que el contenedor para tener
 * margen de movimiento sin mostrar bordes vacíos.
 */
export default function ParallaxImage({ src, alt, priority, className = '', strength = 90 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img) return

    let ticking = false

    const update = () => {
      const rect = container.getBoundingClientRect()
      const vpH = window.innerHeight
      // progress: 0 = entrando desde abajo, 1 = saliendo por arriba
      const progress = (vpH - rect.top) / (vpH + rect.height)
      const translateY = (progress - 0.5) * strength * 2
      img.style.transform = `translateY(${translateY}px)`
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    update() // posición inicial
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [strength])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {/* El wrapper es 30% más alto que el contenedor — margen de movimiento */}
      <div
        ref={imgRef}
        className="absolute will-change-transform"
        style={{ inset: '-15% 0' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 1200px"
          className={`object-cover ${className}`}
        />
      </div>
    </div>
  )
}
