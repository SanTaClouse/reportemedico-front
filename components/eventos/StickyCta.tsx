'use client'

import { useEffect, useState } from 'react'

/**
 * Barra fija de inscripción en el celular: entra deslizando cuando el botón de
 * la portada sale de pantalla, para no tapar el contenido ni competir con él.
 * Observa el elemento con id="ev-cta-sentinel" que la página deja tras el CTA.
 */
export default function StickyCta({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById('ev-cta-sentinel')
    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver((entries) => setVisible(!entries[0].isIntersecting), { threshold: 0 })
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-navy/95 px-4 py-3 backdrop-blur transition-transform duration-500 ease-out sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {children}
    </div>
  )
}
