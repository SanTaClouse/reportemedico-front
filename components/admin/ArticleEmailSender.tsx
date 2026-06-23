'use client'

import { useState } from 'react'
import { Mail, Loader2, Send, Users, Target, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react'
import {
  getArticleAudience,
  sendArticleEmail,
  type ArticleAudience,
  type ArticleEmailResult,
} from '@/lib/api'

type Mode = 'interested' | 'manual'

export default function ArticleEmailSender({ articleId, token }: { articleId: string; token: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [audience, setAudience] = useState<ArticleAudience | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<Mode>('interested')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ArticleEmailResult | null>(null)

  const expand = async () => {
    setOpen(true)
    if (audience || loading) return
    setLoading(true)
    setError(null)
    try {
      const data = await getArticleAudience(articleId, token)
      setAudience(data)
      // Por defecto, la selección manual arranca con los interesados ya marcados
      setSelected(new Set(data.recipients.filter((r) => r.interested).map((r) => r.id)))
      if (data.interestedCount === 0) setMode('manual')
    } catch (err) {
      setError((err as Error).message || 'No se pudo cargar la audiencia')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const recipientCount = mode === 'interested' ? (audience?.interestedCount ?? 0) : selected.size
  const canSend = recipientCount > 0 && !sending

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      const body = mode === 'interested' ? { audience: 'interested' as const } : { subscriberIds: [...selected] }
      const res = await sendArticleEmail(articleId, body, token)
      setResult(res)
      setConfirming(false)
    } catch (err) {
      setError((err as Error).message || 'No se pudo enviar')
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={expand}
        className="mb-6 w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary,#001450)]/40 transition-colors text-left"
      >
        <span className="w-9 h-9 rounded-lg bg-[var(--color-primary,#001450)] flex items-center justify-center shrink-0">
          <Mail size={17} className="text-[var(--color-accent,#F0B414)]" strokeWidth={1.6} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
            Enviar esta noticia por correo
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            A los suscriptores interesados en el tema, o a una selección manual.
          </span>
        </span>
        <ChevronDown size={18} className="text-[var(--color-text-muted)] shrink-0" />
      </button>
    )
  }

  return (
    <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
        <Mail size={18} className="text-[var(--color-primary,#001450)]" strokeWidth={1.6} />
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Enviar esta noticia por correo</h2>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] py-4">
            <Loader2 size={16} className="animate-spin" /> Cargando audiencia…
          </div>
        ) : error && !audience ? (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertTriangle size={14} /> {error}
          </p>
        ) : result ? (
          <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-px" />
            <div className="text-sm text-green-800">
              <p className="font-semibold">Noticia enviada</p>
              <p className="text-xs mt-0.5">
                Llegó a <strong>{result.sent}</strong> de {result.total} suscriptores
                {result.failed > 0 && <> · {result.failed} fallidos</>}.
              </p>
            </div>
          </div>
        ) : audience ? (
          <div className="space-y-4">
            {audience.totalActive === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Todavía no tienes suscriptores activos a quienes enviar.
              </p>
            ) : (
              <>
                {/* Selección de audiencia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('interested')}
                    disabled={audience.interestedCount === 0}
                    className={`text-left rounded-lg border p-3 transition-colors disabled:opacity-50 ${
                      mode === 'interested'
                        ? 'border-[var(--color-primary,#001450)] bg-[var(--color-primary-pale,#e8edf8)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary,#001450)]/40'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                      <Target size={14} /> Interesados ({audience.interestedCount})
                    </span>
                    <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      {audience.tags.length > 0
                        ? `Suscriptores con interés en: ${audience.tags.join(', ')}`
                        : 'Esta noticia no tiene temas asignados'}
                    </span>
                  </button>

                  <button
                    onClick={() => setMode('manual')}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      mode === 'manual'
                        ? 'border-[var(--color-primary,#001450)] bg-[var(--color-primary-pale,#e8edf8)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary,#001450)]/40'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                      <Users size={14} /> Elegir manualmente ({selected.size})
                    </span>
                    <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      De {audience.totalActive} suscriptores activos
                    </span>
                  </button>
                </div>

                {/* Lista para selección manual */}
                {mode === 'manual' && (
                  <div className="rounded-lg border border-[var(--color-border)] max-h-64 overflow-y-auto divide-y divide-[var(--color-border)]">
                    {audience.recipients.map((r) => (
                      <label
                        key={r.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-surface-2)] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                          className="w-4 h-4 accent-[var(--color-primary,#001450)]"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-[var(--color-text-primary)] truncate">
                            {r.name || r.email}
                          </span>
                          {r.name && <span className="block text-[11px] text-[var(--color-text-muted)] truncate">{r.email}</span>}
                        </span>
                        {r.interested && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-primary-pale,#e8edf8)] text-[var(--color-primary,#001450)] shrink-0">
                            interesado
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle size={13} /> {error}
                  </p>
                )}

                {/* Confirmación / envío */}
                <div className="flex items-center gap-3 flex-wrap">
                  {!confirming ? (
                    <button
                      onClick={() => setConfirming(true)}
                      disabled={!canSend}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary,#001450)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
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
                        Confirmar envío a {recipientCount}
                      </button>
                      <button
                        onClick={() => setConfirming(false)}
                        disabled={sending}
                        className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
