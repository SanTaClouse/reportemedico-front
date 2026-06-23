'use client'

import { useState } from 'react'
import {
  Send, Loader2, CheckCircle2, AlertTriangle, Newspaper, ExternalLink, Clock, CalendarClock,
} from 'lucide-react'
import {
  sendNewsletter, updateNewsletterSchedule,
  type NewsletterPreview, type NewsletterSendResult, type NewsletterSchedule,
} from '@/lib/api'

const COOLDOWN_DAYS = 7
const DAY = 24 * 60 * 60 * 1000
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function sinceLabel(days: number): string {
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

// Próximo envío según día (0-6) y hora — espejo de la lógica del backend
function computeNextRun(dayOfWeek: number, hour: number): Date {
  const now = new Date()
  const next = new Date(now)
  next.setHours(hour, 0, 0, 0)
  let diff = (dayOfWeek - now.getDay() + 7) % 7
  if (diff === 0 && next.getTime() <= now.getTime()) diff = 7
  next.setDate(next.getDate() + diff)
  return next
}

function untilLabel(date: Date): string {
  const days = Math.ceil((date.getTime() - Date.now()) / DAY)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'mañana'
  return `en ${days} días`
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

  const [schedule, setSchedule] = useState<NewsletterSchedule>(initialPreview.schedule)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const { articles, recipientCount, lastSentAt, lastSend } = initialPreview

  const canSend = articles.length > 0 && recipientCount > 0
  const daysSinceLast = lastSentAt ? Math.floor((Date.now() - new Date(lastSentAt).getTime()) / DAY) : null
  const inCooldown = daysSinceLast !== null && daysSinceLast < COOLDOWN_DAYS
  const blocked = inCooldown && !override

  const nextRun = schedule.enabled ? computeNextRun(schedule.dayOfWeek, schedule.hour) : null

  const saveSchedule = async (partial: Partial<Pick<NewsletterSchedule, 'enabled' | 'dayOfWeek' | 'hour'>>) => {
    const optimistic = { ...schedule, ...partial }
    setSchedule(optimistic)
    setSavingSchedule(true)
    try {
      const updated = await updateNewsletterSchedule(partial, token)
      setSchedule(updated)
    } catch {
      // revertimos si falla
      setSchedule(schedule)
    } finally {
      setSavingSchedule(false)
    }
  }

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

  // Cartel "entregadas": el envío recién hecho, o el último registrado
  const delivered = result
    ? { recipients: result.sent, articleTitles: articles.map((a) => a.title), auto: false, sentAt: new Date().toISOString() }
    : lastSend

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
        <Newspaper size={18} className="text-[var(--color-primary,#001450)]" strokeWidth={1.6} />
        <h2 className="font-body font-semibold text-sm text-[var(--color-text-primary)]">Newsletter semanal</h2>
      </div>

      <div className="p-5 space-y-5">
        {/* ─── Programación automática ─── */}
        <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) => saveSchedule({ enabled: e.target.checked })}
              className="w-4 h-4 accent-[var(--color-primary,#001450)]"
            />
            <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
              <CalendarClock size={15} /> Enviar automáticamente cada semana
            </span>
            {savingSchedule && <Loader2 size={13} className="animate-spin text-[var(--color-text-muted)]" />}
          </label>

          {schedule.enabled && (
            <>
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <span className="text-xs text-[var(--color-text-muted)]">Cada</span>
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) => saveSchedule({ dayOfWeek: Number(e.target.value) })}
                  className="px-2.5 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
                <span className="text-xs text-[var(--color-text-muted)]">a las</span>
                <select
                  value={schedule.hour}
                  onChange={(e) => saveSchedule({ hour: Number(e.target.value) })}
                  className="px-2.5 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
                <span className="text-xs text-[var(--color-text-muted)]">(hora RD)</span>
              </div>
              {nextRun && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--color-primary,#001450)] bg-[var(--color-primary-pale,#e8edf8)] rounded-lg px-3 py-2">
                  <CalendarClock size={13} />
                  {untilLabel(nextRun) === 'hoy' ? 'Hoy' : `${untilLabel(nextRun).charAt(0).toUpperCase()}${untilLabel(nextRun).slice(1)}`} se
                  enviarán automáticamente las novedades a los suscriptores ({DAY_NAMES[schedule.dayOfWeek]}{' '}
                  {String(schedule.hour).padStart(2, '0')}:00). Solo se envía si hay noticias nuevas.
                </p>
              )}
            </>
          )}
          {!schedule.enabled && (
            <p className="text-xs text-[var(--color-text-muted)] pl-7">
              Activa esto para que las novedades salgan solas cada semana. Si no, las envías a mano cuando quieras.
            </p>
          )}
        </div>

        {/* ─── Cartel: noticias entregadas ─── */}
        {delivered && (
          <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-px" />
            <div className="text-sm text-green-800 min-w-0">
              <p className="font-semibold">
                {result ? 'Las siguientes noticias fueron entregadas' : 'Último envío'} a {delivered.recipients}{' '}
                suscriptores
                {!result && <> · {sinceLabel(Math.floor((Date.now() - new Date(delivered.sentAt).getTime()) / DAY))}</>}
                {delivered.auto && <span className="ml-1 text-[10px] font-bold uppercase">· automático</span>}
              </p>
              {delivered.articleTitles.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 text-xs text-green-700 list-disc pl-4">
                  {delivered.articleTitles.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ─── Envío manual ─── */}
        {!result && (
          <>
            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Envío manual: se mandará a los <strong>{recipientCount}</strong> suscriptores activos un resumen con
                las publicaciones <strong>nuevas desde el último envío</strong>. Cada correo incluye su enlace de baja.
              </p>
              {daysSinceLast !== null && (
                <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-1.5">
                  <Clock size={13} /> Último newsletter enviado {sinceLabel(daysSinceLast)}.
                </p>
              )}
            </div>

            {articles.length === 0 ? (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 mt-px" />
                <span>No hay publicaciones nuevas desde el último envío. Cuando publiques algo, vuelve aquí.</span>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Novedades a enviar ({articles.length})
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
                    Ya enviaste un newsletter {sinceLabel(daysSinceLast!)}. Para no saturar a tus suscriptores (y
                    cuidar que tus correos no caigan en spam), conviene esperar al menos {COOLDOWN_DAYS} días entre
                    envíos.
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
                    <Send size={15} /> Enviar ahora a {recipientCount} suscriptores
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
