'use client'

import { useState } from 'react'
import { Mail, Send, Loader2, CheckCircle2, AlertTriangle, Clock, Stethoscope } from 'lucide-react'
import { sendDoctorDigest, type DoctorDigestPreview, type DoctorDigestResult } from '@/lib/api-guia'

const DAY = 24 * 60 * 60 * 1000

function sinceLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

export default function DoctorDigestSender({
  initialPreview,
  token,
}: {
  initialPreview: DoctorDigestPreview
  token: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<DoctorDigestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { articlePool, willReceive, eligibleDoctors, lastSend } = initialPreview
  const canSend = articlePool > 0 && willReceive > 0

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await sendDoctorDigest(token)
      setResult(res)
      setConfirming(false)
    } catch (err) {
      setError((err as Error).message || 'No se pudo enviar el digest')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
        <Stethoscope size={18} className="text-[var(--color-primary,#001450)]" strokeWidth={1.6} />
        <h2 className="font-body font-semibold text-sm text-[var(--color-text-primary)]">
          Digest de noticias a médicos
        </h2>
      </div>

      <div className="p-5 space-y-4">
        {result ? (
          <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-px" />
            <div className="text-sm text-green-800">
              <p className="font-semibold">Digest enviado</p>
              <p className="text-xs mt-0.5">
                Llegó a <strong>{result.sent}</strong> médicos
                {typeof result.targeted === 'number' && <> de {result.targeted} con novedades en su especialidad</>}
                {result.failed > 0 && <> · {result.failed} fallidos</>}.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-secondary)]">
              A cada médico publicado se le envían las publicaciones nuevas que coinciden con{' '}
              <strong>sus especialidades</strong> (vía los temas de la noticia). Cada correo incluye su enlace para
              dejar de recibir novedades.
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <Mail size={14} className="text-[var(--color-primary,#001450)]" />
                <strong className="text-[var(--color-text-primary)]">{willReceive}</strong> médicos recibirían el digest
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                {articlePool} publicaciones nuevas · {eligibleDoctors} médicos elegibles
              </span>
            </div>

            {lastSend && (
              <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Clock size={13} /> Último digest a médicos {sinceLabel(lastSend.sentAt)} (a {lastSend.recipients})
                {lastSend.auto && ' · automático'}. Recomendado: cada 2 semanas.
              </p>
            )}

            {!canSend ? (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 mt-px" />
                <span>
                  No hay novedades nuevas que coincidan con las especialidades de los médicos desde el último envío.
                </span>
              </div>
            ) : (
              <>
                {error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle size={13} /> {error}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {!confirming ? (
                    <button
                      onClick={() => setConfirming(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary,#001450)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      <Send size={15} /> Enviar a {willReceive} médicos
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
