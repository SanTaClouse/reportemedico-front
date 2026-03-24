'use client'
import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'sec-destacadas', label: 'Destacadas' },
  { id: 'sec-actualidad', label: 'Actualidad' },
  { id: 'sec-articulos', label: 'Artículos Médicos' },
  { id: 'sec-podcast', label: 'Podcast' },
  { id: 'sec-ediciones', label: 'Ediciones' },
  { id: 'sec-nosotros', label: 'Sobre Nosotros' },
]

const NAVBAR_OFFSET = 80

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET
  window.scrollTo({ top: y, behavior: 'smooth' })
}

export default function SectionDots() {
  const [active, setActive] = useState(SECTIONS[0].id)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200)
    window.addEventListener('scroll', onScroll, { passive: true })

    // Single observer for all sections — less overhead, no flickering
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <nav
      className={`fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Navegación de secciones"
    >
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollToSection(id)}
          className="group relative flex items-center justify-end gap-2.5"
          aria-label={label}
          aria-current={active === id ? 'true' : undefined}
        >
          {/* Tooltip */}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-body text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 rounded shadow-sm whitespace-nowrap">
            {label}
          </span>
          {/* Dot */}
          <div
            className={`rounded-full transition-all duration-300 ease-out relative z-10 ${
              active === id
                ? 'w-3 h-3 bg-[var(--brand-gold)] shadow-md scale-110'
                : 'w-2 h-2 bg-[var(--color-border)] group-hover:bg-[var(--color-text-muted)]'
            }`}
          />
        </button>
      ))}
    </nav>
  )
}
