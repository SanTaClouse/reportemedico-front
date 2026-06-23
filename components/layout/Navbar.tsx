'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useSearch } from '@/lib/hooks/useSearch'
import { Menu, X, Sun, Moon, Search, Loader2, Check, UserCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useUser } from '@auth0/nextjs-auth0/client'
import { subscribeNewsletter, getTags, type Tag } from '@/lib/api'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/articulos', label: 'Artículos Médicos' },
  { href: '/guia-medica', label: 'Guía Médica' },
  { href: '/ediciones', label: 'Ediciones' },
  { href: '/consejo-medico', label: 'Consejo Médico' },
  { href: '/tag/eventos', label: 'Eventos' },
  { href: '/sobre-nosotros', label: 'Sobre Nosotros' },
]

function SearchBar() {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { results, loading, query, setQuery, clear } = useSearch(300)

  const close = () => { setOpen(false); clear() }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length >= 2) {
      router.push(`/buscar?q=${encodeURIComponent(query)}`)
      close()
    }
  }

  // Escape cierra el modal
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus al abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const showResults = query.length >= 2

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--brand-navy)] hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <Search size={18} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={close}
        >
          <div
            className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {loading
                  ? <div className="w-5 h-5 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin flex-shrink-0" />
                  : <Search size={18} strokeWidth={1.5} className="text-[var(--color-text-muted)] flex-shrink-0" />
                }
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar artículos, noticias, doctores..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-base"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Limpiar">
                    <X size={18} strokeWidth={1.5} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" />
                  </button>
                )}
              </div>
            </form>

            {/* Resultados live */}
            {showResults && (
              <div className="max-h-[420px] overflow-y-auto">
                {results.length > 0 ? (
                  <>
                    <ul>
                      {results.map((article) => {
                        const href = article.type === 'NEWS'
                          ? `/noticias/${article.slug}`
                          : `/articulos/${article.slug}`
                        return (
                          <li key={article.id}>
                            <a
                              href={href}
                              onClick={close}
                              className="flex gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
                            >
                              {article.featuredImage && (
                                <img
                                  src={article.featuredImage}
                                  alt=""
                                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1 mb-0.5">
                                  {article.title}
                                </p>
                                {article.headline ? (
                                  <p
                                    className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed [&_mark]:bg-[var(--brand-gold)]/30 [&_mark]:rounded"
                                    dangerouslySetInnerHTML={{ __html: article.headline }}
                                  />
                                ) : article.excerpt ? (
                                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                                    {article.excerpt}
                                  </p>
                                ) : null}
                              </div>
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--color-border)' }}>
                      <button
                        onClick={() => { router.push(`/buscar?q=${encodeURIComponent(query)}`); close() }}
                        className="text-xs font-medium hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        Ver todos los resultados para &ldquo;{query}&rdquo; →
                      </button>
                    </div>
                  </>
                ) : !loading ? (
                  <p className="px-4 py-6 text-sm text-center text-[var(--color-text-muted)]">
                    No se encontraron resultados para &ldquo;{query}&rdquo;
                  </p>
                ) : null}
              </div>
            )}

            {/* Hint inicial */}
            {!showResults && (
              <p className="px-4 py-4 text-xs text-[var(--color-text-muted)] text-center">
                Escribe para buscar · Enter para ver todos los resultados
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function SubscribeModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'interests' | 'done'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Temas de interés (opcional, paso 2)
  const [tags, setTags] = useState<Tag[]>([])
  const [tagQuery, setTagQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [savingInterests, setSavingInterests] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Precargamos los temas para que estén listos en el paso 2
  useEffect(() => {
    getTags().then(setTags).catch(() => setTags([]))
  }, [])

  // Paso 1: guarda la suscripción de una (así el digest funciona aunque omita los temas)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await subscribeNewsletter(email.trim(), name.trim() || undefined)
      setStep('interests')
    } catch {
      setError('No se pudo completar la suscripción. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Paso 2 (opcional): suma los temas elegidos a la suscripción ya creada
  const saveInterests = async () => {
    setSavingInterests(true)
    try {
      await subscribeNewsletter(email.trim(), name.trim() || undefined, [...selected])
    } catch {
      // Si falla, igual ya está suscripto; no bloqueamos el cierre
    } finally {
      setSavingInterests(false)
      setStep('done')
    }
  }

  const toggleTag = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const filteredTags = tagQuery.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(tagQuery.trim().toLowerCase()))
    : tags

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--brand-navy)] px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-white leading-tight">
              {step === 'interests' ? 'Casi listo: elige tus temas' : 'Suscríbete a Reporte Médico'}
            </h2>
            <p className="text-xs text-white/70 mt-1">
              {step === 'interests'
                ? 'Así te enviamos solo lo que te interesa (opcional)'
                : 'Recibe las últimas noticias de salud en tu correo'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-white/60 hover:text-white transition-colors ml-4 shrink-0 mt-0.5">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === 'done' ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Check size={28} strokeWidth={2} className="text-[var(--color-primary)]" />
              </div>
              <p className="font-semibold text-[var(--color-text-primary)]">¡Gracias por suscribirte!</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {selected.size > 0
                  ? 'Te enviaremos las noticias de los temas que elegiste.'
                  : 'Te enviaremos las noticias más importantes de salud de República Dominicana.'}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Cerrar
              </button>
            </div>
          ) : step === 'interests' ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                ¿Sobre qué temas quieres recibir noticias? Elige los que te interesen — o sáltalo, ya quedaste suscripto.
              </p>
              {tags.length > 8 && (
                <input
                  type="text"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  placeholder="Buscar tema…"
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30"
                />
              )}
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {filteredTags.map((t) => {
                  const on = selected.has(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        on
                          ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--brand-navy)]/40'
                      }`}
                    >
                      {t.name}
                    </button>
                  )
                })}
                {filteredTags.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] py-2">No encontramos ese tema.</p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={saveInterests}
                  disabled={savingInterests || selected.size === 0}
                  className="flex-1 py-2.5 bg-[var(--brand-navy)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingInterests ? <Loader2 size={15} className="animate-spin" /> : `Guardar mis temas${selected.size > 0 ? ` (${selected.size})` : ''}`}
                </button>
                <button
                  onClick={() => setStep('done')}
                  disabled={savingInterests}
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Omitir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[var(--brand-navy)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Suscribirme'}
              </button>
              <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                Sin spam. Puedes darte de baja en cualquier momento.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user } = useUser() // sesión de médico (Auth0); undefined si no está logueado
  const [menuOpen, setMenuOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [subscribeOpen, setSubscribeOpen] = useState(false)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar — navy */}
      <div className="bg-[var(--brand-navy)] text-white">
        <div className="max-w-site mx-auto px-4 md:px-6 h-9 flex items-center justify-between">
          <span className="text-xs text-white/70 font-body">República Dominicana</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSubscribeOpen(true)}
              className="hidden sm:inline-flex items-center text-[10px] font-semibold px-3 py-1 rounded-full border border-[var(--brand-gold)]/60 text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/10 transition-colors tracking-wide"
            >
              SUSCRIBIRSE
            </button>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.youtube.com/@reportemedico1504"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-white/60 hover:text-[var(--brand-gold)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
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
                  <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24c3.3 0 3.7 0 4.9-.1 4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-[var(--color-surface)]/95 backdrop-blur relative">
        {/* Barra de progreso de lectura — reemplaza el borde gold estático */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--brand-gold)]/20 overflow-hidden">
          <div
            className="h-full transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] origin-left shadow-[0_0_8px_rgba(255,215,0,0.5)]"
            style={{
              transform: `scaleX(${progress / 100})`,
              background: 'linear-gradient(to right, #facc15, #fde68a, #eab308)',
            }}
          />
        </div>
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
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href
              // Guía Médica resaltada: pill navy con texto blanco
              if (href === '/guia-medica') {
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`text-sm font-body font-semibold px-3 py-1.5 rounded-full bg-[var(--brand-navy)] text-white hover:opacity-90 transition-opacity ${
                        isActive ? 'ring-2 ring-[var(--brand-gold)]/60 ring-offset-1' : ''
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                )
              }
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-sm font-body font-medium transition-colors hover:text-[var(--brand-navy)] ${isActive
                        ? 'text-[var(--brand-navy)] border-b-2 border-[var(--brand-gold)] pb-0.5'
                        : 'text-[var(--color-text-secondary)]'
                      }`}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <SearchBar />

            {/* Médico logueado → acceso a su cuenta */}
            {user && (
              <Link
                href="/mi-cuenta"
                className="hidden md:inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-[var(--brand-navy)]/20 hover:border-[var(--brand-navy)]/40 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                {user.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.picture as string} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <UserCircle size={20} className="text-[var(--brand-navy)]" strokeWidth={1.5} />
                )}
                <span className="text-sm font-body font-medium text-[var(--brand-navy)]">Mi cuenta</span>
              </Link>
            )}

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

      {subscribeOpen && <SubscribeModal onClose={() => setSubscribeOpen(false)} />}

      {/* Mobile menu — fondo navy */}
      {menuOpen && (
        <div className="md:hidden bg-[var(--brand-navy)]">
          <ul className="flex flex-col py-2">
            {NAV_LINKS.map(({ href, label }) => {
              const isGuia = href === '/guia-medica'
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-6 py-3 text-sm transition-colors ${
                      isGuia
                        ? 'font-bold text-[var(--brand-gold)] bg-white/5'
                        : pathname === href
                          ? 'font-medium text-[var(--brand-gold)] bg-white/10'
                          : 'font-medium text-white/80 hover:text-[var(--brand-gold)] hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
            {user && (
              <li>
                <Link
                  href="/mi-cuenta"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-[var(--brand-gold)] hover:bg-white/5"
                >
                  <UserCircle size={18} strokeWidth={1.5} /> Mi cuenta
                </Link>
              </li>
            )}
            <li className="px-4 pt-2 pb-3">
              <button
                onClick={() => { setMenuOpen(false); setSubscribeOpen(true) }}
                className="w-full py-2.5 text-sm font-semibold rounded-lg border border-[var(--brand-gold)]/60 text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/10 transition-colors"
              >
                Suscribirse
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
