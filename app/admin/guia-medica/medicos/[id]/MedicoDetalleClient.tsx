'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, BadgeCheck, Link2, Copy, Loader2, Plus, Trash2, CheckCircle2, Circle, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import DoctorForm from '@/components/admin/guia/DoctorForm'
import {
  updateDoctor, setDoctorStatus, setDoctorPlan, setDoctorVerification,
  createDoctorClaimToken, addDoctorBenefit, updateDoctorBenefit, removeDoctorBenefit,
  DOCTOR_STATUS_LABELS, BENEFIT_LABELS,
  type Doctor, type DoctorInput, type DoctorStatus, type Specialty, type Clinic,
  type Insurance, type BenefitType,
} from '@/lib/api-guia'

interface Props {
  initialDoctor: Doctor
  specialties: Specialty[]
  clinics: Clinic[]
  insurances: Insurance[]
  token: string
}

const panelClass = 'bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 space-y-3'
const STATUS_OPTIONS: DoctorStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'INACTIVE']
const BENEFIT_TYPES: BenefitType[] = ['REVISTA_DIGITAL', 'REVISTA_IMPRESA', 'FOTOGRAFIA', 'VIDEO', 'PODCAST', 'EVENTO']

export default function MedicoDetalleClient({ initialDoctor, specialties, clinics, insurances, token }: Props) {
  const router = useRouter()
  const [doctor, setDoctor] = useState(initialDoctor)
  const [busy, setBusy] = useState(false)
  const [claimUrl, setClaimUrl] = useState<string | null>(null)
  const [newBenefitType, setNewBenefitType] = useState<BenefitType>('FOTOGRAFIA')

  const refresh = () => router.refresh()

  // ─── Edición de datos ───

  const handleUpdate = async (data: DoctorInput) => {
    setBusy(true)
    const toastId = toast.loading('Guardando cambios...')
    try {
      const updated = await updateDoctor(doctor.id, data, token)
      setDoctor((prev) => ({ ...prev, ...updated }))
      toast.success('Cambios guardados — páginas públicas revalidadas', { id: toastId })
      refresh()
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setBusy(false)
    }
  }

  // ─── Estado ───

  const handleStatus = async (status: DoctorStatus) => {
    if (status === doctor.status) return
    const confirmMsg =
      status === 'PUBLISHED'
        ? `¿Publicar este perfil? Quedará visible en la guía y entrará al sitemap.${
            doctor.email ? ` Se le enviará un correo de bienvenida a ${doctor.email}.` : ' (Sin email cargado: no recibirá aviso.)'
          }`
        : status === 'INACTIVE'
          ? '¿Desactivar este perfil? Su página devolverá 404 y saldrá del sitemap.'
          : `¿Cambiar el estado a ${DOCTOR_STATUS_LABELS[status]}?`
    toast.warning(confirmMsg, {
      action: {
        label: 'Confirmar',
        onClick: async () => {
          const toastId = toast.loading('Cambiando estado...')
          try {
            const updated = await setDoctorStatus(doctor.id, status, token)
            setDoctor((prev) => ({ ...prev, status: updated.status }))
            toast.success(`Estado: ${DOCTOR_STATUS_LABELS[updated.status]}`, { id: toastId })
            refresh()
          } catch (err) {
            toast.error((err as Error).message, { id: toastId })
          }
        },
      },
    })
  }

  // ─── Plan ───

  const handlePlanToggle = async () => {
    const newPlan = doctor.plan === 'PREMIUM' ? 'BASIC' : 'PREMIUM'
    const toastId = toast.loading('Actualizando plan...')
    try {
      const updated = await setDoctorPlan(doctor.id, newPlan, doctor.planNotes ?? undefined, token)
      setDoctor((prev) => ({ ...prev, plan: updated.plan }))
      toast.success(`Plan: ${updated.plan}`, { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    }
  }

  const handlePlanNotes = async (planNotes: string) => {
    try {
      await setDoctorPlan(doctor.id, doctor.plan, planNotes, token)
      setDoctor((prev) => ({ ...prev, planNotes }))
      toast.success('Notas de plan guardadas')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // ─── Verificación ───

  const handleVerification = async () => {
    const newValue = !doctor.isVerified
    if (newValue && !doctor.exequatur) {
      toast.error('Carga el exequátur antes de verificar — el badge significa "exequátur verificado"')
      return
    }
    const toastId = toast.loading(newValue ? 'Activando badge...' : 'Quitando badge...')
    try {
      const updated = await setDoctorVerification(doctor.id, newValue, undefined, token)
      setDoctor((prev) => ({ ...prev, isVerified: updated.isVerified }))
      toast.success(newValue ? 'Badge ✓ Verificado activado' : 'Badge quitado', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    }
  }

  // ─── Claim token ───

  const handleClaimToken = async () => {
    const toastId = toast.loading('Generando link de invitación...')
    try {
      const claim = await createDoctorClaimToken(doctor.id, token)
      setClaimUrl(claim.url ?? null)
      toast.success('Link generado — vence en 14 días', { id: toastId })
      refresh()
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    }
  }

  const copyClaim = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Link copiado — pegalo en WhatsApp')
  }

  // ─── Beneficios ───

  const handleAddBenefit = async () => {
    const toastId = toast.loading('Agregando beneficio...')
    try {
      const benefit = await addDoctorBenefit(doctor.id, { type: newBenefitType }, token)
      setDoctor((prev) => ({ ...prev, benefits: [benefit, ...(prev.benefits ?? [])] }))
      toast.success('Beneficio agregado', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    }
  }

  const handleToggleDelivered = async (benefitId: string, delivered: boolean) => {
    try {
      const updated = await updateDoctorBenefit(
        doctor.id, benefitId,
        { deliveredAt: delivered ? new Date().toISOString() : null },
        token,
      )
      setDoctor((prev) => ({
        ...prev,
        benefits: prev.benefits?.map((b) => (b.id === benefitId ? { ...b, ...updated } : b)),
      }))
      toast.success(delivered ? 'Marcado como entregado' : 'Marcado como pendiente')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleRemoveBenefit = async (benefitId: string) => {
    try {
      await removeDoctorBenefit(doctor.id, benefitId, token)
      setDoctor((prev) => ({ ...prev, benefits: prev.benefits?.filter((b) => b.id !== benefitId) }))
      toast.success('Beneficio eliminado')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const activeTokens = doctor.claimTokens?.filter((t) => !t.usedAt && new Date(t.expiresAt) > new Date()) ?? []

  return (
    <div className="p-6 max-w-6xl">
      <Link
        href="/admin/guia-medica/medicos"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-primary mb-3"
      >
        <ArrowLeft size={13} /> Volver a médicos
      </Link>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          {doctor.title} {doctor.firstName} {doctor.lastName}
          {doctor.isVerified && <BadgeCheck size={20} className="text-primary" />}
        </h1>
        <span className="text-xs text-[var(--color-text-muted)]">/medico/{doctor.slug}</span>
        {doctor.status === 'PUBLISHED' && (
          <a
            href={`/medico/${doctor.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver perfil público <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Columna principal: form de edición ─── */}
        <div className="lg:col-span-2">
          <DoctorForm
            specialties={specialties}
            clinics={clinics}
            insurances={insurances}
            initial={doctor}
            submitLabel="Guardar cambios"
            busy={busy}
            token={token}
            onSubmit={handleUpdate}
          />
        </div>

        {/* ─── Columna lateral: estado, plan, verificación, invitación, beneficios ─── */}
        <div className="space-y-4">
          {/* Estado */}
          <div className={panelClass}>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Estado</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    doctor.status === s
                      ? 'bg-primary text-white border-primary'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
                  }`}
                >
                  {DOCTOR_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {doctor.status === 'PENDING' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                Pendiente de aprobación — publícalo cuando hayas revisado los datos.
              </p>
            )}
            {doctor.status !== 'PUBLISHED' && (
              <p className="text-[11px] text-[var(--color-primary)] bg-[var(--color-primary-pale,#e8edf8)] rounded-lg px-2.5 py-1.5">
                {doctor.email
                  ? <>Al publicarlo se le enviará un correo de bienvenida a <strong>{doctor.email}</strong>.</>
                  : <>Sin email cargado: no recibirá correo de bienvenida al publicarlo.</>}
              </p>
            )}
          </div>

          {/* Verificación */}
          <div className={panelClass}>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Verificación</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Exequátur: {doctor.exequatur ? <strong>{doctor.exequatur}</strong> : <em>sin cargar</em>}
            </p>
            <button
              onClick={handleVerification}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                doctor.isVerified
                  ? 'bg-primary-pale text-primary border-primary/30'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
              }`}
            >
              <BadgeCheck size={16} />
              {doctor.isVerified ? 'Verificado — quitar badge' : 'Activar badge ✓ Verificado'}
            </button>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              El badge significa &ldquo;exequátur verificado por Reporte Médico&rdquo;. El número no se muestra públicamente.
            </p>
          </div>

          {/* Plan */}
          <div className={panelClass}>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Plan</h3>
            <button
              onClick={handlePlanToggle}
              className={`w-full px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                doctor.plan === 'PREMIUM'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-amber-400'
              }`}
            >
              {doctor.plan === 'PREMIUM' ? '★ PREMIUM' : 'BASIC — pasar a Premium'}
            </button>
            <textarea
              defaultValue={doctor.planNotes ?? ''}
              onBlur={(e) => { if (e.target.value !== (doctor.planNotes ?? '')) handlePlanNotes(e.target.value) }}
              rows={2}
              placeholder="Notas de cobro/condiciones (solo admin)"
              className="w-full px-2.5 py-1.5 border border-[var(--color-border)] rounded-lg text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Los PREMIUM aparecen primero en los resultados de búsqueda. El cobro es manual y externo.
            </p>
          </div>

          {/* Link de invitación */}
          {!doctor.auth0Sub && (
            <div className={panelClass}>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                Reclamo de cuenta
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Este perfil aún no fue reclamado. Genera el link y envíalo por WhatsApp para que el médico tome control de su perfil.
              </p>
              <button
                onClick={handleClaimToken}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Link2 size={15} /> Generar link de invitación
              </button>
              {claimUrl && (
                <button
                  onClick={() => copyClaim(claimUrl)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 bg-[var(--color-surface-2)] rounded-lg text-[11px] text-[var(--color-text-secondary)] hover:text-primary break-all text-left"
                >
                  <Copy size={13} className="shrink-0" /> {claimUrl}
                </button>
              )}
              {activeTokens.length > 0 && !claimUrl && (
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {activeTokens.length} link(s) vigente(s) sin usar — generar uno nuevo no invalida los anteriores.
                </p>
              )}
            </div>
          )}
          {doctor.auth0Sub && (
            <div className={panelClass}>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Cuenta</h3>
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                ✓ Perfil reclamado — el médico gestiona sus datos desde su área privada.
              </p>
            </div>
          )}

          {/* Beneficios premium */}
          {doctor.plan === 'PREMIUM' && (
            <div className={panelClass}>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                Beneficios entregados
              </h3>
              <div className="flex gap-1.5">
                <select
                  value={newBenefitType}
                  onChange={(e) => setNewBenefitType(e.target.value as BenefitType)}
                  className="flex-1 px-2 py-1.5 border border-[var(--color-border)] rounded-lg text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                >
                  {BENEFIT_TYPES.map((t) => (
                    <option key={t} value={t}>{BENEFIT_LABELS[t]}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddBenefit}
                  className="p-1.5 bg-primary text-white rounded-lg hover:opacity-90"
                  title="Agregar beneficio"
                >
                  <Plus size={15} />
                </button>
              </div>
              <ul className="space-y-1.5">
                {(doctor.benefits ?? []).map((b) => (
                  <li key={b.id} className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => handleToggleDelivered(b.id, !b.deliveredAt)}
                      className={b.deliveredAt ? 'text-emerald-600' : 'text-[var(--color-text-muted)]'}
                      title={b.deliveredAt ? 'Entregado — marcar pendiente' : 'Marcar como entregado'}
                    >
                      {b.deliveredAt ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                    </button>
                    <span className={`flex-1 ${b.deliveredAt ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                      {BENEFIT_LABELS[b.type]}
                      {b.deliveredAt && (
                        <span className="text-[var(--color-text-muted)]"> · {new Date(b.deliveredAt).toLocaleDateString('es-DO')}</span>
                      )}
                    </span>
                    <button onClick={() => handleRemoveBenefit(b.id)} className="text-[var(--color-text-muted)] hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
                {(doctor.benefits ?? []).length === 0 && (
                  <li className="text-[11px] text-[var(--color-text-muted)]">Sin beneficios registrados</li>
                )}
              </ul>
            </div>
          )}

          {/* Métricas rápidas */}
          <div className={panelClass}>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Actividad</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{doctor._count?.whatsappClicks ?? 0}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">Clics WhatsApp</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{doctor._count?.sessions ?? 0}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">Sesiones</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{doctor._count?.articles ?? 0}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">Artículos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
