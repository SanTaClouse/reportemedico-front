'use client'

import { useState } from 'react'
import { LogOut, BadgeCheck, Clock, Eye, Loader2, Send, Save, FileText } from 'lucide-react'
import { toast } from 'sonner'
import DoctorProfileForm, { type ProfileFormData } from '@/components/guia/DoctorProfileForm'
import type { Doctor, Specialty, Clinic, Insurance } from '@/lib/api-guia'

interface Props {
  userName: string | null
  userEmail: string | null
  userPicture: string | null
  initialDoctor: Doctor | null
  claimCandidate: Doctor | null
  specialties: Specialty[]
  clinics: Clinic[]
  insurances: Insurance[]
}

export default function MiCuentaClient({
  userName, userEmail, userPicture, initialDoctor, claimCandidate, specialties, clinics, insurances,
}: Props) {
  const [doctor, setDoctor] = useState<Doctor | null>(initialDoctor)
  const [candidateDismissed, setCandidateDismissed] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const showCandidate = !doctor && claimCandidate && !candidateDismissed

  const claimByEmail = async () => {
    setClaiming(true)
    const toastId = toast.loading('Vinculando tu perfil...')
    try {
      const res = await fetch('/api/mi-cuenta/claim-email', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || 'No se pudo vincular el perfil')
      setDoctor(body)
      toast.success('¡Perfil vinculado a tu cuenta!', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setClaiming(false)
    }
  }

  const status = doctor?.status ?? null
  const isEditable = !doctor || status === 'DRAFT' || status === 'PUBLISHED' || status === 'INACTIVE'
  const canSubmit = !doctor || status === 'DRAFT'

  const saveProfile = async (data: ProfileFormData): Promise<boolean> => {
    setSaving(true)
    const toastId = toast.loading('Guardando tu perfil...')
    try {
      const res = await fetch('/api/mi-cuenta/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || 'No se pudo guardar')
      setDoctor(body)
      toast.success('Perfil guardado', { id: toastId })
      return true
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
      return false
    } finally {
      setSaving(false)
    }
  }

  const submitForReview = async () => {
    setSubmitting(true)
    const toastId = toast.loading('Enviando a revisión...')
    try {
      const res = await fetch('/api/mi-cuenta/submit', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || 'No se pudo enviar')
      setDoctor(body)
      toast.success('¡Perfil enviado! El equipo de Reporte Médico lo revisará pronto.', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      {/* Encabezado de cuenta */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {userPicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userPicture} alt={userName ?? 'Médico'} className="w-11 h-11 rounded-full" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[var(--color-primary,#001450)] flex items-center justify-center text-white font-display font-bold">
              {(userName?.[0] ?? userEmail?.[0] ?? 'M').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display font-bold text-[var(--color-text-primary)] leading-tight">Mi cuenta</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{userEmail}</p>
          </div>
        </div>
        <a
          href="/api/auth-medico/logout"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
        >
          <LogOut size={15} /> Salir
        </a>
      </div>

      {/* Banner de estado */}
      <StatusBanner doctor={doctor} />

      {/* B2: encontramos un perfil sin dueño con tu email */}
      {showCandidate && claimCandidate ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-primary,#001450)]/30 p-6">
          <p className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-1">
            Encontramos tu perfil en Reporte Médico
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Ya existe un perfil a nombre de{' '}
            <strong>
              {claimCandidate.title} {claimCandidate.firstName} {claimCandidate.lastName}
            </strong>
            {claimCandidate.specialties?.[0] && <> ({claimCandidate.specialties[0].specialty.name})</>}. ¿Eres tú?
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={claimByEmail}
              disabled={claiming}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {claiming ? <Loader2 size={16} className="animate-spin" /> : null}
              Sí, soy yo
            </button>
            <button
              onClick={() => setCandidateDismissed(true)}
              disabled={claiming}
              className="px-5 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40 transition-colors"
            >
              No, crear un perfil nuevo
            </button>
          </div>
        </div>
      ) : status === 'PENDING' ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 text-center">
          <Clock size={28} className="mx-auto text-amber-500 mb-3" strokeWidth={1.5} />
          <p className="font-semibold text-[var(--color-text-primary)]">Tu perfil está en revisión</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            El equipo de Reporte Médico está revisando tus datos. Te avisaremos cuando esté publicado.
          </p>
        </div>
      ) : (
        <>
          {!doctor && (
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Completa tu perfil profesional. Cuando termines, envíalo a revisión y nuestro equipo lo
              publicará en la Guía Médica.
            </p>
          )}

          {isEditable && (
            <DoctorProfileForm
              initial={doctor}
              defaultPhoto={userPicture}
              specialties={specialties}
              clinics={clinics}
              insurances={insurances}
              saving={saving}
              renderActions={(getData) => (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => saveProfile(getData())}
                    disabled={saving || submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--color-primary,#001450)]/30 text-[var(--color-primary,#001450)] rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar {canSubmit ? 'borrador' : 'cambios'}
                  </button>

                  {canSubmit && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await saveProfile(getData())
                        if (ok) await submitForReview()
                      }}
                      disabled={saving || submitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Enviar a revisión
                    </button>
                  )}
                </div>
              )}
            />
          )}
        </>
      )}

      {/* Acceso a artículos (cuando ya hay perfil) */}
      {doctor && (
        <a
          href="/mi-cuenta/articulos"
          className="mt-5 flex items-center justify-between gap-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary,#001450)]/40 transition-colors"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
            <FileText size={17} className="text-[var(--color-primary,#001450)]" /> Enviar artículos a la revista
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">Sin recargar tus datos →</span>
        </a>
      )}
    </div>
  )
}

function StatusBanner({ doctor }: { doctor: Doctor | null }) {
  if (!doctor) return null
  const map = {
    DRAFT: { cls: 'border-gray-200 bg-gray-50 text-gray-700', icon: <Save size={15} />, text: 'Borrador — todavía no enviado a revisión.' },
    PENDING: { cls: 'border-amber-200 bg-amber-50 text-amber-800', icon: <Clock size={15} />, text: 'En revisión.' },
    PUBLISHED: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: <BadgeCheck size={15} />, text: 'Tu perfil está publicado.' },
    INACTIVE: { cls: 'border-red-200 bg-red-50 text-red-700', icon: null, text: 'Tu perfil no está visible. Contacta a Reporte Médico.' },
  } as const
  const s = map[doctor.status]
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 mb-5 text-sm ${s.cls}`}>
      <span className="inline-flex items-center gap-2 font-medium">{s.icon} {s.text}</span>
      {doctor.status === 'PUBLISHED' && (
        <a
          href={`/medico/${doctor.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold hover:underline shrink-0"
        >
          <Eye size={13} /> Ver mi perfil
        </a>
      )}
    </div>
  )
}
