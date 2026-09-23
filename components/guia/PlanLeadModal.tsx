'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { createLead, type DoctorPlan, type Specialty } from '@/lib/api-guia'

interface Props {
  plan: DoctorPlan
  planLabel: string
  specialties: Specialty[]
  onClose: () => void
}

const SIGNUP_URL = '/api/auth-medico/login?returnTo=/mi-cuenta'
const inputClass =
  'w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30'

/**
 * Captura de lead al elegir plan (pedido del cliente, 2026-07-21).
 *
 * Por qué ANTES de Auth0: el dato del médico queda guardado aunque abandone el
 * registro. Antes, si no terminaba el alta en Auth0, se perdía entero y el
 * equipo de ventas no tenía a quién llamar.
 *
 * Todos los campos llevan `name` + `autoComplete` estándar para que el navegador
 * autocomplete de una (pedido explícito del cliente).
 */
export default function PlanLeadModal({ plan, planLabel, specialties, onClose }: Props) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', specialtyId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const validate = () => {
    const e: Record<string, string> = {}
    if (form.firstName.trim().length < 2) e.firstName = 'Ingresa tu nombre'
    if (form.lastName.trim().length < 2) e.lastName = 'Ingresa tu apellido'
    if (form.phone.replace(/\D/g, '').length < 8) e.phone = 'Ingresa un teléfono válido'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Ingresa un correo válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const lead = await createLead({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        specialtyId: form.specialtyId || undefined,
        interestPlan: plan,
      })
      // Cookie legible por el server component de /mi-cuenta, que precarga el
      // wizard. 30 min alcanza de sobra para pasar por Auth0.
      document.cookie = `rm_lead=${lead.id}; path=/; max-age=1800; SameSite=Lax`
      window.location.href = SIGNUP_URL
    } catch (err) {
      setSaving(false)
      toast.error((err as Error).message || 'No pudimos guardar tus datos, intenta de nuevo')
    }
  }

  const field = (key: keyof typeof form) =>
    errors[key] ? `${inputClass} !border-red-400` : inputClass

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
              Plan {planLabel}
            </p>
            <h2 id="lead-title" className="font-display font-bold text-xl text-[var(--color-text-primary)] mt-0.5">
              Déjanos tus datos
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Son 30 segundos. Después creas tu cuenta y ya queda todo cargado.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lead-first" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Nombre *
              </label>
              <input
                ref={firstRef}
                id="lead-first"
                name="given-name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className={field('firstName')}
              />
              {errors.firstName && <p className="text-[11px] text-red-600 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lead-last" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Apellido *
              </label>
              <input
                id="lead-last"
                name="family-name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className={field('lastName')}
              />
              {errors.lastName && <p className="text-[11px] text-red-600 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="lead-phone" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Teléfono de contacto *
            </label>
            <input
              id="lead-phone"
              name="tel"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 809..."
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={field('phone')}
            />
            {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="lead-email" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Correo electrónico *
            </label>
            <input
              id="lead-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={field('email')}
            />
            {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="lead-specialty" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Especialidad
            </label>
            <select
              id="lead-specialty"
              name="specialty"
              value={form.specialtyId}
              onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
              className={inputClass}
            >
              <option value="">Selecciona tu especialidad</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-1 px-5 py-3 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold text-[var(--color-primary,#001450)] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Continuar'}
            {!saving && <ArrowRight size={15} strokeWidth={2.2} />}
          </button>
          <p className="text-[11px] text-[var(--color-text-muted)] text-center">
            En el siguiente paso creas tu cuenta con Google o con email.
          </p>
        </form>
      </div>
    </div>
  )
}
