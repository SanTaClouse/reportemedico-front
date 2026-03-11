'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/articulos', label: 'Artículos Médicos' },
  { href: '/guia-medica', label: 'Guía Médica' },
  { href: '/ediciones', label: 'Ediciones' },
  { href: '/consejo-medico', label: 'Consejo Médico' },
  { href: '/sobre-nosotros', label: 'Sobre Nosotros' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar — navy */}
      <div className="bg-[var(--brand-navy)] text-white">
        <div className="max-w-site mx-auto px-4 md:px-6 h-9 flex items-center justify-between">
          <span className="text-xs text-white/70 font-body">República Dominicana</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--brand-gold)] font-body font-medium hidden sm:block">
              25K suscriptores
            </span>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.youtube.com/@reportemedico1504"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-white/60 hover:text-[var(--brand-gold)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/reportemedicord"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/60 hover:text-[var(--brand-gold)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24c3.3 0 3.7 0 4.9-.1 4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div
        className="bg-[var(--color-surface)]/95 backdrop-blur border-b-2 border-[var(--brand-gold)]"
      >
        <nav className="max-w-site mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            {/* Modo claro: navy/gold */}
            <Image
              src="/media/logo-completo-claro.png"
              alt="Reporte Médico"
              width={180}
              height={44}
              priority
              className="object-contain h-11 w-auto dark:hidden"
            />
            {/* Modo oscuro: blanco/gold */}
            <Image
              src="/media/logo-completo-oscuro.png"
              alt="Reporte Médico"
              width={180}
              height={44}
              priority
              className="object-contain h-11 w-auto hidden dark:block"
            />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-sm font-body font-medium transition-colors hover:text-[var(--brand-navy)] ${
                    pathname === href
                      ? 'text-[var(--brand-navy)] border-b-2 border-[var(--brand-gold)] pb-0.5'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--brand-navy)] hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-[var(--color-text-primary)]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu — fondo navy */}
      {menuOpen && (
        <div className="md:hidden bg-[var(--brand-navy)]">
          <ul className="flex flex-col py-2">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'text-[var(--brand-gold)] bg-white/10'
                      : 'text-white/80 hover:text-[var(--brand-gold)] hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
