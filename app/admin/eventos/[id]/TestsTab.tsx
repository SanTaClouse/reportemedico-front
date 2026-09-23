'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import {
  Eye, FlaskConical, Loader2, Radio, RotateCcw, ScanLine, Send, Star, Ticket, Trash2, X,
} from 'lucide-react'
import {
  attendanceLabel, createTestRegistration, deleteRegistration, deleteTests, entryUrl, formatTime, getEmailPreview,
  resetTestCheckIns, sendTestEmail,
  type AdminEvent, type EventAttendance, type RegistrationRow, type TestEmailType,
} from '@/lib/api-eventos'

const EMAILS: { type: TestEmailType; label: string }[] = [
  { type: 'received', label: 'Recibida' },
  { type: 'approved', label: 'Aprobada' },
  { type: 'access', label: 'QR de acceso' },
]

const STEPS = [
  'Crea una inscripción de prueba con tu email. Queda aprobada y con QR, y no cuenta en los números del evento.',
  'Revisa cómo se ven los tres emails con "Ver", o envíatelos con "Enviar" (necesita el SMTP configurado).',
  'Abre el escáner en tu celular o en otra pestaña y escanea el QR de esta pantalla, del email o de "Mi entrada".',
  'Escanéalo dos veces: la segunda debe avisar "Ya ingresó". Si la prueba es solo de jornada, prueba escanearla en la gala.',
  'Abre la vista en vivo: si marcaste la prueba como VIP, aparece el aviso destacado.',
  'Usa "Reiniciar ingresos" para volver a probar, y "Borrar todas las pruebas" al terminar.',
]

function TestQr({ value }: { value: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(value, { width: 320, margin: 1, errorCorrectionLevel: 'M' }).then(setSrc).catch(() => setSrc(''))
  }, [value])
  // eslint-disable-next-line @next/next/no-img-element -- data: URL generada en el cliente, next/image no aporta nada
  return src ? <img src={src} alt="QR de la inscripción de prueba" className="h-40 w-40 rounded-lg bg-white p-1" /> : <div className="h-40 w-40 rounded-lg bg-[var(--color-surface-2)]" />
}

export default function TestsTab({ event, tests, token }: { event: AdminEvent; tests: RegistrationRow[]; token: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: 'Prueba', email: '', attendance: 'BOTH' as EventAttendance, isVip: false })
  const [busy, setBusy] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ title: string; html: string } | null>(null)

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try {
      await fn()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    void run('create', async () => {
      await createTestRegistration(event.id, form, token)
      toast.success('Inscripción de prueba creada')
      setForm((f) => ({ ...f, firstName: '', email: '' }))
      router.refresh()
    })
  }

  const input =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]'
  const smallBtn =
    'inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:border-primary/40 hover:text-primary disabled:opacity-40'

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:bg-amber-500/10 dark:border-amber-500/30">
        <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
          <FlaskConical size={17} strokeWidth={1.5} /> Cómo probar el flujo completo del QR
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-amber-900/90 dark:text-amber-100/90">
          {STEPS.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="mt-3 text-xs text-amber-900/70 dark:text-amber-100/70">
          Para probar el formulario real, inscríbete desde la página pública y apruébate en la pestaña Inscritos: eso
          dispara los mismos emails que recibirán los invitados.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/acceso/${event.slug}`} target="_blank" className={smallBtn}><ScanLine size={14} /> Abrir escáner</Link>
          <Link href={`/acceso/${event.slug}/en-vivo`} target="_blank" className={smallBtn}><Radio size={14} /> Abrir en vivo</Link>
          <button
            disabled={!!busy || tests.length === 0}
            onClick={() => run('reset', async () => {
              const r = await resetTestCheckIns(event.id, token)
              toast.success(`${r.deleted} ingreso${r.deleted === 1 ? '' : 's'} de prueba reiniciado${r.deleted === 1 ? '' : 's'}`)
              router.refresh()
            })}
            className={smallBtn}
          >
            <RotateCcw size={14} /> Reiniciar ingresos
          </button>
          <button
            disabled={!!busy || tests.length === 0}
            onClick={() => {
              if (!confirm('¿Borrar todas las inscripciones de prueba?')) return
              void run('delete-all', async () => {
                const r = await deleteTests(event.id, token)
                toast.success(`${r.deleted} prueba${r.deleted === 1 ? '' : 's'} borrada${r.deleted === 1 ? '' : 's'}`)
                router.refresh()
              })
            }}
            className={`${smallBtn} hover:!text-red-600 hover:!border-red-300`}
          >
            <Trash2 size={14} /> Borrar todas las pruebas
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-3">
          {tests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
              No hay inscripciones de prueba. Crea una con el formulario.
            </p>
          ) : (
            tests.map((t) => {
              const url = t.accessToken ? entryUrl(event.slug, t.accessToken) : ''
              return (
                <div key={t.id} className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex-wrap">
                  {url && <TestQr value={url} />}
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {t.isVip && <Star size={14} className="mr-1 inline text-brand-gold" fill="currentColor" />}
                      {t.firstName} {t.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{t.email}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{attendanceLabel(event, t.attendance)}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      {t.checkIns.length
                        ? `Ingresó: ${t.checkIns.map((c) => `${c.part === 'DAY' ? 'jornada' : 'gala'} ${formatTime(c.createdAt)}`).join(' · ')}`
                        : <span className="text-[var(--color-text-muted)] font-normal">Sin ingresos todavía</span>}
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-12 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">Ver</span>
                        {EMAILS.map((m) => (
                          <button
                            key={m.type}
                            disabled={!!busy}
                            onClick={() => run(`pv-${t.id}-${m.type}`, async () => {
                              setPreview({ title: `Email "${m.label}" → ${t.email}`, html: await getEmailPreview(event.id, t.id, m.type, token) })
                            })}
                            className={smallBtn}
                          >
                            <Eye size={13} /> {m.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-12 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">Enviar</span>
                        {EMAILS.map((m) => (
                          <button
                            key={m.type}
                            disabled={!!busy}
                            onClick={() => run(`send-${t.id}-${m.type}`, async () => {
                              const r = await sendTestEmail(event.id, t.id, m.type, token)
                              if (!r.smtp) toast.warning('SMTP no configurado en el back: el email no salió. Usa "Ver" para revisarlo.')
                              else if (r.sent) toast.success(`Email "${m.label}" enviado a ${r.to}`)
                              else toast.error('El envío falló, revisa el log del back')
                            })}
                            className={smallBtn}
                          >
                            {busy === `send-${t.id}-${m.type}` ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} {m.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {url && (
                          <a href={url.replace(/^https?:\/\/[^/]+/, '')} target="_blank" rel="noopener noreferrer" className={smallBtn}>
                            <Ticket size={13} /> Abrir &quot;Mi entrada&quot;
                          </a>
                        )}
                        <button
                          disabled={!!busy}
                          onClick={() => run(`del-${t.id}`, async () => {
                            await deleteRegistration(event.id, t.id, token)
                            router.refresh()
                          })}
                          className={`${smallBtn} hover:!text-red-600`}
                        >
                          <Trash2 size={13} /> Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form onSubmit={create} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
          <p className="font-semibold text-[var(--color-text-primary)]">Nueva inscripción de prueba</p>
          <div className="grid grid-cols-2 gap-2">
            <input required minLength={2} placeholder="Nombre" value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={input} />
            <input required minLength={2} placeholder="Apellido" value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={input} />
          </div>
          <input required type="email" placeholder="Tu email (ej. tu+prueba1@gmail.com)" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
          <select value={form.attendance} onChange={(e) => setForm({ ...form, attendance: e.target.value as EventAttendance })} className={input}>
            <option value="BOTH">{event.dayTitle} y {event.eveningTitle}</option>
            <option value="DAY">Solo {event.dayTitle}</option>
            <option value="EVENING">Solo {event.eveningTitle}</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} />
            Marcar como VIP (para probar el aviso en vivo)
          </label>
          <button type="submit" disabled={busy === 'create'}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {busy === 'create' && <Loader2 size={15} className="animate-spin" />} Crear prueba con QR
          </button>
        </form>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--color-surface)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{preview.title}</p>
              <button onClick={() => setPreview(null)} aria-label="Cerrar" className="rounded-lg p-1 hover:bg-[var(--color-surface-2)]">
                <X size={18} />
              </button>
            </div>
            <iframe title="Vista previa del email" srcDoc={preview.html} sandbox="" className="flex-1 w-full bg-white" />
          </div>
        </div>
      )}
    </div>
  )
}
