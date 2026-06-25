'use client'

import { useState, useRef, type ReactNode } from 'react'
import NextImage from 'next/image'
import { Plus, X, GripVertical, Monitor, Upload, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import type { Doctor, Specialty, Clinic, Insurance } from '@/lib/api-guia'

export interface ProfileFormData {
  title?: string
  firstName: string
  lastName: string
  exequatur?: string
  languages: string[]
  bio?: string
  telehealth: boolean
  photoUrl?: string
  specialtyIds: string[]
  clinics: { clinicId: string; schedule?: string }[]
  clinicSuggestions: { rawName: string; schedule?: string }[]
  insuranceIds: string[]
  phonePublic?: string
  phoneOffice?: string
  instagram?: string
}

interface Props {
  initial: Doctor | null
  /** Foto de Auth0/Google: default hasta que el médico suba la suya */
  defaultPhoto?: string | null
  specialties: Specialty[]
  clinics: Clinic[]
  insurances: Insurance[]
  saving: boolean
  /**
   * Render-prop de los botones de acción. Recibe `getData` (datos actuales) y
   * `validate` (marca los campos obligatorios y devuelve si está OK para guardar).
   */
  renderActions: (getData: () => ProfileFormData, validate: () => boolean) => ReactNode
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#001450)]/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1'
const sectionClass = 'bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4'
const COMMON_LANGUAGES = ['Español', 'Inglés', 'Francés', 'Criollo haitiano', 'Italiano', 'Portugués']

export default function DoctorProfileForm({
  initial, defaultPhoto, specialties, clinics, insurances, saving, renderActions,
}: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? 'Dr.',
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    exequatur: initial?.exequatur ?? '',
    bio: initial?.bio ?? '',
    telehealth: initial?.telehealth ?? false,
    phonePublic: initial?.phonePublic ?? '',
    phoneOffice: initial?.phoneOffice ?? '',
    instagram: initial?.instagram ?? '',
  })
  // Foto: la cargada por el médico, o la de Auth0/Google como default
  const [photoUrl, setPhotoUrl] = useState<string>(initial?.photoUrl ?? defaultPhoto ?? '')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return
    setUploadingPhoto(true)
    const toastId = toast.loading('Subiendo tu foto...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/mi-cuenta/foto', { method: 'POST', body: fd })
      const body = await res.json()
      if (!res.ok || !body.url) throw new Error(body.message || 'No se pudo subir la foto')
      setPhotoUrl(body.url)
      toast.success('Foto actualizada — recuerda guardar', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setUploadingPhoto(false)
    }
  }
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ['Español'])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    initial?.specialties?.map((s) => s.specialty.id) ?? [],
  )
  const [clinicRows, setClinicRows] = useState<{ clinicId: string; schedule: string }[]>(
    initial?.clinics?.map((c) => ({ clinicId: c.clinic.id, schedule: c.schedule ?? '' })) ?? [],
  )
  // Clínicas fuera del catálogo, escritas en texto libre (las normaliza el admin)
  const [suggestionRows, setSuggestionRows] = useState<{ rawName: string; schedule: string }[]>(
    initial?.clinicSuggestions?.map((s) => ({ rawName: s.rawName, schedule: s.schedule ?? '' })) ?? [],
  )
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>(
    initial?.insurances?.map((i) => i.insurance.id) ?? [],
  )

  // Si el perfil ya está publicado y verificado, editar la identidad pausa el sello ✓ (06 §7)
  const verifiedPublished = initial?.status === 'PUBLISHED' && initial?.isVerified

  const toggleSpecialty = (id: string) =>
    setSelectedSpecialties((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  const toggleInsurance = (id: string) =>
    setSelectedInsurances((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  const toggleLanguage = (lang: string) =>
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]))

  const getData = (): ProfileFormData => ({
    title: form.title || undefined,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    exequatur: form.exequatur.trim() || undefined,
    languages,
    bio: form.bio.trim() || undefined,
    telehealth: form.telehealth,
    photoUrl: photoUrl || undefined,
    specialtyIds: selectedSpecialties,
    clinics: clinicRows.filter((r) => r.clinicId).map((r) => ({ clinicId: r.clinicId, schedule: r.schedule.trim() || undefined })),
    clinicSuggestions: suggestionRows
      .filter((r) => r.rawName.trim())
      .map((r) => ({ rawName: r.rawName.trim(), schedule: r.schedule.trim() || undefined })),
    insuranceIds: selectedInsurances,
    phonePublic: form.phonePublic.trim() || undefined,
    phoneOffice: form.phoneOffice.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
  })

  // Validación por campo: los errores aparecen tras el primer intento de guardar
  // y se corrigen en vivo. Solo nombre y apellido son obligatorios.
  const [submitted, setSubmitted] = useState(false)
  const computeErrors = () => {
    const e: { firstName?: string; lastName?: string } = {}
    if (!form.firstName.trim()) e.firstName = 'Ingresa tu nombre'
    if (!form.lastName.trim()) e.lastName = 'Ingresa tu apellido'
    return e
  }
  const errors: { firstName?: string; lastName?: string } = submitted ? computeErrors() : {}
  const fieldClass = (err?: string) => (err ? `${inputClass} !border-red-400` : inputClass)
  const validate = () => {
    setSubmitted(true)
    return Object.keys(computeErrors()).length === 0
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--color-text-muted)]">
        Solo <strong className="text-[var(--color-text-secondary)]">Nombre</strong> y{' '}
        <strong className="text-[var(--color-text-secondary)]">Apellido</strong> son obligatorios (
        <span className="text-red-600">*</span>). Mientras más completes, mejor te encuentran los pacientes.
      </p>
      {/* Datos personales */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Datos personales</h2>

        {/* Foto de perfil */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--color-primary,#001450)] border border-[var(--color-border)] flex items-center justify-center relative shrink-0">
            {photoUrl ? (
              <NextImage src={photoUrl} alt="Tu foto de perfil" fill className="object-cover" sizes="80px" unoptimized={photoUrl.includes('googleusercontent')} />
            ) : (
              <span className="font-display text-xl font-bold text-white">
                {(form.firstName[0] ?? '') + (form.lastName[0] ?? '') || '—'}
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-primary,#001450)] border border-[var(--color-primary,#001450)]/30 rounded-lg hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors disabled:opacity-50"
            >
              {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {photoUrl ? 'Cambiar foto' : 'Subir foto'}
            </button>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              {defaultPhoto && photoUrl === defaultPhoto
                ? 'Estamos usando tu foto de Google. Puedes subir otra.'
                : 'JPG o PNG, preferentemente cuadrada.'}
            </p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Título</label>
            <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass}>
              <option value="Dr.">Dr.</option>
              <option value="Dra.">Dra.</option>
              <option value="">—</option>
            </select>
          </div>
          <div className="col-span-4 sm:col-span-2">
            <label className={labelClass}>Nombre <span className="text-red-600">*</span></label>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={fieldClass(errors.firstName)} autoComplete="given-name" />
            {errors.firstName && <p className="text-[11px] text-red-600 mt-1">{errors.firstName}</p>}
          </div>
          <div className="col-span-3">
            <label className={labelClass}>Apellido <span className="text-red-600">*</span></label>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={fieldClass(errors.lastName)} autoComplete="family-name" />
            {errors.lastName && <p className="text-[11px] text-red-600 mt-1">{errors.lastName}</p>}
          </div>
          <div className="col-span-3">
            <label className={labelClass}>Exequátur</label>
            <input value={form.exequatur} onChange={(e) => setForm({ ...form, exequatur: e.target.value })} className={inputClass} placeholder="Tu matrícula" />
          </div>
          <div className="col-span-3 flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
              <input type="checkbox" checked={form.telehealth} onChange={(e) => setForm({ ...form, telehealth: e.target.checked })} className="w-4 h-4 accent-[var(--color-primary,#001450)]" />
              <Monitor size={14} /> Ofrezco teleconsulta
            </label>
          </div>
        </div>

        {verifiedPublished && (
          <p className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
            <ShieldAlert size={14} className="shrink-0 mt-px" />
            <span>
              Si cambias tu <strong>nombre, título o exequátur</strong>, tu sello ✓ verificado se pausa hasta que nuestro equipo confirme los datos de nuevo. Tu perfil sigue publicado mientras tanto.
            </span>
          </p>
        )}

        <div>
          <label className={labelClass}>Idiomas</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  languages.includes(lang)
                    ? 'bg-[var(--color-primary,#001450)] text-white border-[var(--color-primary,#001450)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Sobre ti — el texto que verán los pacientes (formación, experiencia, enfoque)
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={5}
            className={inputClass}
            placeholder="Ej: Cardiólogo en Santo Domingo con 15 años de experiencia. Egresado de la UASD con subespecialidad en ecocardiografía. Atiendo pacientes adultos con énfasis en hipertensión y prevención cardiovascular..."
          />
          <p className={`text-[11px] mt-1 ${form.bio.length >= 300 ? 'text-[var(--color-primary,#001450)]' : 'text-[var(--color-text-muted)]'}`}>
            {form.bio.length} caracteres{form.bio.length > 0 && form.bio.length < 300 ? ' · recomendado: 300+' : ''}
          </p>
        </div>
      </section>

      {/* Especialidades */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Especialidades <span className="font-normal text-xs text-[var(--color-text-muted)]">— la primera es la principal</span>
        </h2>
        {selectedSpecialties.length > 0 && (
          <ol className="flex flex-wrap gap-1.5">
            {selectedSpecialties.map((id, i) => {
              const sp = specialties.find((s) => s.id === id)
              if (!sp) return null
              return (
                <li key={id} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-[var(--color-primary,#001450)] text-white rounded-full text-xs font-medium">
                  <GripVertical size={11} className="opacity-60" />
                  {i + 1}. {sp.name}
                  <button type="button" onClick={() => toggleSpecialty(id)} className="p-0.5 hover:bg-white/20 rounded-full"><X size={11} /></button>
                </li>
              )
            })}
          </ol>
        )}
        <div className="flex flex-wrap gap-1.5">
          {specialties.filter((s) => !selectedSpecialties.includes(s.id)).map((s) => (
            <button key={s.id} type="button" onClick={() => toggleSpecialty(s.id)} className="px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40 hover:text-[var(--color-primary,#001450)] transition-colors">
              + {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* Dónde atiendo */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Dónde atiendo <span className="font-normal text-xs text-[var(--color-text-muted)]">— clínica + horario de consulta</span>
        </h2>
        {clinicRows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select
              value={row.clinicId}
              onChange={(e) => setClinicRows((prev) => prev.map((r, j) => (j === i ? { ...r, clinicId: e.target.value } : r)))}
              className={`${inputClass} max-w-56`}
            >
              <option value="">Elige una clínica...</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id} disabled={clinicRows.some((r, j) => j !== i && r.clinicId === c.id)}>
                  {c.name} ({c.city?.name})
                </option>
              ))}
            </select>
            <input
              value={row.schedule}
              onChange={(e) => setClinicRows((prev) => prev.map((r, j) => (j === i ? { ...r, schedule: e.target.value } : r)))}
              className={inputClass}
              placeholder="Lunes a viernes 8:00–12:00"
            />
            <button type="button" onClick={() => setClinicRows((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg">
              <X size={15} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setClinicRows((prev) => [...prev, { clinicId: '', schedule: '' }])} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary,#001450)] hover:underline">
          <Plus size={13} /> Agregar clínica del catálogo
        </button>

        {/* Clínica fuera del catálogo: texto libre → el equipo la normaliza al aprobar (07 §14) */}
        <div className="pt-3 mt-1 border-t border-dashed border-[var(--color-border)] space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">
            ¿Tu clínica no está en la lista?
          </p>
          {suggestionRows.map((row, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                value={row.rawName}
                onChange={(e) => setSuggestionRows((prev) => prev.map((r, j) => (j === i ? { ...r, rawName: e.target.value } : r)))}
                className={`${inputClass} max-w-56`}
                placeholder="Nombre de tu clínica"
              />
              <input
                value={row.schedule}
                onChange={(e) => setSuggestionRows((prev) => prev.map((r, j) => (j === i ? { ...r, schedule: e.target.value } : r)))}
                className={inputClass}
                placeholder="Lunes a viernes 8:00–12:00"
              />
              <button type="button" onClick={() => setSuggestionRows((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg">
                <X size={15} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setSuggestionRows((prev) => [...prev, { rawName: '', schedule: '' }])} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary,#001450)] hover:underline">
            <Plus size={13} /> Agregar una clínica que no está en la lista
          </button>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Escríbela tal como se llama. Nuestro equipo la agrega al catálogo y la ubica en el mapa cuando revise tu perfil.
          </p>
        </div>
      </section>

      {/* Seguros */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Seguros (ARS) que acepto <span className="font-normal text-xs text-[var(--color-text-muted)]">— lo primero que mira el paciente</span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {insurances.map((ins) => (
            <button
              key={ins.id}
              type="button"
              onClick={() => toggleInsurance(ins.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedInsurances.includes(ins.id)
                  ? 'bg-[var(--color-primary,#001450)] text-white border-[var(--color-primary,#001450)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40'
              }`}
            >
              {ins.name}
            </button>
          ))}
        </div>
      </section>

      {/* Contacto */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Contacto</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>WhatsApp público <span className="text-[var(--color-text-muted)]">(botón de tu perfil)</span></label>
            <input value={form.phonePublic} onChange={(e) => setForm({ ...form, phonePublic: e.target.value })} className={inputClass} placeholder="+1 809..." autoComplete="tel" />
          </div>
          <div>
            <label className={labelClass}>Teléfono del consultorio</label>
            <input value={form.phoneOffice} onChange={(e) => setForm({ ...form, phoneOffice: e.target.value })} className={inputClass} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Instagram</label>
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputClass} placeholder="@usuario" />
          </div>
        </div>
      </section>

      {renderActions(getData, validate)}
    </div>
  )
}
