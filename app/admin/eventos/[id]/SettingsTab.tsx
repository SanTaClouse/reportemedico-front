'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateEventAdmin, type AdminEvent } from '@/lib/api-eventos'

/*
 * Los campos de fecha se editan en hora de República Dominicana. RD es UTC-4
 * todo el año (sin horario de verano), así que la conversión es fija.
 */
const RD_OFFSET_MS = 4 * 60 * 60 * 1000
const toInput = (iso: string) => new Date(new Date(iso).getTime() - RD_OFFSET_MS).toISOString().slice(0, 16)
const fromInput = (v: string) => new Date(`${v}:00-04:00`).toISOString()

const DATE_FIELDS = ['dayStartsAt', 'dayEndsAt', 'eveningStartsAt', 'eveningEndsAt', 'qrSendAt'] as const

export default function SettingsTab({ event, token }: { event: AdminEvent; token: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: event.name,
    venueName: event.venueName,
    venueAddress: event.venueAddress ?? '',
    mapsUrl: event.mapsUrl ?? '',
    dayTitle: event.dayTitle,
    dayStartsAt: toInput(event.dayStartsAt),
    dayEndsAt: toInput(event.dayEndsAt),
    dayCapacity: event.dayCapacity?.toString() ?? '',
    eveningTitle: event.eveningTitle,
    eveningVenue: event.eveningVenue ?? '',
    eveningStartsAt: toInput(event.eveningStartsAt),
    eveningEndsAt: toInput(event.eveningEndsAt),
    eveningCapacity: event.eveningCapacity?.toString() ?? '',
    qrSendAt: toInput(event.qrSendAt),
    reminderDays: event.reminderDays.join(', '),
    registrationOpen: event.registrationOpen,
  })
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        ...form,
        dayCapacity: form.dayCapacity === '' ? null : Number(form.dayCapacity),
        eveningCapacity: form.eveningCapacity === '' ? null : Number(form.eveningCapacity),
        // "7, 3, 1" → [7, 3, 1], de mayor a menor y sin repetidos
        reminderDays: [...new Set(
          form.reminderDays.split(',').map((d) => Number(d.trim())).filter((d) => Number.isInteger(d) && d >= 0),
        )].sort((a, b) => b - a),
      }
      for (const k of DATE_FIELDS) payload[k] = fromInput(form[k])
      await updateEventAdmin(event.id, payload, token)
      toast.success('Configuración guardada')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const input =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]'
  const label = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1'
  const text = (k: keyof typeof form, l: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className={label} htmlFor={`ev-${k}`}>{l}</label>
      <input id={`ev-${k}`} value={form[k] as string} onChange={(e) => set(k, e.target.value)} className={input} {...extra} />
    </div>
  )
  const section = 'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4'

  return (
    <form onSubmit={save} className="max-w-3xl space-y-5">
      <div className={section}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.registrationOpen}
            onChange={(e) => set('registrationOpen', e.target.checked)}
            className="h-5 w-5"
          />
          <span>
            <span className="block font-semibold text-[var(--color-text-primary)]">Inscripción abierta</span>
            <span className="block text-xs text-[var(--color-text-muted)]">
              Si la cierras, el formulario muestra &quot;Inscripciones cerradas&quot; y no acepta nuevas.
            </span>
          </span>
        </label>
      </div>

      <div className={section}>
        <p className="font-semibold text-[var(--color-text-primary)]">Evento y lugar</p>
        {text('name', 'Nombre del evento', { required: true })}
        <div className="grid sm:grid-cols-2 gap-4">
          {text('venueName', 'Lugar', { required: true })}
          {text('venueAddress', 'Dirección')}
        </div>
        {text('mapsUrl', 'Link de Google Maps')}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className={section}>
          <p className="font-semibold text-[var(--color-text-primary)]">Parte de día</p>
          {text('dayTitle', 'Nombre', { required: true })}
          {text('dayStartsAt', 'Empieza (hora RD)', { type: 'datetime-local', required: true })}
          {text('dayEndsAt', 'Termina (hora RD)', { type: 'datetime-local', required: true })}
          {text('dayCapacity', 'Cupo de referencia', { type: 'number', min: 0 })}
        </div>
        <div className={section}>
          <p className="font-semibold text-[var(--color-text-primary)]">Parte de noche</p>
          {text('eveningTitle', 'Nombre', { required: true })}
          {text('eveningVenue', 'Salón')}
          {text('eveningStartsAt', 'Empieza (hora RD)', { type: 'datetime-local', required: true })}
          {text('eveningEndsAt', 'Termina (hora RD)', { type: 'datetime-local', required: true })}
          {text('eveningCapacity', 'Cupo de referencia', { type: 'number', min: 0 })}
        </div>
      </div>

      <div className={section}>
        <p className="font-semibold text-[var(--color-text-primary)]">Correos con el QR</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          El código QR sale <strong>al aprobar cada inscripción</strong>, dentro del correo que confirma el lugar.
          Después se repite en los recordatorios, para que nadie tenga que buscarlo en la puerta.
        </p>
        {text('reminderDays', 'Recordatorios: días antes del evento, separados por coma')}
        <p className="text-xs text-[var(--color-text-muted)]">
          Por ejemplo <code>7, 1</code> manda uno una semana antes y otro el día anterior. Usa <code>0</code> para el
          mismo día. Cada persona recibe cada recordatorio una sola vez, entre las 9 de la mañana y las 9 de la noche.
        </p>
        {text('qrSendAt', 'Envío de respaldo: fecha y hora (hora RD)', { type: 'datetime-local', required: true })}
        <p className="text-xs text-[var(--color-text-muted)]">
          Red de seguridad: a partir de ese momento el sistema le manda el QR a cualquier aprobado que, por el motivo
          que sea, todavía no lo haya recibido.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar cambios
      </button>
    </form>
  )
}
