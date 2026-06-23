'use client'

import { useState, useEffect } from 'react'
import { Mail, Check, Loader2, BellPlus } from 'lucide-react'
import { subscribeNewsletter } from '@/lib/api'

const LS_KEY = 'rm_news_email'

/**
 * Captura de intereses al pie del artículo (08 §1, Fase C).
 * El lector deja su email y se suscribe a los temas del artículo — NUNCA crea
 * cuenta (las cuentas son solo para médicos). Recuerda el email del lector en
 * localStorage para que la próxima vez sea un clic.
 */
export default function TopicSubscribe({ tags }: { tags: { id: string; name: string }[] }) {
  const [email, setEmail] = useState('')
  const [knownEmail, setKnownEmail] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tags.map((t) => t.id)))
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setKnownEmail(saved)
    } catch {
      /* localStorage no disponible */
    }
  }, [])

  if (tags.length === 0) return null

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const targetEmail = (knownEmail || email).trim()
    if (!targetEmail || selected.size === 0) return
    setLoading(true)
    setError('')
    try {
      await subscribeNewsletter(targetEmail, undefined, [...selected])
      try {
        localStorage.setItem(LS_KEY, targetEmail)
      } catch {
        /* ignore */
      }
      setKnownEmail(targetEmail)
      setDone(true)
    } catch {
      setError('No se pudo completar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const selectedNames = tags.filter((t) => selected.has(t.id)).map((t) => t.name)
  const multi = tags.length > 1

  return (
    <div className="max-w-article mx-auto mt-12 rounded-2xl border border-[var(--brand-gold)]/30 bg-gradient-to-br from-[var(--brand-navy)] to-[#0A1E5E] p-6 md:p-8">
      {done ? (
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-[var(--brand-gold)]/20 flex items-center justify-center shrink-0">
            <Check size={20} className="text-[var(--brand-gold)]" strokeWidth={2} />
          </span>
          <div>
            <p className="font-display font-bold text-white text-lg">¡Listo, te avisaremos!</p>
            <p className="text-sm text-white/75 mt-1">
              Vas a recibir en tu correo lo nuevo sobre{' '}
              <strong className="text-white">{selectedNames.join(', ')}</strong>.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Mail size={18} className="text-[var(--brand-gold)]" strokeWidth={1.8} />
            <h3 className="font-display font-bold text-white text-lg">¿Te interesan más noticias así?</h3>
          </div>
          <p className="text-sm text-white/70 mb-4">
            Suscríbete y recibe en tu correo lo nuevo sobre {multi ? 'estos temas' : 'este tema'}. Sin spam, te
            das de baja cuando quieras.
          </p>

          {/* Temas (preseleccionados; el lector ajusta) */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((t) => {
              const on = selected.has(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    on
                      ? 'bg-[var(--brand-gold)] text-[var(--brand-navy)] border-[var(--brand-gold)]'
                      : 'text-white/80 border-white/25 hover:border-[var(--brand-gold)]/60'
                  }`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            {!knownEmail && (
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 px-3.5 py-2.5 text-sm rounded-lg bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/40"
              />
            )}
            <button
              type="submit"
              disabled={loading || selected.size === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-light)] text-[var(--brand-navy)] text-sm font-bold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : knownEmail ? (
                <BellPlus size={15} />
              ) : (
                <Mail size={15} />
              )}
              {knownEmail ? 'Agregar a mis temas' : 'Suscribirme'}
            </button>
          </form>

          {knownEmail && (
            <p className="text-[11px] text-white/55 mt-2">
              Usaremos el correo con el que ya te suscribiste ({knownEmail}).
            </p>
          )}
          {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
        </>
      )}
    </div>
  )
}
