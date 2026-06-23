'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle2, AlertTriangle, Newspaper, ExternalLink, Clock } from 'lucide-react'
import { sendNewsletter, type NewsletterPreview, type NewsletterSendResult } from '@/lib/api'

const COOLDOWN_DAYS = 7
const DAY = 24 * 60 * 60 * 1000

function sinceLabel(days: number): string {
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

export default function NewsletterSender({
  initialPreview,
  token,
}: {
  initialPreview: NewsletterPreview
  token: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<NewsletterSendResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [override, setOverride] = useState(false)

  const { articles, recipientCount, days, lastSentAt } = initialPreview
  const canSend = articles.length > 0 && recipientCount > 0

  // Freno de frecuencia: tras un envío reciente, el botón queda bloqueado unos
  // días (cuida la entregabilidad). El admin puede forzarlo si de verdad hace falta.
  const daysSinceLast = lastSentAt ? Math.floor((Date.now() - new Date(lastSentAt).getTime()) / DAY) : null
  const inCooldown = daysSinceLast !== null && daysSinceLast < COOLDOWN_DAYS
  const blocked = inCooldown && !override

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await sendNewsletter(token)
      setResult(res)
      setConfirming(false)
    } catch (err) {
      setError((err as Error).message || 'No se pudo enviar el newsletter')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
        <Newspaper size={18} className="text-[var(--color-primary,#001450)]" strokeWidth={1.6} />
        <h2 className="font-body font-semibold text-sm text-[var(--color-text-primary)]">Enviar newsletter</h2>
      </div>

      <div className="p-5 space-y-4">
        {result ? (
          <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-px" />
            <div className="text-sm text-green-800">
              <p className="font-semibold">Newsletter enviado</p>
              <p className="text-xs mt-0.5">
                Llegó a <strong>{result.sent}</strong> de {result.total} suscriptores
                {result.failed > 0 && <> · {result.failed} fallidos</>} · {result.articles} publicaciones.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Se enviará a los <strong>{recipientCount}</strong> suscriptores activos un resumen con las
              publicaciones de los últimos {days} días. Cada correo incluye su enlace de baja.
            </p>

            {daysSinceLast !== null && (
              <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Clock size={13} /> Último newsletter enviado {sinceLabel(daysSinceLast)}.
              </p>
            )}

            {articles.length === 0 ? (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 mt-px" />
                <span>
                  No hay publicaciones nuevas en los últimos {days} días. Cuando publiques contenido, vuelve
                  aquí para enviar el resumen.
                </span>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Lo que se enviará ({articles.length})
                </p>
                {articles.map((a) => (
                  <a
                    key={a.slug}
                    href={`/${a.type === 'NEWS' ? 'noticias' : 'articulos'}/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {a.featuredImage ? (
                      <img src={a.featuredImage} alt="" className="w-12 h-9 rounded object-cover shrink-0 bg-[var(--color-surface-2)]" />
                    ) : (
                      <span className="w-12 h-9 rounded shrink-0 bg-[var(--color-surface-2)] flex items-center justify-center">
                        <Newspaper size={14} className="text-[var(--color-text-muted)]" />
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">{a.title}</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {a.type === 'NEWS' ? 'Noticia' : 'Artículo médico'}
                      </span>
                    </span>
                    <ExternalLink size={13} className="text-[var(--color-text-muted)] shrink-0" />
                  </a>
                ))}
              </div>
            )}

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertTriangle size={13} /> {error}
              </p>
            )}

            {canSend && blocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-2">
                <p className="flex items-start gap-2 text-sm text-amber-800">
                  <Clock size={16} className="shrink-0 mt-px" />
                  <span>
                    Ya enviaste un newsletter {sinceLabel(daysSinceLast!)}. Para no saturar a tus suscriptores
                    (y cuidar que tus correos no caigan en spam), conviene esperar al menos {COOLDOWN_DAYS} días
                    entre envíos. Lo ideal es agrupar varias noticias en un solo digest.
                  </span>
                </p>
                <button
                  onClick={() => setOverride(true)}
                  className="text-xs font-semibold text-amber-800 underline hover:text-amber-900"
                >
                  Necesito enviarlo igual
                </button>
              </div>
            )}

            {canSend && !blocked && (
              <div className="flex items-center gap-3 flex-wrap">
                {!confirming ? (
                  <button
                    onClick={() => setConfirming(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary,#001450)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    <Send size={15} /> Enviar a {recipientCount} suscriptores
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary,#001450)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      Confirmar envío
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={sending}
                      className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
                      <AlertTriangle size={13} /> Se envía de inmediato y no se puede deshacer.
                    </span>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
