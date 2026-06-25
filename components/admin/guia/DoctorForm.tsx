'use client'

import { useState, useRef, useEffect } from 'react'
import NextImage from 'next/image'
import dynamic from 'next/dynamic'
import { Loader2, Check, Plus, X, Upload, GripVertical, Crop, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  uploadFotoMedico,
  type Doctor, type DoctorInput, type Specialty, type City, type Clinic, type Insurance,
} from '@/lib/api-guia'
import { cldUrl, baseImageUrl, setImageCrop, type CropRegion } from '@/lib/cloudinary'
import { useUnsavedGuard } from '@/lib/hooks/useUnsavedGuard'
import { loadDraft, saveDraft, clearDraft } from '@/lib/draft'
import { ClinicFormModal } from './ClinicForm'

// Borrador del alta de médico (solo modo creación) — se guarda en el navegador
// para no perder lo cargado si el admin sale a mitad del proceso (A5/A6).
const DRAFT_KEY = 'rm:guia:nuevo-medico-draft'
interface DoctorDraft {
  form: {
    title: string; firstName: string; lastName: string; exequatur: string; email: string
    phonePublic: string; phoneOffice: string; phoneInternal: string; instagram: string
    bio: string; photoUrl: string; videoUrl: string; telehealth: boolean
  }
  languages: string[]
  selectedSpecialties: string[]
  clinicRows: { clinicId: string; schedule: string }[]
  selectedInsurances: string[]
}

const ImageCropModal = dynamic(() => import('@/components/admin/ImageCropModal'), { ssr: false })

interface Props {
  specialties: Specialty[]
  clinics: Clinic[]
  cities: City[]
  insurances: Insurance[]
  initial?: Doctor
  submitLabel: string
  busy: boolean
  token: string
  onSubmit: (data: DoctorInput) => void
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1'
const sectionClass = 'bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4'

const COMMON_LANGUAGES = ['Español', 'Inglés', 'Francés', 'Criollo haitiano', 'Italiano', 'Portugués']

export default function DoctorForm({
  specialties, clinics, cities, insurances, initial, submitLabel, busy, token, onSubmit,
}: Props) {
  // Catálogos editables en vivo: el modal de "crear clínica" agrega opciones sin recargar.
  const [clinicOptions, setClinicOptions] = useState<Clinic[]>(clinics)
  const [cityOptions, setCityOptions] = useState<City[]>(cities)
  const [showClinicModal, setShowClinicModal] = useState(false)
  const [form, setForm] = useState({
    title: initial?.title ?? 'Dr.',
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    exequatur: initial?.exequatur ?? '',
    email: initial?.email ?? '',
    phonePublic: initial?.phonePublic ?? '',
    phoneOffice: initial?.phoneOffice ?? '',
    phoneInternal: initial?.phoneInternal ?? '',
    instagram: initial?.instagram ?? '',
    bio: initial?.bio ?? '',
    photoUrl: initial?.photoUrl ?? '',
    videoUrl: initial?.videoUrl ?? '',
    telehealth: initial?.telehealth ?? false,
  })
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ['Español'])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    initial?.specialties?.map((s) => s.specialty.id) ?? [],
  )
  const [clinicRows, setClinicRows] = useState<{ clinicId: string; schedule: string }[]>(
    initial?.clinics?.map((c) => ({ clinicId: c.clinic.id, schedule: c.schedule ?? '' })) ?? [],
  )
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>(
    initial?.insurances?.map((i) => i.insurance.id) ?? [],
  )
  const [uploading, setUploading] = useState(false)
  const [cropping, setCropping] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Validación por campo: los errores aparecen recién tras el primer intento de
  // envío y se actualizan en vivo a medida que el usuario corrige.
  const [submitted, setSubmitted] = useState(false)
  const validate = () => {
    const e: { firstName?: string; lastName?: string; email?: string } = {}
    if (!form.firstName.trim()) e.firstName = 'Ingresa el nombre'
    if (!form.lastName.trim()) e.lastName = 'Ingresa el apellido'
    const email = form.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Revisa el formato del email'
    return e
  }
  const errors: { firstName?: string; lastName?: string; email?: string } = submitted ? validate() : {}
  const fieldClass = (err?: string) => (err ? `${inputClass} !border-red-400` : inputClass)

  // ─── Borrador + freno al salir (solo en el alta; A5/A6) ───
  const isCreate = !initial
  const snapshot = JSON.stringify({ form, languages, selectedSpecialties, clinicRows, selectedInsurances })
  const baselineRef = useRef<string | null>(null)
  if (baselineRef.current === null) baselineRef.current = snapshot
  const dirty = snapshot !== baselineRef.current
  useUnsavedGuard(isCreate && dirty)

  const [draftRestore, setDraftRestore] = useState<DoctorDraft | null>(null)
  // Al montar el alta: si hay un borrador con contenido real, ofrecemos recuperarlo.
  useEffect(() => {
    if (!isCreate) return
    const d = loadDraft<DoctorDraft>(DRAFT_KEY)
    if (d && (d.form?.firstName || d.form?.lastName || d.form?.bio || d.selectedSpecialties?.length || d.clinicRows?.length)) {
      setDraftRestore(d)
    }
  }, [isCreate])
  // Autosave del borrador en cada cambio (solo alta y solo si tocó algo).
  useEffect(() => {
    if (isCreate && dirty) saveDraft<DoctorDraft>(DRAFT_KEY, { form, languages, selectedSpecialties, clinicRows, selectedInsurances })
  }, [snapshot, isCreate, dirty, form, languages, selectedSpecialties, clinicRows, selectedInsurances])

  const applyDraft = (d: DoctorDraft) => {
    setForm(d.form)
    setLanguages(d.languages ?? ['Español'])
    setSelectedSpecialties(d.selectedSpecialties ?? [])
    setClinicRows(d.clinicRows ?? [])
    setSelectedInsurances(d.selectedInsurances ?? [])
    setDraftRestore(null)
    toast.success('Borrador recuperado')
  }

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const toggleInsurance = (id: string) => {
    setSelectedInsurances((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    const toastId = toast.loading('Subiendo foto...')
    try {
      const { url } = await uploadFotoMedico(file, token)
      setForm((f) => ({ ...f, photoUrl: url }))
      toast.success('Foto subida', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  // Clínica recién creada desde el modal: se agrega al catálogo en vivo y se
  // autoselecciona (rellena una fila vacía o agrega una nueva).
  const handleClinicCreated = (clinic: Clinic) => {
    setClinicOptions((prev) => [...prev, clinic].sort((a, b) => a.name.localeCompare(b.name)))
    setClinicRows((prev) => {
      const emptyIdx = prev.findIndex((r) => !r.clinicId)
      if (emptyIdx >= 0) return prev.map((r, i) => (i === emptyIdx ? { ...r, clinicId: clinic.id } : r))
      return [...prev, { clinicId: clinic.id, schedule: '' }]
    })
    setShowClinicModal(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(validate()).length) {
      toast.error('Revisa los campos marcados en rojo')
      return
    }
    const data: DoctorInput = {
      title: form.title || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      exequatur: form.exequatur.trim() || undefined,
      email: form.email.trim() || undefined,
      phonePublic: form.phonePublic.trim() || undefined,
      phoneOffice: form.phoneOffice.trim() || undefined,
      phoneInternal: form.phoneInternal.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
      bio: form.bio.trim() || undefined,
      photoUrl: form.photoUrl || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      telehealth: form.telehealth,
      languages,
      specialtyIds: selectedSpecialties,
      clinics: clinicRows
        .filter((r) => r.clinicId)
        .map((r) => ({ clinicId: r.clinicId, schedule: r.schedule.trim() || undefined })),
      insuranceIds: selectedInsurances,
    }
    if (isCreate) clearDraft(DRAFT_KEY) // se envió: el borrador ya cumplió su función
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-xs text-[var(--color-text-muted)]">
        Solo <strong className="text-[var(--color-text-secondary)]">Nombre</strong> y{' '}
        <strong className="text-[var(--color-text-secondary)]">Apellido</strong> son obligatorios (marcados con{' '}
        <span className="text-red-600">*</span>). El resto es opcional y lo puedes completar después.
      </p>

      {draftRestore && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <span className="inline-flex items-center gap-2">
            <RotateCcw size={14} className="shrink-0" />
            Tienes un borrador sin terminar
            {(draftRestore.form?.firstName || draftRestore.form?.lastName)
              ? ` de ${`${draftRestore.form.firstName ?? ''} ${draftRestore.form.lastName ?? ''}`.trim()}`
              : ''}.
          </span>
          <span className="flex gap-3 shrink-0">
            <button type="button" onClick={() => applyDraft(draftRestore)} className="font-semibold hover:underline">Restaurar</button>
            <button type="button" onClick={() => { clearDraft(DRAFT_KEY); setDraftRestore(null) }} className="text-amber-700/70 hover:text-amber-900">Descartar</button>
          </span>
        </div>
      )}

      {/* ─── Datos personales ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Datos personales</h2>

        <div className="flex items-start gap-5">
          {/* Foto */}
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center relative">
              {form.photoUrl ? (
                <NextImage src={cldUrl(form.photoUrl, { w: 192, h: 192 })} alt="Foto del médico" fill className="object-cover" sizes="96px" />
              ) : (
                <span className="font-display text-xl text-[var(--color-text-muted)]">
                  {(form.firstName[0] ?? '') + (form.lastName[0] ?? '') || '—'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-2 w-24 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary-pale transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Foto
            </button>
            {form.photoUrl && (
              <button
                type="button"
                onClick={() => setCropping(true)}
                className="mt-1.5 w-24 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:border-primary hover:text-primary transition-colors"
                title="Recuadrar la foto manualmente"
              >
                <Crop size={12} /> Recuadrar
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
          </div>

          <div className="flex-1 grid grid-cols-6 gap-3">
            <div className="col-span-1">
              <label className={labelClass}>Título</label>
              <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass}>
                <option value="Dr.">Dr.</option>
                <option value="Dra.">Dra.</option>
                <option value="">—</option>
              </select>
            </div>
            <div className="col-span-3 sm:col-span-2">
              <label className={labelClass}>Nombre <span className="text-red-600">*</span></label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={fieldClass(errors.firstName)} />
              {errors.firstName && <p className="text-[11px] text-red-600 mt-1">{errors.firstName}</p>}
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className={labelClass}>Apellido <span className="text-red-600">*</span></label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={fieldClass(errors.lastName)} />
              {errors.lastName && <p className="text-[11px] text-red-600 mt-1">{errors.lastName}</p>}
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Exequátur</label>
              <input value={form.exequatur} onChange={(e) => setForm({ ...form, exequatur: e.target.value })} className={inputClass} placeholder="Matrícula RD" />
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Idiomas</label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() =>
                      setLanguages((prev) =>
                        prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
                      )
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      languages.includes(lang)
                        ? 'bg-primary text-white border-primary'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Bio — &ldquo;Sobre el/la doctor(a)&rdquo; · contenido único SEO del perfil (300–600 caracteres recomendado)
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={5}
            className={inputClass}
            placeholder="Ej: Cardióloga en Santo Domingo con 15 años de experiencia. Egresada de la UASD con subespecialidad en ecocardiografía en México. Atiende pacientes adultos con énfasis en hipertensión y prevención cardiovascular..."
          />
          <p className={`text-[11px] mt-1 ${form.bio.length >= 300 ? 'text-primary' : 'text-[var(--color-text-muted)]'}`}>
            {form.bio.length} caracteres {form.bio.length < 300 && form.bio.length > 0 ? '· mínimo recomendado: 300' : ''}
          </p>
        </div>

        <div>
          <label className={labelClass}>Video de presentación (beneficio premium — URL YouTube o Cloudinary)</label>
          <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className={inputClass} placeholder="https://..." />
        </div>
      </section>

      {/* ─── Contacto ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Contacto</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>WhatsApp público (botón CTA del perfil)</label>
            <input value={form.phonePublic} onChange={(e) => setForm({ ...form, phonePublic: e.target.value })} className={inputClass} placeholder="+1809..." />
          </div>
          <div>
            <label className={labelClass}>Teléfono consultorio</label>
            <input value={form.phoneOffice} onChange={(e) => setForm({ ...form, phoneOffice: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email <span className="text-[var(--color-text-muted)]">(opcional · no se muestra públicamente)</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass(errors.email)} />
            {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputClass} placeholder="@usuario" />
          </div>
          <div>
            <label className={labelClass}>Teléfono interno <span className="text-[var(--color-text-muted)]">(solo admin)</span></label>
            <input value={form.phoneInternal} onChange={(e) => setForm({ ...form, phoneInternal: e.target.value })} className={inputClass} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={form.telehealth}
                onChange={(e) => setForm({ ...form, telehealth: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-primary)]"
              />
              💻 Ofrece teleconsulta
            </label>
          </div>
        </div>
      </section>

      {/* ─── Especialidades ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Especialidades <span className="font-normal text-xs text-[var(--color-text-muted)]">— la primera es la principal (define el SEO del perfil)</span>
        </h2>
        {selectedSpecialties.length > 0 && (
          <ol className="flex flex-wrap gap-1.5">
            {selectedSpecialties.map((id, i) => {
              const sp = specialties.find((s) => s.id === id)
              if (!sp) return null
              return (
                <li key={id} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-primary text-white rounded-full text-xs font-medium">
                  <GripVertical size={11} className="opacity-60" />
                  {i + 1}. {sp.name}
                  <button type="button" onClick={() => toggleSpecialty(id)} className="p-0.5 hover:bg-white/20 rounded-full">
                    <X size={11} />
                  </button>
                </li>
              )
            })}
          </ol>
        )}
        <div className="flex flex-wrap gap-1.5">
          {specialties
            .filter((s) => !selectedSpecialties.includes(s.id))
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSpecialty(s.id)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40 hover:text-primary transition-colors"
              >
                + {s.name}
              </button>
            ))}
        </div>
      </section>

      {/* ─── Dónde atiende ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Dónde atiende <span className="font-normal text-xs text-[var(--color-text-muted)]">— elige una clínica del catálogo + la tanda de consulta</span>
        </h2>
        {clinicRows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select
              value={row.clinicId}
              onChange={(e) => setClinicRows((prev) => prev.map((r, j) => (j === i ? { ...r, clinicId: e.target.value } : r)))}
              className={`${inputClass} max-w-64`}
            >
              <option value="">Elegir clínica...</option>
              {clinicOptions.map((c) => (
                <option key={c.id} value={c.id} disabled={clinicRows.some((r, j) => j !== i && r.clinicId === c.id)}>
                  {c.name} ({c.city?.name})
                </option>
              ))}
            </select>
            <input
              value={row.schedule}
              onChange={(e) => setClinicRows((prev) => prev.map((r, j) => (j === i ? { ...r, schedule: e.target.value } : r)))}
              className={inputClass}
              placeholder="Tanda: Lunes a viernes 8:00–12:00"
            />
            <button
              type="button"
              onClick={() => setClinicRows((prev) => prev.filter((_, j) => j !== i))}
              className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <button
            type="button"
            onClick={() => setClinicRows((prev) => [...prev, { clinicId: '', schedule: '' }])}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Plus size={13} /> Agregar otro lugar de atención
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">·</span>
          <button
            type="button"
            onClick={() => setShowClinicModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Plus size={13} /> ¿No está la clínica? Crearla ahora
          </button>
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Las clínicas salen del catálogo. Si la que buscas no aparece en la lista, créala con &ldquo;Crearla ahora&rdquo; — se agrega y queda seleccionada sin perder lo que cargaste hasta ahora.
        </p>
        {clinicRows.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Sin clínica el médico no aparece en el mapa, en &ldquo;cerca de mí&rdquo; ni en las páginas por ciudad.
          </p>
        )}
      </section>

      {/* ─── Seguros ─── */}
      <section className={sectionClass}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
            Seguros (ARS) que acepta <span className="font-normal text-xs text-[var(--color-text-muted)]">— el filtro #1 del paciente</span>
          </h2>
          {insurances.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelectedInsurances(
                  selectedInsurances.length === insurances.length ? [] : insurances.map((i) => i.id),
                )
              }
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
            >
              {selectedInsurances.length === insurances.length ? 'Quitar todos' : 'Seleccionar todos'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {insurances.map((ins) => (
            <button
              key={ins.id}
              type="button"
              onClick={() => toggleInsurance(ins.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedInsurances.includes(ins.id)
                  ? 'bg-primary text-white border-primary'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
              }`}
            >
              {ins.name}
            </button>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        {submitLabel}
      </button>

      {cropping && form.photoUrl && (
        <ImageCropModal
          imageUrl={baseImageUrl(form.photoUrl)}
          aspect={1}
          title="Recuadrar foto del médico"
          onSave={(crop: CropRegion | null) => {
            setForm((f) => ({ ...f, photoUrl: setImageCrop(f.photoUrl, crop) }))
            setCropping(false)
          }}
          onClose={() => setCropping(false)}
        />
      )}

      <ClinicFormModal
        open={showClinicModal}
        onClose={() => setShowClinicModal(false)}
        token={token}
        cities={cityOptions}
        onCityCreated={(city) => setCityOptions((prev) => [...prev, city].sort((a, b) => a.name.localeCompare(b.name)))}
        onSaved={handleClinicCreated}
        submitLabel="Crear y seleccionar"
      />
    </form>
  )
}
