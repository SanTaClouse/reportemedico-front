'use client'

import { useState } from 'react'
import { ArrowRight, CalendarPlus, CheckCircle2, Loader2, MessageCircle } from 'lucide-react'
import {
  SECTOR_LABELS, SITE_URL, attendanceLabel, googleCalendarUrl, icsUrl, partTitle, partsOf, registerForEvent,
  type EventAttendance, type EventSector, type PublicEvent,
} from '@/lib/api-eventos'

interface Props {
  event: PublicEvent
  specialties: { id: string; name: string }[]
}

// 16px (text-base): con menos, Safari de iOS hace zoom al enfocar el campo
const inputClass =
  'w-full px-3.5 py-3 border border-[var(--color-border)] rounded-xl text-base bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30'
const labelClass = 'block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5'

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '',
  sector: '' as EventSector | '', specialtyId: '', institution: '', position: '',
  attendance: '' as EventAttendance | '', website: '',
}

/**
 * Inscripción al evento: una sola pantalla, pensada para el celular.
 * Todos los campos llevan `name` + `autoComplete` estándar para que el
 * navegador los complete solo.
 */
export default function RegistrationForm({ event, specialties }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState<{ firstName: string; email: string; attendance: EventAttendance } | null>(null)

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (form.firstName.trim().length < 2) e.firstName = 'Ingresa tu nombre'
    if (form.lastName.trim().length < 2) e.lastName = 'Ingresa tu apellido'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Ingresa un correo válido'
    if (form.phone.replace(/\D/g, '').length < 8) e.phone = 'Ingresa un número válido'
    if (!form.sector) e.sector = 'Elige tu sector'
    if (!form.attendance) e.attendance = 'Elige a qué vas a asistir'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setServerError('')
    if (!validate()) return
    setSaving(true)
    try {
      await registerForEvent(event.slug, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        sector: form.sector as EventSector,
        specialtyId: form.sector === 'DOCTOR' && form.specialtyId ? form.specialtyId : undefined,
        institution: form.institution.trim() || undefined,
        position: form.position.trim() || undefined,
        attendance: form.attendance as EventAttendance,
        website: form.website || undefined,
      })
      setDone({ firstName: form.firstName.trim(), email: form.email.trim(), attendance: form.attendance as EventAttendance })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setServerError((err as Error).message || 'No pudimos guardar tu inscripción. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    const shareText = encodeURIComponent(
      `Me inscribí al ${event.name} (26 de noviembre, Hotel Jaragua). Es gratis con inscripción: ${SITE_URL}/eventos/${event.slug}`,
    )
    return (
      <div className="text-center py-4">
        <CheckCircle2 size={56} strokeWidth={1.5} className="mx-auto text-emerald-500" />
        <h2 className="mt-4 font-display font-bold text-2xl sm:text-3xl text-[var(--color-text-primary)]">
          ¡Listo, {done.firstName}! Recibimos tu inscripción
        </h2>
        <p className="mt-3 text-[var(--color-text-secondary)]">
          Te enviamos un correo a <strong>{done.email}</strong>. Te avisaremos cuando tu inscripción sea aprobada, y el día
          antes del evento te llegará tu <strong>código QR de acceso</strong>.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 text-left">
          <p className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
            <CalendarPlus size={18} strokeWidth={1.5} /> Agrega la fecha a tu calendario
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{attendanceLabel(event, done.attendance)}</p>
          <div className="mt-4 grid gap-2">
            {partsOf(done.attendance).map((part) => (
              <a
                key={part}
                href={googleCalendarUrl(event, part)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-3 font-semibold text-white hover:opacity-90"
              >
                Google Calendar{partsOf(done.attendance).length > 1 ? ` · ${partTitle(event, part)}` : ''}
              </a>
            ))}
            <a
              href={icsUrl(event.slug, done.attendance)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-semibold text-[var(--color-text-primary)] hover:border-brand-navy/40"
            >
              Apple / Outlook (.ics)
            </a>
          </div>
        </div>

        <a
          href={`https://wa.me/?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline"
        >
          <MessageCircle size={16} strokeWidth={1.5} /> Invitar a un colega por WhatsApp
        </a>
      </div>
    )
  }

  const field = (key: string) => (errors[key] ? `${inputClass} !border-red-400` : inputClass)
  const err = (key: string) => errors[key] && <p className="text-xs text-red-600 mt-1">{errors[key]}</p>

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ev-first" className={labelClass}>Nombre</label>
          <input id="ev-first" name="given-name" autoComplete="given-name" value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)} className={field('firstName')} />
          {err('firstName')}
        </div>
        <div>
          <label htmlFor="ev-last" className={labelClass}>Apellido</label>
          <input id="ev-last" name="family-name" autoComplete="family-name" value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)} className={field('lastName')} />
          {err('lastName')}
        </div>
      </div>

      <div>
        <label htmlFor="ev-email" className={labelClass}>Correo electrónico</label>
        <input id="ev-email" name="email" type="email" inputMode="email" autoComplete="email" value={form.email}
          onChange={(e) => set('email', e.target.value)} className={field('email')} />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Aquí te llegará tu código QR de acceso.</p>
        {err('email')}
      </div>

      <div>
        <label htmlFor="ev-phone" className={labelClass}>WhatsApp</label>
        <input id="ev-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="809 000 0000"
          value={form.phone} onChange={(e) => set('phone', e.target.value)} className={field('phone')} />
        {err('phone')}
      </div>

      <div>
        <label htmlFor="ev-sector" className={labelClass}>¿En qué sector trabajas?</label>
        <select id="ev-sector" name="sector" value={form.sector}
          onChange={(e) => set('sector', e.target.value as EventSector)} className={field('sector')}>
          <option value="">Selecciona tu sector</option>
          {(Object.keys(SECTOR_LABELS) as EventSector[]).map((s) => (
            <option key={s} value={s}>{SECTOR_LABELS[s]}</option>
          ))}
        </select>
        {err('sector')}
      </div>

      {form.sector === 'DOCTOR' && specialties.length > 0 && (
        <div>
          <label htmlFor="ev-specialty" className={labelClass}>
            Especialidad <span className="text-[var(--color-text-muted)] font-normal">(opcional)</span>
          </label>
          <select id="ev-specialty" name="specialty" value={form.specialtyId}
            onChange={(e) => set('specialtyId', e.target.value)} className={inputClass}>
            <option value="">Selecciona tu especialidad</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ev-org" className={labelClass}>
            Institución o empresa <span className="text-[var(--color-text-muted)] font-normal">(opcional)</span>
          </label>
          <input id="ev-org" name="organization" autoComplete="organization" value={form.institution}
            onChange={(e) => set('institution', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="ev-title" className={labelClass}>
            Cargo <span className="text-[var(--color-text-muted)] font-normal">(opcional)</span>
          </label>
          <input id="ev-title" name="organization-title" autoComplete="organization-title" value={form.position}
            onChange={(e) => set('position', e.target.value)} className={inputClass} />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>¿A qué vas a asistir?</legend>
        <div className="grid gap-2">
          {([
            { value: 'BOTH', title: 'A las dos', sub: `${event.dayTitle} + ${event.eveningTitle}` },
            { value: 'DAY', title: event.dayTitle, sub: 'De día · 9 paneles' },
            { value: 'EVENING', title: event.eveningTitle, sub: 'De noche · celebración y reconocimientos' },
          ] as { value: EventAttendance; title: string; sub: string }[]).map((opt) => {
            const active = form.attendance === opt.value
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                  active
                    ? 'border-brand-navy bg-[var(--color-primary-pale)] ring-1 ring-brand-navy dark:border-brand-cyan dark:ring-brand-cyan'
                    : 'border-[var(--color-border)] hover:border-brand-navy/40'
                }`}
              >
                <input
                  type="radio"
                  name="attendance"
                  value={opt.value}
                  checked={active}
                  onChange={() => set('attendance', opt.value)}
                  className="h-5 w-5 accent-[#001450]"
                />
                <span>
                  <span className="block font-semibold text-[var(--color-text-primary)]">{opt.title}</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">{opt.sub}</span>
                </span>
              </label>
            )
          })}
        </div>
        {err('attendance')}
      </fieldset>

      {/* Honeypot: invisible para personas, los bots lo completan */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="ev-website">No completar</label>
        <input id="ev-website" name="website" tabIndex={-1} autoComplete="off" value={form.website}
          onChange={(e) => set('website', e.target.value)} />
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-4 text-base font-bold text-brand-navy hover:bg-brand-gold-light transition disabled:opacity-60"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : null}
        {saving ? 'Enviando…' : 'Confirmar inscripción'}
        {!saving && <ArrowRight size={18} strokeWidth={2} />}
      </button>
      <p className="text-xs text-center text-[var(--color-text-muted)]">
        Evento gratuito con cupos. Usaremos tus datos solo para gestionar tu asistencia.
      </p>
    </form>
  )
}
